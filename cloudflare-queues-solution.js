/**
 * Cloudflare Queues 解决方案架构
 * 彻底解决API频率限制问题
 */

// ==================== Queue配置 ====================
const QUEUE_CONFIG = {
  RSS_QUEUE: 'rss-processing-queue',
  BATCH_SIZE: 10,
  RETRY_ATTEMPTS: 3,
  DELAY_SECONDS: 30
};

// ==================== 主要改进架构 ====================

/**
 * 步骤1: 定时任务 - 轻量级RSS发现
 */
async function scheduledRSSDiscovery(env, event) {
  console.log('[定时任务] 开始RSS发现阶段...');
  
  // 只发现RSS源，不处理内容
  const rssFeeds = getConfiguredRSSFeeds(env, event.cron);
  
  // 将RSS源分批发送到Queue
  for (let i = 0; i < rssFeeds.length; i += QUEUE_CONFIG.BATCH_SIZE) {
    const batch = rssFeeds.slice(i, i + QUEUE_CONFIG.BATCH_SIZE);
    
    await env.RSS_QUEUE.send({
      type: 'RSS_BATCH',
      feeds: batch,
      timestamp: Date.now(),
      cronExpression: event.cron
    });
    
    console.log(`[Queue] 📤 发送批次 ${Math.floor(i/QUEUE_CONFIG.BATCH_SIZE)+1}: ${batch.length} 个RSS源`);
  }
  
  return { status: 'discovery_complete', batches: Math.ceil(rssFeeds.length / QUEUE_CONFIG.BATCH_SIZE) };
}

/**
 * 步骤2: Queue处理器 - 异步文章处理
 */
async function queueMessageHandler(batch, env) {
  console.log(`[Queue处理] 开始处理批次: ${batch.messages.length} 条消息`);
  
  for (const message of batch.messages) {
    try {
      const { type, feeds, timestamp, cronExpression } = message.body;
      
      if (type === 'RSS_BATCH') {
        await processRSSBatch(feeds, env, cronExpression);
      }
      
      // 消息处理成功
      message.ack();
      
    } catch (error) {
      console.error(`[Queue错误] 处理失败:`, error);
      
      // 重试逻辑
      if (message.attempts < QUEUE_CONFIG.RETRY_ATTEMPTS) {
        message.retry({ delaySeconds: QUEUE_CONFIG.DELAY_SECONDS });
      } else {
        message.ack(); // 超过重试次数，丢弃消息
      }
    }
  }
}

/**
 * 步骤3: RSS批量处理 - 无API限制
 */
async function processRSSBatch(feeds, env, cronExpression) {
  console.log(`[批量处理] 处理 ${feeds.length} 个RSS源`);
  
  // 1. 并行抓取RSS（无KV调用，无限制）
  const rssResults = await Promise.allSettled(
    feeds.map(async (feedUrl) => {
      const response = await fetch(feedUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Siji-Worker-Queue/3.0' }
      });
      
      if (!response.ok) return { feedUrl, articles: [] };
      
      const xmlText = await response.text();
      const articles = parseRSSArticles(xmlText, feedUrl);
      
      return { feedUrl, articles };
    })
  );
  
  // 2. 收集所有文章
  const allArticles = rssResults
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value.articles);
  
  // 3. 批量去重和处理（使用数据库批量操作）
  if (allArticles.length > 0) {
    await processBatchArticles(allArticles, env);
  }
  
  console.log(`[批量处理] 完成，处理了 ${allArticles.length} 篇文章`);
}

/**
 * 步骤4: 批量文章处理 - 优化数据库操作
 */
async function processBatchArticles(articles, env) {
  // 4.1 批量去重检查（一次查询多个URL）
  const urlsToCheck = articles.map(a => normalizeUrl(a.link));
  const existingUrls = await batchCheckExistingUrls(env, urlsToCheck);
  
  // 4.2 筛选新文章
  const newArticles = articles.filter(article => 
    !existingUrls.has(normalizeUrl(article.link))
  );
  
  console.log(`[去重] ${articles.length} 篇文章 → ${newArticles.length} 篇新文章`);
  
  // 4.3 批量AI处理
  const processedArticles = [];
  for (let i = 0; i < newArticles.length; i += 5) {
    const batch = newArticles.slice(i, i + 5);
    const aiResults = await batchAIProcessing(batch, env);
    processedArticles.push(...aiResults);
  }
  
  // 4.4 批量发布和推送
  if (processedArticles.length > 0) {
    await batchPublishAndNotify(processedArticles, env);
  }
}

module.exports = {
  scheduledRSSDiscovery,
  queueMessageHandler,
  processRSSBatch,
  processBatchArticles,
  QUEUE_CONFIG
};