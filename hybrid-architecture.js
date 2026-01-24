/**
 * D1数据库 + KV混合架构实现
 * 彻底解决API频率限制问题
 */

// ==================== 混合架构配置 ====================
const HYBRID_CONFIG = {
  // KV缓存配置（7天热数据）
  KV_CACHE: {
    URL_PREFIX: 'recent_url:',
    TITLE_PREFIX: 'recent_title:', 
    TTL: 7 * 24 * 3600, // 7天
    MAX_BATCH_CHECK: 30 // 限制KV批量检查数量
  },
  
  // D1数据库配置
  D1_DATABASE: {
    MAX_BATCH_INSERT: 50, // 批量插入限制
    MAX_BATCH_CHECK: 100  // 批量查询限制
  }
};

// ==================== 混合去重核心函数 ====================

/**
 * 超高效混合去重：KV + D1 两层架构
 * 解决API频率限制，支持大规模文章处理
 */
async function hybridBatchDeduplication(env, articles, logs) {
  if (!articles || articles.length === 0) {
    return [];
  }
  
  logs.push(`[混合去重] 🔄 开始处理 ${articles.length} 篇文章`);
  
  // 第1层：KV热缓存快速过滤（仅检查最近数据）
  const kvFiltered = await batchKVCheck(env, articles, logs);
  logs.push(`[KV缓存] ⚡ 快速过滤: ${articles.length} → ${kvFiltered.length} 篇`);
  
  if (kvFiltered.length === 0) {
    logs.push(`[混合去重] ✅ KV缓存已过滤所有文章`);
    return [];
  }
  
  // 第2层：D1数据库深度检查（历史数据去重）
  const finalUnique = await batchD1Check(env, kvFiltered, logs);
  logs.push(`[D1数据库] 🗄️ 深度去重: ${kvFiltered.length} → ${finalUnique.length} 篇`);
  
  logs.push(`[混合去重] ✅ 完成，最终获得 ${finalUnique.length} 篇独特文章`);
  return finalUnique;
}

/**
 * KV缓存批量检查（热数据，最近7天）
 */
async function batchKVCheck(env, articles, logs) {
  try {
    // 限制检查数量避免API过载
    const checkArticles = articles.slice(0, HYBRID_CONFIG.KV_CACHE.MAX_BATCH_CHECK);
    
    // 构建KV键名
    const kvKeys = checkArticles.map(article => 
      HYBRID_CONFIG.KV_CACHE.URL_PREFIX + normalizeUrl(article.link)
    );
    
    // 批量检查KV（并发但限制数量）
    const kvResults = await Promise.allSettled(
      kvKeys.map(key => env.ARTICLES_KV.get(key))
    );
    
    // 收集已存在的URL
    const existingUrls = new Set();
    kvResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const originalUrl = checkArticles[index].link;
        existingUrls.add(normalizeUrl(originalUrl));
        logs.push(`[KV缓存] 🎯 发现缓存: ${checkArticles[index].title.substring(0, 30)}...`);
      }
    });
    
    // 返回KV中不存在的文章
    const filtered = articles.filter(article => 
      !existingUrls.has(normalizeUrl(article.link))
    );
    
    logs.push(`[KV缓存] 📊 缓存命中: ${existingUrls.size} 篇，通过: ${filtered.length} 篇`);
    return filtered;
    
  } catch (error) {
    logs.push(`[KV缓存] ❌ 检查错误: ${error.message}，跳过KV检查`);
    return articles; // KV失败时返回原数组
  }
}

/**
 * D1数据库批量检查（全历史数据）
 */
async function batchD1Check(env, articles, logs) {
  if (!env.DB) {
    logs.push(`[D1数据库] ⚠️ 数据库未配置，跳过D1检查`);
    return articles;
  }
  
  if (articles.length === 0) {
    return [];
  }
  
  try {
    // 限制批量查询大小
    const checkArticles = articles.slice(0, HYBRID_CONFIG.D1_DATABASE.MAX_BATCH_CHECK);
    
    // 构建批量查询SQL
    const urls = checkArticles.map(article => {
      const url = normalizeUrl(article.link);
      return `'${url.replace(/'/g, "''")}'`; // SQL注入防护
    });
    
    const urlParams = urls.join(',');
    
    // 执行批量查询
    const query = `SELECT url FROM articles WHERE url IN (${urlParams})`;
    const result = await env.DB.prepare(query).all();
    
    // 收集数据库中已存在的URL
    const existingUrls = new Set(result.results.map(row => row.url));
    
    // 过滤出不存在的文章
    const uniqueArticles = articles.filter(article => {
      const normalized = normalizeUrl(article.link);
      const exists = existingUrls.has(normalized);
      if (exists) {
        logs.push(`[D1数据库] 🎯 发现重复: ${article.title.substring(0, 30)}...`);
      }
      return !exists;
    });
    
    logs.push(`[D1数据库] 📊 数据库命中: ${existingUrls.size} 篇，通过: ${uniqueArticles.length} 篇`);
    return uniqueArticles;
    
  } catch (error) {
    logs.push(`[D1数据库] ❌ 查询错误: ${error.message}，回退到原结果`);
    return articles; // D1失败时返回KV过滤后的结果
  }
}

/**
 * 批量插入到D1数据库
 */
async function batchInsertD1(env, processedArticles, logs) {
  if (!env.DB || !processedArticles || processedArticles.length === 0) {
    return;
  }
  
  try {
    // 分批处理避免SQL过长
    const batches = [];
    for (let i = 0; i < processedArticles.length; i += HYBRID_CONFIG.D1_DATABASE.MAX_BATCH_INSERT) {
      batches.push(processedArticles.slice(i, i + HYBRID_CONFIG.D1_DATABASE.MAX_BATCH_INSERT));
    }
    
    for (const batch of batches) {
      // 构建批量插入SQL
      const values = batch.map(article => {
        // SQL注入防护
        const url = normalizeUrl(article.link).replace(/'/g, "''");
        const title = (article.title || '').substring(0, 500).replace(/'/g, "''");
        const titleHash = generateTitleHash(article.title);
        const content = (article.description || '').substring(0, 2000).replace(/'/g, "''");
        const summaryZh = (article.summary_zh || '').substring(0, 1000).replace(/'/g, "''");
        const summaryEn = (article.summary_en || '').substring(0, 1000).replace(/'/g, "''");
        const keywordsZh = (article.keywords_zh || []).join(',').replace(/'/g, "''");
        const keywordsEn = (article.keywords_en || []).join(',').replace(/'/g, "''");
        const feed = (article.feedUrl || '').replace(/'/g, "''");
        
        return `(
          '${url}', '${title}', '${titleHash}', '${content}',
          '${summaryZh}', '${summaryEn}', '${keywordsZh}', '${keywordsEn}',
          '${feed}', 1, 0
        )`;
      }).join(',');
      
      // 批量插入（忽略重复）
      const insertSQL = `
        INSERT OR IGNORE INTO articles (
          url, title, title_hash, content,
          summary_zh, summary_en, keywords_zh, keywords_en,
          source_feed, ai_processed, published_to_payload
        ) VALUES ${values}
      `;
      
      await env.DB.prepare(insertSQL).run();
      logs.push(`[D1数据库] ✅ 批量插入 ${batch.length} 篇文章`);
    }
    
    logs.push(`[D1数据库] 🎯 总共插入 ${processedArticles.length} 篇文章到数据库`);
    
  } catch (error) {
    logs.push(`[D1数据库] ❌ 插入错误: ${error.message}`);
  }
}

/**
 * 异步更新KV缓存（不阻塞主流程）
 */
async function updateKVCacheAsync(env, articles, logs) {
  if (!articles || articles.length === 0) {
    return;
  }
  
  // 使用setTimeout异步执行，不阻塞主流程
  setTimeout(async () => {
    try {
      const timestamp = Date.now().toString();
      
      // 批量更新KV缓存
      const kvOperations = articles.map(article => {
        const urlKey = HYBRID_CONFIG.KV_CACHE.URL_PREFIX + normalizeUrl(article.link);
        return env.ARTICLES_KV.put(urlKey, timestamp, {
          expirationTtl: HYBRID_CONFIG.KV_CACHE.TTL
        });
      });
      
      // 并发执行，但捕获失败
      const results = await Promise.allSettled(kvOperations);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      logs.push(`[KV缓存] 🔄 异步更新缓存: ${successCount}/${articles.length} 成功`);
      
    } catch (error) {
      console.error('[KV缓存] 异步更新失败:', error);
    }
  }, 2000); // 2秒后异步执行
}

module.exports = {
  HYBRID_CONFIG,
  hybridBatchDeduplication,
  batchKVCheck,
  batchD1Check,
  batchInsertD1,
  updateKVCacheAsync
};