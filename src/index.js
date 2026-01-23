// ============================================
// 🔥 页面预热功能
// ============================================

async function warmupPages() {
  console.log('[Warmup] 🔥 开始预热所有页面...');
  
  const pages = [
    'https://sijigpt.com/',
    'https://sijigpt.com/posts',
    'https://sijigpt.com/archives',
    'https://sijigpt.com/tags'
  ];
  
  const startTime = Date.now();
  
  try {
    const results = await Promise.allSettled(
      pages.map(async (url) => {
        const pageStartTime = Date.now();
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'SijiGPT-Warmup-Bot/1.0',
              'Accept': 'text/html'
            }
          });
          
          const duration = Date.now() - pageStartTime;
          
          if (response.ok) {
            console.log(`[Warmup] ✅ ${url} - ${response.status} (${duration}ms)`);
            return { url, status: 'success', code: response.status, duration };
          } else {
            console.log(`[Warmup] ⚠️  ${url} - ${response.status} (${duration}ms)`);
            return { url, status: 'warning', code: response.status, duration };
          }
        } catch (error) {
          const duration = Date.now() - pageStartTime;
          console.log(`[Warmup] ❌ ${url} - ${error.message}`);
          return { url, status: 'error', error: error.message, duration };
        }
      })
    );
    
    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.value?.status === 'success').length;
    
    console.log(`[Warmup] 🎉 预热完成: ${successCount}/${pages.length} 成功，总耗时 ${totalDuration}ms`);
    
    return {
      success: true,
      total: pages.length,
      succeeded: successCount,
      duration: totalDuration,
      results: results.map(r => r.value)
    };
  } catch (error) {
    console.log(`[Warmup] ❌ 预热失败:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function callRevalidateAPI(env) {
  console.log('[Revalidate] 🔄 开始刷新前端...');
  
  try {
    const revalidateUrl = `${env.REVALIDATE_URL}?secret=${env.REVALIDATE_SECRET}`;
    
    const response = await fetch(revalidateUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'SijiGPT-Worker/1.0'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('[Revalidate] ✅ 页面已标记刷新:', result.paths?.join(', '));
      return { success: true, result };
    } else {
      const errorText = await response.text();
      console.log('[Revalidate] ❌ 失败:', response.status, errorText);
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.log('[Revalidate] ❌ 错误:', error.message);
    return { success: false, error: error.message };
  }
}

// ==================== 配置区 ====================

const AI_PROVIDERS = {
  OPENROUTER: 'openrouter',
  CLAUDE: 'claude',
  CLAUDE_AGENT: 'claude_agent'
};

const CLAUDE_CONFIG = {
  endpoint: 'https://api.anthropic.com/v1/messages',
  model: 'claude-3-5-sonnet-20241022',
  version: '2023-06-01'
};

const OPENROUTER_CONFIG = {
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  models: {
    // 内容判断和快速筛选 - 追求速度和低成本
    screening: [
      'groq/llama-3.1-70b-versatile',   // Groq - 极快推理，批量筛选首选
      'deepseek/deepseek-chat',         // DeepSeek - 高性价比
      'moonshot/moonshot-v1-8k',        // Kimi - 备用选项
      'qwen/qwen-2.5-72b-instruct'      // Qwen - 最后备用
    ],
    
    // 详细摘要生成 - 优先性价比，质量兼顾
    summarization: [
      'moonshot/moonshot-v1-8k',        // Kimi - 中文理解优秀，性价比好
      'deepseek/deepseek-chat',         // DeepSeek - 技术内容理解强，便宜
      'groq/llama-3.1-70b-versatile',   // Groq - 速度快，成本可控
      'qwen/qwen-2.5-72b-instruct'      // Qwen - 中文能力强
      // 完全移除 Claude 和 Gemini 2.5 Pro
    ],
    
    // 翻译和术语标注 - 中文优先，成本控制
    translation: [
      'moonshot/moonshot-v1-8k',        // Kimi - 中英文理解平衡，首选
      'deepseek/deepseek-chat',         // DeepSeek - 术语理解准确，便宜
      'qwen/qwen-2.5-72b-instruct',     // Qwen - 中文术语专业
      'groq/llama-3.1-70b-versatile'    // Groq - 快速处理
    ],
    
    // 默认降级序列 - 成本优先
    fallback: [
      'moonshot/moonshot-v1-8k',        // Kimi - 综合性能好，便宜
      'deepseek/deepseek-chat',         // DeepSeek - 技术内容强，便宜
      'groq/llama-3.1-70b-versatile',   // Groq - 速度快
      'qwen/qwen-2.5-72b-instruct'      // Qwen - 中文能力
    ]
  }
};

const CLAUDE_AGENT_CONFIG = {
  enabled: false,
  endpoint: '',
  features: {
    deepAnalysis: true,
    multiRound: true,
    customPrompts: true
  }
};

// ==================== RSS智能轮换配置 ====================

// 核心RSS源：每次必抓，最高质量AI内容
const CORE_RSS_FEEDS = [
  // 原有15个核心源
  'https://openai.com/blog/rss.xml',
  'https://blog.google/technology/ai/rss/',
  'https://www.deepmind.com/blog/rss.xml',
  'https://www.microsoft.com/en-us/research/feed/',
  'https://huggingface.co/blog/feed.xml',
  'https://aws.amazon.com/blogs/machine-learning/feed/',
  'https://blog.langchain.dev/rss/',
  'https://lilianweng.github.io/index.xml',
  'https://karpathy.github.io/feed.xml',
  'https://distill.pub/rss.xml',
  'https://arxiv.org/rss/cs.AI',
  'https://simonwillison.net/atom/entries/',
  'https://sebastianraschka.com/blog/index.xml',
  'https://developer.nvidia.com/blog/feed',
  'https://www.anthropic.com/news/rss.xml',
  
  // 新增10个高价值核心源
  'https://aimodels.substack.com/feed',
  'https://syncedreview.com/feed',
  'https://voicebot.ai/feed/',
  'https://aibusiness.com/rss.xml',
  'https://siliconangle.com/category/ai/feed',
  'https://bdtechtalks.com/feed/',
  'https://aisnakeoil.substack.com/feed',
  'https://thenewstack.io/feed',
  'https://insidebigdata.com/feed',
  'https://knowtechie.com/category/ai/feed/'
];

// 轮换RSS池：按时段轮换抓取
const ROTATION_RSS_POOLS = {
  // 美洲时段 (00:00) - 美洲AI公司和研究机构
  AMERICAS: [
    'https://www.404media.co/rss',
    'https://techcrunch.com/feed/',
    'https://venturebeat.com/category/ai/feed/',
    'https://www.wired.com/feed/tag/ai/latest/rss',
    'https://feeds.businessinsider.com/custom/all',
    'https://news.crunchbase.com/feed',
    'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    'https://www.theverge.com/rss/index.xml',
    'https://blog.paperspace.com/rss/',
    'https://replicate.com/blog/rss',
    'https://www.oneusefulthing.org/feed',
    'https://feeds.bloomberg.com/technology/news.rss',
    'https://blog.tensorflow.org/feeds/posts/default?alt=rss',
    'https://bair.berkeley.edu/blog/feed.xml',
    'https://crfm.stanford.edu/feed',
    'https://news.mit.edu/topic/mitmachine-learning-rss.xml',
    'https://www.technologyreview.com/feed/',
    'https://blog.ml.cmu.edu/feed',
    'https://minimaxir.com/post/index.xml',
    'https://stackoverflow.blog/feed/'
  ],
  
  // 欧洲时段 (04:00) - 欧洲AI研究和媒体
  EUROPE: [
    'https://theconversation.com/europe/topics/artificial-intelligence-ai-90/articles.atom',
    'https://www.theguardian.com/technology/artificialintelligenceai/rss',
    'https://sifted.eu/feed/?post_type=article',
    'https://tech.eu/category/deep-tech/feed',
    'https://tech.eu/category/robotics/feed',
    'https://www.siliconrepublic.com/feed',
    'https://techmonitor.ai/feed',
    'https://www.theregister.com/software/ai_ml/headlines.atom',
    'https://davidstutz.de/category/blog/feed',
    'https://mila.quebec/en/feed/',
    'https://www.philschmid.de/feed.xml',
    'https://explosion.ai/feed',
    'https://medium.com/feed/artificialis',
    'https://www.together.xyz/blog?format=rss',
    'https://neptune.ai/blog/feed',
    'https://blog.eleuther.ai/index.xml',
    'https://deephaven.io/blog/rss.xml',
    'https://restofworld.org/feed/latest',
    'https://the-decoder.com/feed/',
    'https://thegradient.pub/rss/'
  ],
  
  // 亚洲时段 (08:00) - 亚洲AI公司和全球学术
  ASIA: [
    'https://analyticsindiamag.com/feed/',
    'https://www.marktechpost.com/feed',
    'https://machinelearningmastery.com/blog/feed',
    'https://pyimagesearch.com/blog/feed',
    'https://debuggercafe.com/feed/',
    'https://www.kdnuggets.com/feed',
    'https://towardsdatascience.com/feed',
    'https://pub.towardsai.net/feed',
    'https://medium.com/feed/@netflixtechblog',
    'https://medium.com/feed/@odsc',
    'https://www.databricks.com/feed',
    'https://dagshub.com/blog/rss/',
    'https://wandb.ai/fully-connected/rss.xml',
    'https://lightning.ai/pages/feed/',
    'https://www.assemblyai.com/blog/rss/',
    'https://arxiv.org/rss/cs.LG',
    'https://arxiv.org/rss/cs.CV',
    'https://arxiv.org/rss/cs.CL',
    'https://arxiv.org/rss/stat.ML',
    'https://api.quantamagazine.org/feed'
  ],
  
  // 综合时段 (15:00) - 媒体、工具、其他
  GLOBAL: [
    'https://aiacceleratorinstitute.com/rss/',
    'https://ai-techpark.com/category/ai/feed/',
    'https://aibusiness.com/rss.xml',
    'https://www.artificialintelligence-news.com/feed/rss/',
    'https://aimodels.substack.com/feed',
    'https://aisnakeoil.substack.com/feed',
    'https://siliconangle.com/category/ai/feed',
    'https://siliconangle.com/category/big-data/feed',
    'https://insidebigdata.com/feed',
    'https://datafloq.com/feed/?post_type=post',
    'https://syncedreview.com/feed',
    'https://bdtechtalks.com/feed/',
    'https://www.unite.ai/feed/',
    'https://voicebot.ai/feed/',
    'https://knowtechie.com/category/ai/feed/',
    'https://feeds.arstechnica.com/arstechnica/index',
    'https://www.engadget.com/rss.xml',
    'https://gizmodo.com/rss',
    'https://www.techspot.com/backend.xml',
    'https://thenewstack.io/feed'
  ]
};

// RSS处理配置
const RSS_CONFIG = {
  // 性能限制 - 大规模扩容配置
  MAX_SOURCES_PER_RUN: 75,     // 每次最多处理75个源 (25核心+50轮换)
  MAX_CONCURRENT: 40,          // 最大并发数 - 提升并发能力
  SOURCE_TIMEOUT: 6000,        // 单源超时6秒 - 容错更多源
  TOTAL_TIMEOUT: 35000,        // 总执行时限35秒 - 支持大规模处理
  
  // 轮换策略
  CORE_COUNT: 25,              // 核心源数量（每次全取）- 大幅提升
  ROTATION_COUNT: 50,          // 每次轮换源数量 - 显著扩容
  
  // Cron时段映射
  CRON_TIME_ZONES: {
    '0 0 * * *': 'AMERICAS',   // 00:00 UTC - 美洲活跃时间
    '0 4 * * *': 'EUROPE',     // 04:00 UTC - 欧洲活跃时间  
    '0 8 * * *': 'ASIA',       // 08:00 UTC - 亚洲活跃时间
    '0 15 * * *': 'GLOBAL'     // 15:00 UTC - 全球综合时间
  }
};

/**
 * 智能RSS源选择器
 * 实现：核心源 + 分时段轮换源 + 动态限流
 */
function getConfiguredRSSFeeds(env, cronExpression) {
  try {
    // 1. 获取核心源（每次必抓）
    let selectedFeeds = [...CORE_RSS_FEEDS];
    
    // 2. 根据cron表达式确定时段
    const timeZone = RSS_CONFIG.CRON_TIME_ZONES[cronExpression] || 'GLOBAL';
    const rotationPool = ROTATION_RSS_POOLS[timeZone] || ROTATION_RSS_POOLS.GLOBAL;
    
    // 3. 随机选择轮换源
    const shuffledPool = [...rotationPool].sort(() => Math.random() - 0.5);
    const rotationFeeds = shuffledPool.slice(0, RSS_CONFIG.ROTATION_COUNT);
    
    selectedFeeds = [...selectedFeeds, ...rotationFeeds];
    
    // 4. 添加环境变量中的额外源
    const envFeeds = (env.RSS_FEEDS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    
    // 5. 去重并限制数量
    const uniqueFeeds = [...new Set([...selectedFeeds, ...envFeeds])];
    const finalFeeds = uniqueFeeds.slice(0, RSS_CONFIG.MAX_SOURCES_PER_RUN);
    
    console.log(`[RSS策略] 时段: ${timeZone}, 核心: ${CORE_RSS_FEEDS.length}, 轮换: ${rotationFeeds.length}, 总计: ${finalFeeds.length}`);
    
    return finalFeeds;
    
  } catch (error) {
    console.error('[RSS配置] 错误:', error.message);
    // 降级：只返回核心源
    return CORE_RSS_FEEDS.slice(0, 15);
  }
}

// ==================== 去重辅助函数 ====================

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    let normalized = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    normalized = normalized.toLowerCase().replace(/\/+$/, '');
    return normalized;
  } catch (error) {
    console.error('[URL] 解析失败:', url, error.message);
    return url.toLowerCase();
  }
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function generateTitleHash(title) {
  const normalized = title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return simpleHash(normalized);
}

/**
 * AI 生成内容指纹
 * 使用 Claude 3.5 提取文章核心关键词，生成内容指纹用于去重
 */
async function generateContentFingerprint(env, article) {
  try {
    const prompt = `Extract 3-5 core topic keywords from this article. Return ONLY comma-separated keywords in English, lowercase, no extra text.

Title: ${article.title}
Summary: ${article.summary ? article.summary?.substring ? article.summary.substring(0, 300) : (article.summary?.content || article.summary || "").substring(0, 300) : article.title}

Keywords:`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sijigpt.com',
        'X-Title': 'SiJiGPT'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API 错误: ${response.status}`);
    }

    const data = await response.json();
    const keywords = data.choices[0].message.content.trim().toLowerCase();
    
    // 排序关键词生成指纹
    const sorted = keywords.split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .sort()
      .join('-');
    
    return simpleHash(sorted);
  } catch (error) {
    console.error('[Fingerprint] 生成失败:', error.message);
    // 失败时使用标题哈希作为降级方案
    return generateTitleHash(article.title);
  }
}

/**
 * 三层去重检查
 * 第一层：URL 精确匹配
 * 第二层：标题相似度匹配
 * 第三层：内容指纹匹配（AI 辅助）
 */

/**
 * 截断标题，超出长度显示省略号
 * @param {string} title - 原标题
 * @param {number} maxLength - 最大长度（中文按2字符，英文按1字符计算）
 * @returns {string} 截断后的标题
 */
function truncateTitle(title, maxLength = 60) {
  if (!title) return '';
  
  let length = 0;
  let result = '';
  
  // 遍历每个字符
  for (const char of title) {
    // 中文、日文、韩文字符算 2 个长度，英文等其他字符算 1 个长度
    const charLength = /[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(char) ? 2 : 1;
    
    // 如果加上当前字符会超出长度限制，则停止并添加省略号
    if (length + charLength > maxLength) {
      return result.trim() + '...';
    }
    
    result += char;
    length += charLength;
  }
  
  return result;
}

async function checkDuplicates(env, article, logs) {
  const normalizedUrl = normalizeUrl(article.link);
  const titleHash = generateTitleHash(article.title);
  
  // 第一层：URL 精确去重
  const urlKey = `url:${normalizedUrl}`;
  const urlExists = await env.ARTICLES_KV.get(urlKey);
  if (urlExists) {
    logs.push(`[去重] ⏭️ URL 已存在: ${article.link}`);
    return true;
  }
  
  // 第二层：标题相似度去重
  const titleKey = `title:${titleHash}`;
  const titleExists = await env.ARTICLES_KV.get(titleKey);
  if (titleExists) {
    logs.push(`[去重] ⏭️ 相似标题已存在: ${article.title}`);
    return true;
  }
  
  // 第三层：内容指纹去重（AI 辅助）
  const fingerprint = await generateContentFingerprint(env, article);
  const fpKey = `fp:${fingerprint}`;
  const fpExists = await env.ARTICLES_KV.get(fpKey);
  if (fpExists) {
    logs.push(`[去重] ⏭️ 相似内容已存在: ${article.title}`);
    return true;
  }
  
  return false;
}

/**
 * 保存去重记录
 * 同时保存 URL、标题哈希、内容指纹三个键
 * TTL 设置为 30 天
 */
async function saveDuplicateKeys(env, article) {
  const normalizedUrl = normalizeUrl(article.link);
  const titleHash = generateTitleHash(article.title);
  const fingerprint = await generateContentFingerprint(env, article);
  
  const ttl = 2592000; // 30 天
  const timestamp = new Date().toISOString();
  
  // 保存三个去重键
  await env.ARTICLES_KV.put(`url:${normalizedUrl}`, JSON.stringify({
    publishedAt: timestamp,
    title: article.title
  }), { expirationTtl: ttl });
  
  await env.ARTICLES_KV.put(`title:${titleHash}`, JSON.stringify({
    publishedAt: timestamp,
    title: article.title
  }), { expirationTtl: ttl });
  
  await env.ARTICLES_KV.put(`fp:${fingerprint}`, JSON.stringify({
    publishedAt: timestamp,
    title: article.title
  }), { expirationTtl: ttl });
}

/**
 * 从 URL 提取来源名称
 * 例如：https://openai.com/blog/article → OpenAI Blog
 */
function extractSourceName(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace("www.", "");
    
    const sourceMap = {
      "openai.com": "OpenAI Blog",
      "anthropic.com": "Anthropic News",
      "blog.google": "Google AI Blog",
      "deepmind.com": "DeepMind Blog",
      "deepmind.google": "DeepMind Blog",
      "ai.meta.com": "Meta AI Blog",
      "microsoft.com": "Microsoft Research",
      "huggingface.co": "Hugging Face Blog",
      "aws.amazon.com": "AWS Machine Learning Blog",
      "blog.langchain.dev": "LangChain Blog",
      "lilianweng.github.io": "Lil'Log",
      "karpathy.github.io": "Andrej Karpathy Blog",
      "distill.pub": "Distill",
      "arxiv.org": "arXiv",
      "news.ycombinator.com": "Hacker News"
    };
    
    for (const [domain, name] of Object.entries(sourceMap)) {
      if (hostname.includes(domain)) {
        return name;
      }
    }
    
    return hostname.split(".")[0].charAt(0).toUpperCase() + hostname.split(".")[0].slice(1);
  } catch (error) {
    return "Unknown Source";
  }
}

// ==================== 主入口 ====================

export default {
  async scheduled(event, env, ctx) {
    console.log('[定时任务] 触发时间:', new Date().toISOString());
    console.log('[定时任务] Cron表达式:', event.cron);
    
    try {
      const result = await aggregateArticles(env, event.cron);
      console.log('[定时任务] 完成:', JSON.stringify(result));
    } catch (error) {
      console.error('[定时任务] 错误:', error);
    }
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    if (path === '/health' || path === '/') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'Siji Worker V2',
        provider: env.AI_PROVIDER || 'openrouter',
        timestamp: new Date().toISOString(),
        version: '2.0.1',
        rss_strategy: 'smart_rotation'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (path === '/test' && request.method === 'POST') {
      try {
        const result = await aggregateArticles(env, '0 15 * * *'); // 使用GLOBAL时段测试
        return new Response(JSON.stringify(result), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: error.message,
          stack: error.stack 
        }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    return new Response('Siji Worker V2 Running', { 
      status: 404,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
};

// ==================== 核心聚合逻辑 ====================

async function aggregateArticles(env, cronExpression = '0 15 * * *') {
  const logs = [];
  let count = 0;
  let published = 0;
  const publishedArticles = [];
  
  const rssFeeds = getConfiguredRSSFeeds(env, cronExpression);
  if (rssFeeds.length === 0) {
    logs.push('[RSS] ⚠️ 未配置任何 RSS 源');
    return {
      count,
      published,
      provider: env.AI_PROVIDER || 'openrouter',
      logs
    };
  }
  
  const dailyTarget = parseInt(env.DAILY_TARGET || '20', 10);
  
  logs.push(`[开始] 目标: ${dailyTarget} 篇, RSS 源: ${rssFeeds.length} 个`);
  logs.push(`[AI] 使用: ${env.AI_PROVIDER || 'openrouter'}`);

  for (const feedUrl of rssFeeds) {
    if (published >= dailyTarget) {
      logs.push(`[完成] 已达目标 ${dailyTarget} 篇，停止抓取`);
      break;
    }
    
    logs.push(`[RSS] 抓取: ${feedUrl}`);
    
    try {
      const response = await fetch(feedUrl, { 
        signal: AbortSignal.timeout(RSS_CONFIG.SOURCE_TIMEOUT),
        headers: { 'User-Agent': 'Siji-Worker/2.0' }
      });
      
      if (!response.ok) {
        logs.push(`[RSS] ❌ HTTP ${response.status}`);
        continue;
      }
      
      const xmlText = await response.text();
      
      const itemMatch = xmlText.match(/<item[^>]*>([\s\S]*?)<\/item>/i);
      if (!itemMatch) {
        logs.push(`[RSS] ⚠️ 未找到文章`);
        continue;
      }
      
      const itemContent = itemMatch[1];
      const title = extractTag(itemContent, 'title');
      const link = extractTag(itemContent, 'link');
      const description = extractTag(itemContent, 'description');
      
      if (!title || !link) {
        logs.push(`[RSS] ⚠️ 文章信息不完整`);
        continue;
      }
      
      count++;
      logs.push(`[RSS] 找到: ${title.substring(0, 50)}...`);
      
      
      // 三层去重检查
      const article = { link, title, summary: description };
      const isDuplicate = await checkDuplicates(env, article, logs);
      if (isDuplicate) {
        continue;
      }
      
      // AI 判定与双语内容生成 - 使用更宽松的筛选策略
      const aiData = await callAI(env, title, description, 'screening');
      
      if (!aiData || !aiData.relevant) {
        logs.push(`[AI] ⏭️ 不相关`);
        continue;
      }
      
      // 新的数据结构：AI 已返回完整双语内容
      const originalLang = aiData.original_language || "en";
      logs.push(`[AI] ✅ 相关, 原文语言: ${originalLang}`);
      logs.push(`[内容] 中文摘要: ${aiData.summary_zh.length} 字, 英文摘要: ${aiData.summary_en.length} 字`);
      
      // 确定最终标题（始终使用中文标题）
      const finalTitle = aiData.title_zh;
      const finalTitleEn = aiData.title_en;
      
      // 构建双语内容（按需求 2 的格式）
    // ============================================
      // 构建双语内容（HTML 格式，解决星号显示问题）
      // ============================================
      
      // ============================================
      // 构建双语内容（简化来源格式，完整标题自动换行）
      // ============================================
      
      // 准备原文标题数据
      const fullTitle = finalTitleEn || finalTitle; // 完整原文标题
      
      // 构建 HTML 格式的双语内容
      const bilingualContent = `
<p><strong>来源：</strong><a href="${link}" target="_blank" rel="noopener noreferrer">${fullTitle}</a></p>

---

<h2><strong>中文摘要</strong></h2>

${aiData.summary_zh}

<p><strong>关键词：</strong>${(aiData.keywords_zh || []).join("、")}</p>

---

<h2><strong>English Summary</strong></h2>

<p><strong>${finalTitleEn}</strong></p>

${aiData.summary_en}

<p><strong>Keywords:</strong> ${(aiData.keywords_en || []).join(", ")}</p>
`.trim();
      // 构建 Payload 数据对象
      const payloadData = {
        title: finalTitle,
        title_en: finalTitleEn,
        source: {
          url: link,
          name: extractSourceName(link)
        },
        summary_list_zh: aiData.summary_zh_short,
        summary_list_en: aiData.summary_en_short,
        summary_zh: {
          content: aiData.summary_zh,
          keywords: (aiData.keywords_zh || []).map(kw => ({ keyword: kw }))
        },
        summary_en: {
          content: aiData.summary_en,
          keywords: (aiData.keywords_en || []).map(kw => ({ keyword: kw }))
        },
        original_language: aiData.original_language || 'en',
        content: bilingualContent
      };

      const payloadSuccess = await publishToPayload(env, payloadData, logs);
      
      if (!payloadSuccess) {
        logs.push(`[Payload] ❌ 发布失败`);
        continue;
      }
      
      // 发送 Telegram 通知
      await sendBilingualToTelegram(env, {
        title: finalTitle,
        url: link,
        summary: aiData.summary_zh,
        translation: aiData.summary_en,
        language: originalLang
      }, logs);
      
      // 保存三层去重记录（30天 TTL）
      await saveDuplicateKeys(env, {
        link,
        title: finalTitle,
        summary: aiData.summary
      });
      
      published++;
      publishedArticles.push({ title: finalTitle, url: link });
      logs.push(`[发布] ✅ 成功 (${published}/${dailyTarget})`);
      
    } catch (error) {
      logs.push(`[错误] ${feedUrl}: ${error.message}`);
    }
  }
  
  logs.push(`[完成] 处理: ${count}, 发布: ${published}`);
  
  if (published > 0) {
    await sendSummaryToTelegram(env, publishedArticles, logs);
  }
  

  return {
    count,
    published,
    provider: env.AI_PROVIDER || 'openrouter',
    logs
  };
}

// ==================== AI 调用 ====================

function getAIProvider(env) {
  const provider = (env.AI_PROVIDER || 'openrouter').toLowerCase();
  
  if (provider === 'claude' && env.CLAUDE_API_KEY) {
    return AI_PROVIDERS.CLAUDE;
  }
  
  if (provider === 'claude_agent' && CLAUDE_AGENT_CONFIG.enabled) {
    return AI_PROVIDERS.CLAUDE_AGENT;
  }
  
  return AI_PROVIDERS.OPENROUTER;
}

async function callAI(env, title, description, purpose = 'summarization') {
  const provider = getAIProvider(env);
  
  try {
    if (provider === AI_PROVIDERS.CLAUDE) {
      return await callClaudeAI(env, title, description);
    } else if (provider === AI_PROVIDERS.CLAUDE_AGENT) {
      return await callClaudeAgent(env, title, description);
    } else {
      return await callOpenRouterAI(env, title, description, purpose);
    }
  } catch (error) {
    console.error(`[AI] ${provider} 失败:`, error);
    
    if (provider === AI_PROVIDERS.CLAUDE && env.OPENROUTER_API_KEY) {
      console.log('[AI] 回退到 OpenRouter');
      try {
        return await callOpenRouterAI(env, title, description, 'fallback');
      } catch (fallbackError) {
        console.error('[AI] OpenRouter 回退失败:', fallbackError);
      }
    }
    
    return null;
  }
}

async function callClaudeAI(env, title, description) {
    const prompt = `判断以下内容是否与人工智能领域相关，并生成完整的双语摘要。

标题: ${title}
描述: ${description}

相关范围（宽松判断）：
只要内容涉及以下任何一个方面即视为相关：
- AI/ML/DL 技术、算法、模型
- AI 应用、产品、工具
- AI 硬件、芯片、算力
- AI 公司、创业、融资
- AI 研究、论文、开源项目
- AI 政策、伦理、监管
- 与 AI 结合的任何领域（医疗、教育、金融等）

要求：
1. 检测原文语言（中文或英文）

2. 生成两个版本的摘要（重要：不要使用"本文"、"文章"、"该研究"、"本研究"、"文章讨论"等开头）：
   - 长摘要（500字）：全面覆盖要点，包含背景、方法、结论、影响
   - 短摘要（200字）：直接陈述核心内容，像新闻导语，高信息密度

3. 如果原文是英文：生成中文标题、中文长摘要、中文短摘要、英文长摘要、英文短摘要
4. 如果原文是中文：保留中文标题、生成中文长摘要、中文短摘要、英文标题、英文长摘要、英文短摘要
5. 专业术语处理：遇到AI/ML专业术语时，中文后加括号注明英文，如"大语言模型(Large Language Model)"、"强化学习(Reinforcement Learning)"
6. 提取 3-5 个中文关键词和 3-5 个英文关键词
7. 如果完全不相关，返回 relevant: false

示例格式：
长摘要示例：OpenAI发布GPT-4 Turbo，上下文窗口扩展至128K tokens，支持最新知识库至2024年4月。新模型在保持GPT-4性能的同时，显著降低了成本，输入价格降至每千tokens 0.01美元，输出价格为0.03美元。此外，GPT-4 Turbo还新增了图像理解、文本转语音、DALL·E 3集成等功能...

短摘要示例：OpenAI发布GPT-4 Turbo，上下文窗口扩展至128K tokens，成本大幅降低，新增多模态功能...

**必须严格返回纯 JSON**：
{
  "relevant": true,
  "original_language": "en",
  "title_zh": "中文标题",
  "title_en": "English Title",
  "summary_zh": "长摘要（500字左右）",
  "summary_zh_short": "短摘要（200字左右）",
  "summary_en": "Long summary (around 500 words)",
  "summary_en_short": "Short summary (around 200 words)",
  "keywords_zh": ["关键词1", "关键词2", "关键词3"],
  "keywords_en": ["keyword1", "keyword2", "keyword3"]
}`;

  const response = await fetch(CLAUDE_CONFIG.endpoint, {
    method: 'POST',
    headers: {
      'x-api-key': env.CLAUDE_API_KEY,
      'anthropic-version': CLAUDE_CONFIG.version,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: CLAUDE_CONFIG.model,
      max_tokens: 1024,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text;
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON in Claude response');
  }

  return JSON.parse(jsonMatch[0]);
}

async function callOpenRouterAI(env, title, description, purpose = 'fallback') {
  const prompt = `判断以下内容是否与人工智能领域相关，并生成完整的双语摘要。

标题: ${title}
描述: ${description}

相关范围包括但不限于:
⚠️ 采用极宽松判断标准 - 以下任何情况都视为AI相关：

✅ 直接AI相关:
- AI/ML/DL 技术: 机器学习、深度学习、大语言模型、计算机视觉、NLP、强化学习
- AI 应用: ChatGPT、Gemini、Claude、Stable Diffusion、Midjourney、视频生成(Sora/Veo)  
- AI 硬件: GPU、TPU、NPU、AI 芯片、算力、数据中心
- AI 平台/工具: TensorFlow、PyTorch、Hugging Face、LangChain、向量数据库
- AI 公司动态: OpenAI、Google DeepMind、Anthropic、Meta AI、NVIDIA、微软、亚马逊等的 AI 相关发布

✅ 间接AI相关:
- 任何公司的技术创新、产品发布、战略调整（大概率涉及AI）
- 编程工具、开发平台、数据科学、云计算服务
- 自动化、智能化、数字化转型相关内容
- PostgreSQL、数据库优化（AI训练基础设施）
- 搜索功能、推荐系统、用户体验改进

✅ 潜在AI相关:
- 科技公司的任何技术发布
- 新的软件功能、平台更新  
- 数据处理、API服务、云服务
- 甚至是创业融资、收购并购（可能涉及AI）

❌ 明确不相关:
- 纯娱乐、体育、政治内容
- 传统制造业、房地产
- 个人生活、旅游美食

🔑 关键原则：疑问时选择"相关" ✅

要求:
1. 检测原文语言（中文或英文）

2. 生成两个版本的摘要（重要：不要使用"本文"、"文章"、"该研究"、"本研究"、"文章讨论"等开头）：
   - 长摘要（500字）：全面覆盖要点，包含背景、方法、结论、影响
   - 短摘要（200字）：直接陈述核心内容，像新闻导语，高信息密度

3. 如果原文是英文：生成中文标题、中文长摘要、中文短摘要、英文长摘要、英文短摘要
4. 如果原文是中文：保留中文标题、生成中文长摘要、中文短摘要、英文标题、英文长摘要、英文短摘要
5. 专业术语处理：遇到AI/ML专业术语时，中文后加括号注明英文，如"大语言模型(Large Language Model)"、"强化学习(Reinforcement Learning)"
6. 提取 3-5 个中文关键词和 3-5 个英文关键词
7. 如果完全不相关，返回 relevant: false

示例格式：
长摘要示例：OpenAI发布GPT-4 Turbo，上下文窗口扩展至128K tokens，支持最新知识库至2024年4月。新模型在保持GPT-4性能的同时，显著降低了成本，输入价格降至每千tokens 0.01美元，输出价格为0.03美元。此外，GPT-4 Turbo还新增了图像理解、文本转语音、DALL·E 3集成等功能...

短摘要示例：OpenAI发布GPT-4 Turbo，上下文窗口扩展至128K tokens，成本大幅降低，新增多模态功能...

**重要**: 必须严格返回纯 JSON:
{
  "relevant": true,
  "original_language": "en",
  "title_zh": "中文标题",
  "title_en": "English Title",
  "summary_zh": "长摘要（500字左右）",
  "summary_zh_short": "短摘要（200字左右）",
  "summary_en": "Long summary (around 500 words)",
  "summary_en_short": "Short summary (around 200 words)",
  "keywords_zh": ["关键词1", "关键词2", "关键词3"],
  "keywords_en": ["keyword1", "keyword2", "keyword3"]
}`;

  // 根据用途选择模型
  const modelList = OPENROUTER_CONFIG.models[purpose] || OPENROUTER_CONFIG.models.fallback;
  console.log(`[AI] 使用${purpose}策略，可用模型: ${modelList.length}个`);
  
  for (let i = 0; i < modelList.length; i++) {
    const model = modelList[i];
    try {
      console.log(`[AI] 尝试模型 ${i + 1}/${modelList.length}: ${model} (${purpose})`);
      
      const response = await fetch(OPENROUTER_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sijigpt.com',
          'X-Title': 'SijiGPT'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI] 模型 ${model} 失败 ${response.status}:`, errorText.substring(0, 100));
        if (i < models.length - 1) {
          console.log(`[AI] ⏭️ 切换到下一个模型...`);
          continue;
        }
        throw new Error(`所有${purpose}模型都失败了`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        console.error(`[AI] 模型 ${model} 返回空内容`);
        if (i < models.length - 1) continue;
        throw new Error('AI返回空内容');
      }

      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleanedContent);
      
      console.log(`[AI] ✅ 模型 ${model} 成功`);
      return result;

    } catch (error) {
      console.error(`[AI] 模型 ${model} 错误:`, error.message);
      if (i < models.length - 1) {
        console.log(`[AI] ⏭️ 切换到下一个模型...`);
        continue;
      }
      throw error;
    }
  }
}

async function callClaudeAgent(env, title, description) {
  console.log('[AI] Claude Agent 暂未启用，回退到 OpenRouter');
  return await callOpenRouterAI(env, title, description, 'fallback');
}

// ==================== Payload 发布 (修复版) ====================

async function publishToPayload(env, article, logs) {
  // 步骤 1: 先登录获取 Token
  let token = env.PAYLOAD_TOKEN;
  
  if (!token) {
    if (!env.PAYLOAD_EMAIL || !env.PAYLOAD_PASSWORD) {
      logs.push('[Payload] ❌ 未配置认证信息 (需要 PAYLOAD_TOKEN 或 PAYLOAD_EMAIL + PAYLOAD_PASSWORD)');
      return false;
    }
    
    try {
      logs.push('[Payload] 开始登录...');
      const loginResponse = await fetch('https://payload-website-starter-blush-sigma.vercel.app/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: env.PAYLOAD_EMAIL,
          password: env.PAYLOAD_PASSWORD
        })
      });
      
      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        logs.push(`[Payload] ❌ 登录失败: ${errorText}`);
        return false;
      }
      
      const loginData = await loginResponse.json();
      token = loginData.token;
      logs.push('[Payload] ✅ 登录成功');
    } catch (error) {
      logs.push(`[Payload] ❌ 登录错误: ${error.message}`);
      return false;
    }
  } else {
    logs.push('[Payload] 使用已配置的 Token');
  }
  
  // 步骤 2: 发布文章
  try {
     // 构建 Payload 数据（双语格式）
    // 直接使用传入的 article（已包含正确的嵌套结构）
    article.slug = generateSlug(article.title, article.title_en, article.summary_en?.keywords || []);
    article.publishedAt = new Date().toISOString();
    article._status = "published";
    const response = await fetch('https://payload-website-starter-blush-sigma.vercel.app/api/posts', {
      method: 'POST',
      headers: {
        'Authorization': `JWT ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(article)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logs.push(`[Payload] ❌ 发布失败: ${errorText}`);
      return false;
    }
    
    const result = await response.json();
    logs.push(`[Payload] ✅ 发布成功 ID: ${result.doc.id}`);

    // 触发 Next.js 按需刷新
    if (env.REVALIDATE_URL && env.REVALIDATE_SECRET) {
      try {
        const revalidateResponse = await fetch(
          `${env.REVALIDATE_URL}?secret=${env.REVALIDATE_SECRET}`,
          { method: 'POST' }
        );
        
        if (revalidateResponse.ok) {
          
          logs.push('[Warmup] ⏳ 等待 2 秒后开始预热...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            const warmupResult = await warmupPages();
            if (warmupResult.success) {
              logs.push(`[Warmup] ✅ 预热成功: ${warmupResult.succeeded}/${warmupResult.total} 页面`);
            } else {
              logs.push(`[Warmup] ⚠️ 部分预热失败: ${warmupResult.succeeded}/${warmupResult.total}`);
            }
          } catch (warmupError) {
            logs.push(`[Warmup] ❌ 预热出错: ${warmupError.message}`);
          }
        } else {
          logs.push(`[Revalidate] ⚠️ 刷新失败`);
        }
      } catch (err) {
        logs.push(`[Revalidate] ⚠️ 刷新错误: ${err.message}`);
      }
    }
    
    
    
    return true;
  } catch (error) {
    logs.push(`[Payload] ❌ 发布异常: ${error.message}`);
    return false;
  }
}

// ==================== Telegram 通知 ====================

async function sendBilingualToTelegram(env, article, logs) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHANNEL) {
    logs.push(`[Telegram] ⏭️ 未配置`);
    return;
  }

  // 生成 sijigpt.com 文章链接（基于英文标题生成slug）
  const slug = generateSlug(article.title, article.title_en, article.keywords_en || []);
  const sijigptUrl = `https://sijigpt.com/posts/${slug}`;
  
  // TG消息格式：中文标题带超链接 + 中文摘要 + 原文链接
  const message = `📰 斯基GPT发布文章摘要

[**${article.title}**](${sijigptUrl})

${article.summary}

🔗 原文链接: ${article.url}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHANNEL,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      })
    });

    if (response.ok) {
      logs.push(`[Telegram] ✅ 已发送`);
    } else {
      const errorText = await response.text();
      logs.push(`[Telegram] ⚠️ 失败: ${response.status} - ${errorText.substring(0, 100)}`);
    }
  } catch (error) {
    logs.push(`[Telegram] ❌ 错误: ${error.message}`);
  }
}

async function sendSummaryToTelegram(env, articles, logs) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHANNEL) {
    return;
  }

  const articleList = articles.map((a, i) => `${i + 1}. ${a.title}`).join('\n');
  const message = `✅ 本次聚合完成

📊 发布了 ${articles.length} 篇文章:
${articleList}

🌐 查看网站: https://sijigpt.com`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHANNEL,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (response.ok) {
      logs.push(`[Telegram] ✅ 汇总已发送`);
    }
  } catch (error) {
    logs.push(`[Telegram] ❌ 汇总发送失败: ${error.message}`);
  }
}

// ==================== 工具函数 ====================

function extractTag(xml, tagName) {
  const match = xml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  if (!match) return '';
  
  let content = match[1].trim();
  content = content.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  content = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  content = content.replace(/<[^>]+>/g, '');
  
  return content;
}

function detectLanguage(text) {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const totalChars = text.length;
  return (chineseChars / totalChars) > 0.3 ? 'zh' : 'en';
}

function generateSlug(title, titleEn, keywords) {
  // 优先使用英文标题，其次用英文关键词，最后用中文标题
  let sourceText = titleEn || title;
  
  // 如果没有英文标题但有英文关键词，使用关键词组合
  if (!titleEn && keywords && keywords.length > 0) {
    sourceText = keywords.slice(0, 5).join(' '); // 最多取5个关键词
  }
  
  // 生成SEO友好的slug
  const baseSlug = sourceText
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-')     // 空格转连字符
    .replace(/-+/g, '-')      // 多个连字符合并
    .replace(/^-|-$/g, '')    // 移除首尾连字符
    .substring(0, 60);        // 限制长度
  
  // 确保不为空
  if (!baseSlug) {
    return `ai-article-${Date.now().toString(36)}`;
  }
  
  return baseSlug;
}