/**
 * D1数据库 + KV混合架构方案
 * 彻底解决API频率限制问题
 */

// ==================== D1数据库配置 ====================
const D1_SCHEMA = `
-- 文章主表
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_hash TEXT NOT NULL,
  content TEXT,
  summary_zh TEXT,
  summary_en TEXT,
  keywords_zh TEXT,
  keywords_en TEXT,
  source_feed TEXT,
  ai_processed BOOLEAN DEFAULT FALSE,
  published_to_payload BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- URL索引（去重用）
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_url ON articles(url);

-- 标题哈希索引（相似度去重）
CREATE INDEX IF NOT EXISTS idx_articles_title_hash ON articles(title_hash);

-- 源索引（按RSS源查询）
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_feed);

-- AI处理状态索引
CREATE INDEX IF NOT EXISTS idx_articles_ai_processed ON articles(ai_processed);
`;

// ==================== 混合架构设计 ====================

/**
 * 层级1: KV快速缓存 (最近7天热数据)
 * - 用途: 最近处理的文章快速去重
 * - 存储: url:hash → timestamp
 * - TTL: 7天自动过期
 */
const KV_CACHE_CONFIG = {
  URL_PREFIX: 'recent_url:',
  TITLE_PREFIX: 'recent_title:',
  TTL: 7 * 24 * 3600, // 7天
  BATCH_SIZE: 100
};

/**
 * 层级2: D1数据库 (永久存储 + 批量操作)
 * - 用途: 所有历史数据存储和复杂查询
 * - 优势: 批量操作、事务支持、SQL查询
 * - 性能: 1次查询检查100+篇文章
 */

// ==================== 混合去重策略 ====================

/**
 * 超高效批量去重：KV缓存 + D1数据库
 */
async function hybridBatchDeduplication(env, articles, logs) {
  logs.push(`[混合去重] 开始处理 ${articles.length} 篇文章`);
  
  // 第1层：KV热缓存快速过滤（毫秒级）
  const kvFiltered = await batchKVCheck(env, articles, logs);
  logs.push(`[KV缓存] 快速过滤: ${articles.length} → ${kvFiltered.length} 篇`);
  
  if (kvFiltered.length === 0) {
    return [];
  }
  
  // 第2层：D1数据库批量检查（秒级，但更全面）
  const finalUnique = await batchD1Check(env, kvFiltered, logs);
  logs.push(`[D1数据库] 深度去重: ${kvFiltered.length} → ${finalUnique.length} 篇`);
  
  // 第3层：更新KV缓存（异步，不阻塞主流程）
  updateKVCacheAsync(env, finalUnique, logs);
  
  return finalUnique;
}

/**
 * KV快速缓存检查
 */
async function batchKVCheck(env, articles, logs) {
  const kvKeys = articles.map(article => 
    KV_CACHE_CONFIG.URL_PREFIX + normalizeUrl(article.link)
  );
  
  // 批量检查KV（最多检查前50篇避免API限制）
  const checkKeys = kvKeys.slice(0, 50);
  const kvResults = await Promise.allSettled(
    checkKeys.map(key => env.ARTICLES_KV.get(key))
  );
  
  const existingUrls = new Set();
  kvResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      const originalUrl = articles[index].link;
      existingUrls.add(normalizeUrl(originalUrl));
    }
  });
  
  return articles.filter(article => 
    !existingUrls.has(normalizeUrl(article.link))
  );
}

/**
 * D1数据库批量检查
 */
async function batchD1Check(env, articles, logs) {
  if (!env.DB) {
    logs.push('[D1] 数据库未配置，跳过D1检查');
    return articles;
  }
  
  // 构建批量查询SQL
  const urls = articles.map(a => normalizeUrl(a.link));
  const urlParams = urls.map(url => `'${url.replace(/'/g, "''")}'`).join(',');
  
  try {
    // 一次查询检查所有URL
    const existingResult = await env.DB.prepare(`
      SELECT url FROM articles WHERE url IN (${urlParams})
    `).all();
    
    const existingUrls = new Set(existingResult.results.map(row => row.url));
    
    const uniqueArticles = articles.filter(article => 
      !existingUrls.has(normalizeUrl(article.link))
    );
    
    logs.push(`[D1] 数据库去重: ${articles.length} → ${uniqueArticles.length} 篇`);
    return uniqueArticles;
    
  } catch (error) {
    logs.push(`[D1] 查询错误，回退到KV: ${error.message}`);
    return articles; // D1失败时保持KV结果
  }
}

/**
 * 批量插入D1数据库
 */
async function batchInsertD1(env, processedArticles, logs) {
  if (!env.DB || processedArticles.length === 0) {
    return;
  }
  
  try {
    // 构建批量插入SQL
    const values = processedArticles.map(article => {
      const url = normalizeUrl(article.link).replace(/'/g, "''");
      const title = (article.title || '').replace(/'/g, "''");
      const titleHash = generateTitleHash(article.title);
      const content = (article.description || '').replace(/'/g, "''");
      const summaryZh = (article.summary_zh || '').replace(/'/g, "''");
      const summaryEn = (article.summary_en || '').replace(/'/g, "''");
      const feed = (article.feedUrl || '').replace(/'/g, "''");
      
      return `(
        '${url}', '${title}', '${titleHash}', '${content}',
        '${summaryZh}', '${summaryEn}', '${feed}', 1, 0
      )`;
    }).join(',');
    
    // 批量插入（忽略重复）
    await env.DB.prepare(`
      INSERT OR IGNORE INTO articles (
        url, title, title_hash, content,
        summary_zh, summary_en, source_feed, ai_processed, published_to_payload
      ) VALUES ${values}
    `).run();
    
    logs.push(`[D1] 批量插入 ${processedArticles.length} 篇文章到数据库`);
    
  } catch (error) {
    logs.push(`[D1] 插入错误: ${error.message}`);
  }
}

/**
 * 异步更新KV缓存
 */
async function updateKVCacheAsync(env, articles, logs) {
  // 异步执行，不阻塞主流程
  setTimeout(async () => {
    try {
      const kvOperations = articles.map(article => {
        const urlKey = KV_CACHE_CONFIG.URL_PREFIX + normalizeUrl(article.link);
        return env.ARTICLES_KV.put(urlKey, Date.now().toString(), {
          expirationTtl: KV_CACHE_CONFIG.TTL
        });
      });
      
      await Promise.allSettled(kvOperations);
      logs.push(`[KV缓存] 异步更新 ${articles.length} 个缓存键`);
      
    } catch (error) {
      console.error('[KV缓存] 更新失败:', error);
    }
  }, 1000);
}

module.exports = {
  D1_SCHEMA,
  hybridBatchDeduplication,
  batchKVCheck,
  batchD1Check,
  batchInsertD1,
  updateKVCacheAsync,
  KV_CACHE_CONFIG
};