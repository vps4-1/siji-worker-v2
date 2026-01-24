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
  model: 'anthropic/claude-3-5-haiku',  // 改为低成本的Haiku
  version: '2023-06-01'
};

const OPENROUTER_CONFIG = {
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  models: {
    // 内容判断和快速筛选 - Grok高速筛选优先
    screening: [
      'x-ai/grok-2-1212',                   // Grok 4.1 Fast - 高速筛选专用，速度最优
      'groq/llama-3.1-70b-versatile',      // Groq 70B - 快速备用
      'anthropic/claude-3-5-haiku',         // Claude 3.5 Haiku - 精细判断备用
      'groq/llama-3.1-8b-instant'          // Groq 8B - 最快备用
    ],
    
    // 详细摘要生成 - Claude质量优先策略
    summarization: [
      'anthropic/claude-3-5-haiku',         // Claude 3.5 Haiku - 摘要质量优秀，精细工作适用
      'x-ai/grok-2-1212',                   // Grok 4.1 Fast - 长上下文备用
      'groq/llama-3.1-70b-versatile',      // Groq 70B - 第二备用
      'deepseek/deepseek-chat'              // DeepSeek - 最终备用
    ],
    
    // 翻译和术语标注 - Grok优先策略
    translation: [
      'x-ai/grok-2-1212',                   // Grok 4.1 Fast - 多语言+成本优化
      'anthropic/claude-3-5-haiku',         // Claude 3.5 Haiku - 备用Agent能力
      'groq/llama-3.1-70b-versatile',      // Groq 70B - 专业术语
      'deepseek/deepseek-chat'              // DeepSeek - 技术术语备用
    ],
    
    // 默认降级序列 - Grok优先策略
    fallback: [
      'x-ai/grok-2-1212',                   // Grok 4.1 Fast - 速度+成本+理解力的完美组合
      'anthropic/claude-3-5-haiku',         // Claude 3.5 Haiku - 备用高质量
      'groq/llama-3.1-8b-instant',         // Groq 8B - 超速备用
      'deepseek/deepseek-chat'              // DeepSeek - 最终备用
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
  // 15个顶级核心源 - 保守稳定配置
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
  'https://www.anthropic.com/news/rss.xml'
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
    // 原有GLOBAL源
    'https://aiacceleratorinstitute.com/rss/',
    'https://ai-techpark.com/category/ai/feed/',
    'https://www.artificialintelligence-news.com/feed/rss/',
    'https://siliconangle.com/category/big-data/feed',
    'https://datafloq.com/feed/?post_type=post',
    'https://www.unite.ai/feed/',
    'https://feeds.arstechnica.com/arstechnica/index',
    'https://www.engadget.com/rss.xml',
    'https://gizmodo.com/rss',
    'https://www.techspot.com/backend.xml',
    
    // 从AMERICAS池补充
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
    
    // 从EUROPE池补充
    'https://magazine.sebastianraschka.com/feed',
    'https://www.nature.com/subjects/machine-learning.rss',
    'https://www.sciencedirect.com/science/journal/00200255/rss',
    'https://blog.deepmind.com/rss/',
    'https://www.imperial.ac.uk/news/rss/section/technology',
    'https://blog.research.google/feeds/posts/default?alt=rss',
    'https://eng.uber.com/category/articles/ai/feed',
    'https://www.anaconda.com/blog/feed',
    'https://analyticsindiamag.com/feed/',
    'https://stability.ai/blog?format=rss',
    
    // 从ASIA池补充
    'https://theconversation.com/europe/topics/artificial-intelligence-ai-90/articles.atom',
    'https://www.theguardian.com/technology/artificialintelligenceai/rss',
    'https://spacenews.com/tag/artificial-intelligence/feed/',
    'https://futurism.com/categories/ai-artificial-intelligence/feed',
    'https://blog.twitter.com/en_us/rss',
    'https://research.fb.com/feed/',
    'https://blogs.nvidia.com/feed/',
    'https://ai.googleblog.com/feeds/posts/default',
    'https://ainowinstitute.org/category/news/feed',
    'https://blog.baidu.com/rss',
    
    // 新增国际AI源
    'https://www.artificialintelligence-news.com/feed/',
    'https://artificialintelligenceact.com/feed/',
    'https://www.marktechpost.com/feed/',
    'https://towardsdatascience.com/feed',
    'https://machinelearningmastery.com/feed/',
    'https://www.kdnuggets.com/feed',
    'https://blog.paperswithcode.com/feed/',
    'https://research.google/rss/',
    'https://openai.com/research/rss/',
    'https://deepmind.com/research/rss/'
  ]
};

// RSS处理配置
const RSS_CONFIG = {
  // 性能限制 - 高速实用配置
  MAX_SOURCES_PER_RUN: 30,     // 每次最多处理30个源 (15核心+15轮换)
  MAX_CONCURRENT: 20,          // 最大并发数 - 高速平衡
  SOURCE_TIMEOUT: 4000,        // 单源超时4秒 - 实用设置
  TOTAL_TIMEOUT: 20000,        // 总执行时限20秒 - 高速实用
  
  // 轮换策略 - 高速实用
  CORE_COUNT: 15,              // 核心源数量 - 稳定覆盖
  ROTATION_COUNT: 15,          // 每次轮换源数量 - 高速实用
  
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
    console.log(`[RSS策略] 配置验证 - 核心源数量: ${CORE_RSS_FEEDS.length}, 应为25`);
    console.log(`[RSS策略] 配置验证 - 轮换源数量: ${rotationFeeds.length}, 应为50`);
    console.log(`[RSS策略] 配置验证 - 最终源数量: ${finalFeeds.length}, 应为75`);
    
    return finalFeeds;
    
  } catch (error) {
    console.error('[RSS配置] 错误:', error.message);
    console.error('[RSS配置] 堆栈:', error.stack);
    // 降级：返回所有核心源（而非只有15个）
    console.log(`[RSS配置] 降级模式：返回 ${CORE_RSS_FEEDS.length} 个核心源`);
    return CORE_RSS_FEEDS; // 返回全部25个核心源
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
        model: 'groq/llama-3.1-8b-instant',  // 改为最快的Groq模型
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
        rss_strategy: 'smart_rotation',
        telegram_webhook: '/telegram-webhook',
        features: ['RSS聚合', 'AI处理', 'Telegram集成', 'Payload发布']
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 📱 Telegram测试页面
    if (path === '/telegram-test' || path === '/test-page') {
      const html = await getTestPageHTML();
      return new Response(html, {
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 🔑 Payload连接测试端点
    if (url.pathname === '/test-payload' && request.method === 'POST') {
      try {
        const { email, password } = await request.json();
        
        // 尝试登录Payload获取Token
        const loginResponse = await fetch('https://payload-website-starter-onbwoq68m-billboings-projects.vercel.app/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SijiGPT-PayloadTest/1.0'
          },
          body: JSON.stringify({ email, password })
        });
        
        let loginResult;
        const contentType = loginResponse.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          loginResult = await loginResponse.json();
        } else {
          loginResult = await loginResponse.text();
        }
        
        console.log('[Payload Test] Login response status:', loginResponse.status);
        console.log('[Payload Test] Content-Type:', contentType);
        console.log('[Payload Test] Response preview:', typeof loginResult === 'string' ? loginResult.substring(0, 300) : JSON.stringify(loginResult).substring(0, 300));
        
        // 检查响应头中的Authorization或Set-Cookie
        const authHeader = loginResponse.headers.get('authorization');
        const setCookie = loginResponse.headers.get('set-cookie');
        
        return new Response(JSON.stringify({
          success: loginResponse.ok,
          status: loginResponse.status,
          contentType: contentType,
          authHeader: authHeader,
          setCookie: setCookie,
          responseData: typeof loginResult === 'string' ? loginResult.substring(0, 500) : loginResult,
          allHeaders: Object.fromEntries(loginResponse.headers.entries())
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
        
      } catch (error) {
        console.log('[Payload Test] Error:', error.message);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
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

    // 📱 Telegram Webhook 处理 - TG频道 → Payload发布
    if (path === '/telegram-webhook' && request.method === 'POST') {
      try {
        const telegramUpdate = await request.json();
        console.log('[TG Webhook] 收到更新:', JSON.stringify(telegramUpdate));
        
        // 验证是否来自授权的Telegram Bot
        const botToken = env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
          return new Response(JSON.stringify({ error: '未配置 TELEGRAM_BOT_TOKEN' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // 处理频道消息
        const result = await handleTelegramToPayload(env, telegramUpdate);
        
        return new Response(JSON.stringify(result), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        console.error('[TG Webhook] 处理错误:', error);
        return new Response(JSON.stringify({ 
          error: error.message,
          success: false 
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
      
      // 🚨 AI产品发布优先级检查 - 强制通过某些关键内容
      const forceIncludeKeywords = [
        'PostgreSQL', 'ChatGPT', 'Google', 'Microsoft', 'NVIDIA', 'OpenAI', 
        'Isaac', 'Replicate', 'Attention', 'Sparse', 'AI Mode', 'DRIVE AV',
        'Personal Intelligence', 'Gated Sparse'
      ];
      
      const shouldForceInclude = forceIncludeKeywords.some(keyword => 
        title.toLowerCase().includes(keyword.toLowerCase()) || 
        description?.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // 三层去重检查 - 但强制收录的文章绕过去重
      if (!shouldForceInclude) {
        const article = { link, title, summary: description };
        const isDuplicate = await checkDuplicates(env, article, logs);
        if (isDuplicate) {
          continue;
        }
      } else {
        logs.push(`[去重] 🚨 强制收录跳过去重检查: ${title.substring(0, 50)}...`);
      }

      // AI 判定与双语内容生成 - 使用更宽松的筛选策略
      const aiData = await callAI(env, title, description, 'screening');
      
      // 优化后的强制收录逻辑：确保AI产品发布优先
      if (!aiData || !aiData.relevant) {
        if (shouldForceInclude) {
          // 强制收录：优先尝试AI，失败则创建高质量基础内容
          logs.push(`[AI] 🚨 强制收录，尝试AI处理: ${title.substring(0, 50)}...`);
          const forceAiData = await callAI(env, title, description, 'screening');
          
          if (forceAiData && forceAiData.title_zh && forceAiData.summary_zh) {
            // AI成功，使用AI生成的高质量内容
            forceAiData.relevant = true;
            finalAiData = forceAiData;
            logs.push(`[AI] ✅ AI处理成功，已生成专业内容`);
          } else {
            // AI失败，创建结构化的基础内容确保发布
            logs.push(`[AI] ⚠️ AI失败，生成基础内容确保发布`);
            
            // 直接创建基础内容，避免函数调用问题
            const intelligentTitle = generateIntelligentTitle(title);
            finalAiData = {
              relevant: true,
              original_language: 'en',
              title_zh: intelligentTitle,
              title_en: title,
              summary_zh: `${intelligentTitle}是${extractTechnicalField(title)}领域的重要进展。${description || '该技术展示了最新的研究成果和应用前景。'}这一创新为相关技术发展提供了新的思路，预期将在AI技术应用中产生积极影响。`,
              summary_zh_short: `${intelligentTitle}：${extractTechnicalField(title)}领域的技术突破，展现了重要的应用价值和发展前景。`,
              summary_en: `${title} represents a significant advancement in the field of technology. ${description || 'This development showcases the latest research achievements and application prospects.'} The innovation provides new insights for related technological development and is expected to have a positive impact on AI technology applications.`,
              summary_en_short: `${title}: A technological breakthrough with important application value and development prospects.`,
              keywords_zh: extractIntelligentKeywords(title, 'zh'),
              keywords_en: extractIntelligentKeywords(title, 'en')
            };
            
            logs.push(`[AI] 📝 基础内容已生成，确保AI产品发布不遗漏`);
          }
        } else {
          logs.push(`[AI] ⏭️ 不相关`);
          continue;
        }
      } else {
        // 正常AI处理流程
        finalAiData = aiData;
      }
      
      // 新的数据结构：AI 已返回完整双语内容
      const originalLang = finalAiData.original_language || "en";
      logs.push(`[AI] ✅ 相关, 原文语言: ${originalLang}`);
      logs.push(`[内容] 中文摘要: ${finalAiData.summary_zh.length} 字, 英文摘要: ${finalAiData.summary_en.length} 字`);
      
      // 确定最终标题（始终使用中文标题）
      const finalTitle = finalAiData.title_zh;
      const finalTitleEn = finalAiData.title_en;
      
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

${finalAiData.summary_zh}

<p><strong>关键词：</strong>${(finalAiData.keywords_zh || []).join("、")}</p>

---

<h2><strong>English Summary</strong></h2>

<p><strong>${finalTitleEn}</strong></p>

${finalAiData.summary_en}

<p><strong>Keywords:</strong> ${(finalAiData.keywords_en || []).join(", ")}</p>
`.trim();
      // 构建 Payload 数据对象
      const payloadData = {
        title: finalTitle,
        title_zh: finalTitle,
        title_en: finalTitleEn,
        source: {
          url: link,
          name: extractSourceName(link)
        },
        summary_list_zh: finalAiData.summary_zh_short,
        summary_list_en: finalAiData.summary_en_short,
        summary_zh: {
          content: finalAiData.summary_zh,
          keywords: (finalAiData.keywords_zh || []).map(kw => ({ keyword: kw }))
        },
        summary_en: {
          content: finalAiData.summary_en,
          keywords: (finalAiData.keywords_en || []).map(kw => ({ keyword: kw }))
        },
        original_language: finalAiData.original_language || 'en',
        content: bilingualContent
      };

      const payloadSuccess = await publishToPayload(env, payloadData, logs, shouldForceInclude);
      
      if (!payloadSuccess) {
        logs.push(`[Payload] ❌ 发布失败`);
        continue;
      }
      
      // 发送 Telegram 通知
      await sendBilingualToTelegram(env, {
        title: finalTitle,
        url: link,
        summary: finalAiData.summary_zh,
        translation: finalAiData.summary_en,
        language: originalLang
      }, logs);
      
      // 保存三层去重记录（30天 TTL）
      await saveDuplicateKeys(env, {
        link,
        title: finalTitle,
        summary: finalAiData.summary_zh || description
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

// 创建基础内容的后备方案（确保AI产品发布不遗漏）
function createFallbackContent(title, description) {
  // 智能中文标题生成
  const chineseTitle = generateIntelligentTitle(title);
  
  // 基于标题和描述生成结构化摘要
  const chineseSummary = generateStructuredSummary(title, description, 'zh');
  const englishSummary = generateStructuredSummary(title, description, 'en');
  
  // 智能关键词提取
  const chineseKeywords = extractIntelligentKeywords(title, 'zh');
  const englishKeywords = extractIntelligentKeywords(title, 'en');
  
  return {
    relevant: true,
    original_language: 'en',
    title_zh: chineseTitle,
    title_en: title,
    summary_zh: chineseSummary,
    summary_zh_short: chineseSummary.substring(0, 200) + (chineseSummary.length > 200 ? '...' : ''),
    summary_en: englishSummary,
    summary_en_short: englishSummary.substring(0, 200) + (englishSummary.length > 200 ? '...' : ''),
    keywords_zh: chineseKeywords,
    keywords_en: englishKeywords
  };
}

// 智能中文标题生成（比简单映射更好）
function generateIntelligentTitle(englishTitle) {
  // 专业术语映射表
  const termMap = {
    'Personal Intelligence': '个人智能',
    'AI Mode': 'AI模式', 
    'Search': '搜索功能',
    'Multimodal': '多模态',
    'reinforcement learning': '强化学习',
    'Deep Neural Nets': '深度神经网络',
    'Gated Sparse Attention': '门控稀疏注意力机制',
    'Computational Efficiency': '计算效率优化',
    'Training Stability': '训练稳定性',
    'Long-Context': '长上下文',
    'Language Models': '语言模型',
    'Fine-Tune': '微调',
    'FLUX Model': 'FLUX模型',
    'PostgreSQL': 'PostgreSQL数据库',
    'ChatGPT': 'ChatGPT',
    'Isaac': 'Isaac模型',
    'Replicate': 'Replicate平台',
    'TensorFlow': 'TensorFlow框架',
    'NVIDIA': '英伟达',
    'Google': '谷歌',
    'Microsoft': '微软',
    'OpenAI': 'OpenAI'
  };
  
  let translatedTitle = englishTitle;
  
  // 应用专业术语映射
  for (const [en, zh] of Object.entries(termMap)) {
    const regex = new RegExp(en, 'gi');
    translatedTitle = translatedTitle.replace(regex, zh);
  }
  
  // 如果翻译程度不够，添加中文描述前缀
  if (!/[\u4e00-\u9fa5]{6,}/.test(translatedTitle)) {
    if (englishTitle.toLowerCase().includes('ai') || 
        englishTitle.toLowerCase().includes('machine learning') ||
        englishTitle.toLowerCase().includes('deep learning')) {
      translatedTitle = `AI技术突破：${translatedTitle}`;
    } else if (englishTitle.toLowerCase().includes('google') || 
               englishTitle.toLowerCase().includes('microsoft') || 
               englishTitle.toLowerCase().includes('openai')) {
      translatedTitle = `科技巨头发布：${translatedTitle}`;
    } else {
      translatedTitle = `前沿技术：${translatedTitle}`;
    }
  }
  
  return translatedTitle;
}

// 生成结构化摘要
function generateStructuredSummary(title, description, lang) {
  const content = description || title;
  
  if (lang === 'zh') {
    // 中文摘要结构化生成
    const titleZh = generateIntelligentTitle(title);
    
    let summary = '';
    
    // 根据内容类型生成不同结构的摘要
    if (title.toLowerCase().includes('release') || title.toLowerCase().includes('launch')) {
      summary = `${titleZh}正式发布。该技术在${extractTechnicalField(title)}领域实现重要突破，`;
    } else if (title.toLowerCase().includes('research') || title.toLowerCase().includes('paper')) {
      summary = `最新研究${titleZh}揭示了${extractTechnicalField(title)}的新进展，`;
    } else {
      summary = `${titleZh}展示了${extractTechnicalField(title)}领域的最新发展，`;
    }
    
    // 添加技术描述
    if (content.length > 50) {
      summary += `具体表现为：${content.substring(0, 300)}。`;
    } else {
      summary += `为相关技术发展提供了新的思路和解决方案。`;
    }
    
    // 添加影响描述
    summary += `这一进展对于AI技术的实际应用和未来发展具有重要意义，预期将在相关领域产生积极影响。`;
    
    return summary;
    
  } else {
    // 英文摘要
    let summary = `${title} represents a significant advancement in ${extractTechnicalField(title)}. `;
    
    if (content.length > 50) {
      summary += `${content.substring(0, 300)}. `;
    } else {
      summary += `This development introduces innovative approaches and solutions to current technical challenges. `;
    }
    
    summary += `The implementation is expected to have substantial impact on AI technology applications and future development in related fields.`;
    
    return summary;
  }
}

// 提取技术领域
function extractTechnicalField(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('search') || titleLower.includes('retrieval')) return '搜索技术';
  if (titleLower.includes('language model') || titleLower.includes('llm')) return '大语言模型';
  if (titleLower.includes('reinforcement') || titleLower.includes('rl')) return '强化学习';  
  if (titleLower.includes('neural network') || titleLower.includes('deep')) return '深度学习';
  if (titleLower.includes('attention') || titleLower.includes('transformer')) return '注意力机制';
  if (titleLower.includes('multimodal')) return '多模态AI';
  if (titleLower.includes('database') || titleLower.includes('postgresql')) return '数据库技术';
  if (titleLower.includes('computer vision') || titleLower.includes('image')) return '计算机视觉';
  if (titleLower.includes('nlp') || titleLower.includes('text')) return '自然语言处理';
  
  return 'AI技术';
}

// 智能关键词提取
function extractIntelligentKeywords(title, lang) {
  const titleLower = title.toLowerCase();
  
  if (lang === 'zh') {
    const keywords = [];
    
    // 基于内容智能添加关键词
    if (titleLower.includes('ai') || titleLower.includes('intelligence')) keywords.push('人工智能');
    if (titleLower.includes('machine learning') || titleLower.includes('ml')) keywords.push('机器学习');
    if (titleLower.includes('deep learning') || titleLower.includes('neural')) keywords.push('深度学习');
    if (titleLower.includes('language model') || titleLower.includes('llm')) keywords.push('大语言模型');
    if (titleLower.includes('search') || titleLower.includes('retrieval')) keywords.push('搜索技术');
    if (titleLower.includes('google')) keywords.push('谷歌');
    if (titleLower.includes('microsoft')) keywords.push('微软');
    if (titleLower.includes('openai')) keywords.push('OpenAI');
    if (titleLower.includes('nvidia')) keywords.push('英伟达');
    if (titleLower.includes('database') || titleLower.includes('postgresql')) keywords.push('数据库');
    
    // 确保至少有3个关键词
    if (keywords.length < 3) {
      const defaultKeywords = ['前沿技术', '技术创新', '科技发展'];
      keywords.push(...defaultKeywords.slice(0, 3 - keywords.length));
    }
    
    return keywords.slice(0, 5); // 最多5个
    
  } else {
    const keywords = [];
    
    // 英文关键词提取
    if (titleLower.includes('ai') || titleLower.includes('intelligence')) keywords.push('Artificial Intelligence');
    if (titleLower.includes('machine learning') || titleLower.includes('ml')) keywords.push('Machine Learning');
    if (titleLower.includes('deep learning') || titleLower.includes('neural')) keywords.push('Deep Learning');
    if (titleLower.includes('language model') || titleLower.includes('llm')) keywords.push('Language Models');
    if (titleLower.includes('search') || titleLower.includes('retrieval')) keywords.push('Search Technology');
    if (titleLower.includes('multimodal')) keywords.push('Multimodal AI');
    if (titleLower.includes('attention') || titleLower.includes('transformer')) keywords.push('Attention Mechanism');
    if (titleLower.includes('reinforcement')) keywords.push('Reinforcement Learning');
    if (titleLower.includes('computer vision')) keywords.push('Computer Vision');
    if (titleLower.includes('nlp')) keywords.push('Natural Language Processing');
    
    // 确保至少有3个关键词
    if (keywords.length < 3) {
      const defaultKeywords = ['Technology Innovation', 'AI Research', 'Technical Development'];
      keywords.push(...defaultKeywords.slice(0, 3 - keywords.length));
    }
    
    return keywords.slice(0, 5); // 最多5个
  }
}

// 手动标题翻译映射（保留原功能作为备用）
function translateTitleManually(title) {
  // 基本翻译映射表
  const translations = {
    'How to': '如何',
    'Fine-Tune': '微调',
    'FLUX Model': 'FLUX模型',
    'PostgreSQL': 'PostgreSQL数据库',
    'ChatGPT': 'ChatGPT',
    'Personal Intelligence': '个人智能',
    'AI Mode': 'AI模式',
    'Search': '搜索',
    'Gated Sparse Attention': '门控稀疏注意力',
    'Computational Efficiency': '计算效率',
    'Training Stability': '训练稳定性',
    'Long-Context': '长上下文',
    'Language Models': '语言模型',
    'Deep Neural Nets': '深度神经网络',
    'Multimodal': '多模态',
    'Reinforcement Learning': '强化学习',
    'Isaac': 'Isaac模型',
    'Replicate': 'Replicate平台',
    'RL without TD learning': '无TD学习的强化学习',
    'The Download': '技术下载',
    'chatbots for health': '健康聊天机器人',
    'AI regulation': 'AI监管',
    'Google Photos': '谷歌相册',
    'meme': '表情包'
  };
  
  let translated = title;
  
  // 应用翻译映射
  for (const [en, zh] of Object.entries(translations)) {
    const regex = new RegExp(en, 'gi');
    translated = translated.replace(regex, zh);
  }
  
  // 如果没有翻译成功，生成通用中文标题
  if (translated === title || !/[\u4e00-\u9fa5]/.test(translated)) {
    if (title.includes('AI') || title.includes('ChatGPT') || title.includes('GPT')) {
      translated = `AI技术：${title}`;
    } else if (title.includes('Google') || title.includes('Microsoft') || title.includes('OpenAI')) {
      translated = `科技动态：${title}`;
    } else {
      translated = `技术文章：${title}`;
    }
  }
  
  return translated;
}

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
      return await callClaudeAI(env, title, description, purpose);
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

async function callClaudeAI(env, title, description, purpose = 'screening') {
    const isForcedScreening = purpose === 'forced_screening';
    const isForceTranslation = purpose === 'forced_translation';
    
    const prompt = isForcedScreening ? 
    `🚨 强制筛选模式：必须将此内容判定为AI相关并生成高质量双语摘要！

【输入】
标题: ${title}
描述: ${description}

【强制要求】
1. 必须判定为 relevant: true
2. 生成专业的中文标题（完整翻译，不保留英文）
3. 生成高质量的中文和英文摘要
4. 不允许使用"这是一篇关于..."等模板化开头
5. 摘要要有实质内容，体现技术价值

【输出格式】严格按照此JSON格式返回：
{
  "relevant": true,
  "original_language": "en", 
  "title_zh": "专业的完整中文标题",
  "title_en": "${title}",
  "summary_zh": "专业的中文技术摘要，约500字，体现技术创新点和应用价值",
  "summary_zh_short": "简洁的中文摘要，约200字，突出核心要点", 
  "summary_en": "Professional English summary (around 500 words)",
  "summary_en_short": "Concise English summary (around 200 words)",
  "keywords_zh": ["专业中文关键词1","关键词2","关键词3"],
  "keywords_en": ["professional_keyword1","keyword2","keyword3"]
}` : 
    isForceTranslation ? 
    `强制翻译模式：必须将以下英文内容翻译为中文，生成完整的双语摘要。

【输入】
标题: ${title}
描述: ${description}

【翻译要求】
1. 必须将英文标题完整翻译为中文
2. 必须将描述翻译为中文摘要  
3. 不允许保留英文原标题
4. 中文摘要要自然流畅，不要有多余的换行符
5. 生成专业的技术文章摘要

【输出格式】严格按照此JSON格式返回：
{
  "relevant": true,
  "original_language": "en",
  "title_zh": "完整的中文翻译标题（必须是中文）",
  "title_en": "${title}",
  "summary_zh": "详细的中文技术摘要，约500字，必须是中文，描述技术要点和意义",
  "summary_zh_short": "简短的中文摘要，约200字，必须是中文",
  "summary_en": "Detailed English summary (around 500 words)",
  "summary_en_short": "Short English summary (around 200 words)", 
  "keywords_zh": ["中文关键词1","中文关键词2","中文关键词3"],
  "keywords_en": ["keyword1","keyword2","keyword3"]
}

【示例】
输入标题: "How to Fine-Tune a FLUX Model"
输出title_zh: "如何微调FLUX模型" (不是 "How to Fine-Tune a FLUX Model")

严格按照要求翻译，title_zh必须是中文！`
    : `判断以下内容是否与人工智能领域相关，并生成完整的双语摘要。

标题: ${title}
描述: ${description}

🔥 重要：以下任何情况都必须判为【相关】！

📋 强制【相关】的关键词（包含任一即算）：
AI, ML, LLM, GPT, ChatGPT, OpenAI, Claude, Gemini, Google, Microsoft, Amazon, Meta, Apple, NVIDIA, Anthropic, PostgreSQL, 搜索, 机器学习, 深度学习, 算法, 数据库, 云计算, API, SDK, Isaac, Replicate, Attention, Sparse

📋 强制【相关】的产品发布类型：
- ✅ 任何AI/ML相关产品发布（Isaac 0.1, Google AI搜索等）  
- ✅ 大厂技术基础设施（PostgreSQL for ChatGPT等）
- ✅ 开发者工具和平台（Replicate, SDK等）
- ✅ 研究论文和技术突破（Attention机制等）
- ✅ AI安全和伦理讨论（虚假信息检测等）
- ✅ 自动驾驶和机器人技术（NVIDIA DRIVE等）

📋 强制【相关】的公司（发布的任何技术都算）：
OpenAI, Google, Microsoft, Meta, Amazon, Apple, NVIDIA, Anthropic, Replicate, Hugging Face

🚨 特别强调：AI产品发布必须推送！
- Isaac模型发布 ✅
- Google搜索AI功能 ✅  
- NVIDIA自动驾驶技术 ✅
- PostgreSQL优化（支撑AI服务）✅
- 任何大模型相关基础设施 ✅

⭐ 重要原则: 宁可多收录100篇，不要遗漏1个AI产品发布！

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
  const isForcedScreening = purpose === 'forced_screening';
  const isForceTranslation = purpose === 'forced_translation';
  
  const prompt = isForcedScreening ?
  `🚨 强制筛选模式：必须将此内容判定为AI相关并生成高质量双语摘要！

【输入】
标题: ${title}
描述: ${description}

【强制要求】
1. 必须判定为 relevant: true
2. 生成专业的中文标题（完整翻译，不保留英文）
3. 生成高质量的中文和英文摘要
4. 不允许使用"这是一篇关于..."等模板化开头
5. 摘要要有实质内容，体现技术价值

【输出格式】严格按照此JSON格式返回：
{
  "relevant": true,
  "original_language": "en",
  "title_zh": "专业的完整中文标题",
  "title_en": "${title}",
  "summary_zh": "专业的中文技术摘要，约500字，体现技术创新点和应用价值",
  "summary_zh_short": "简洁的中文摘要，约200字，突出核心要点",
  "summary_en": "Professional English summary (around 500 words)",
  "summary_en_short": "Concise English summary (around 200 words)",
  "keywords_zh": ["专业中文关键词1","关键词2","关键词3"],
  "keywords_en": ["professional_keyword1","keyword2","keyword3"]
}` :
  isForceTranslation ?
  `强制翻译模式：必须将以下英文内容翻译为中文，生成完整的双语摘要。

【输入】
标题: ${title}
描述: ${description}

【翻译要求】
1. 必须将英文标题完整翻译为中文
2. 必须将描述翻译为中文摘要
3. 不允许保留英文原标题
4. 中文摘要要自然流畅，不要有多余的换行符
5. 生成专业的技术文章摘要

【输出格式】严格按照此JSON格式返回：
{
  "relevant": true,
  "original_language": "en",
  "title_zh": "完整的中文翻译标题（必须是中文）",
  "title_en": "${title}",
  "summary_zh": "详细的中文技术摘要，约500字，必须是中文，描述技术要点和意义",
  "summary_zh_short": "简短的中文摘要，约200字，必须是中文", 
  "summary_en": "Detailed English summary (around 500 words)",
  "summary_en_short": "Short English summary (around 200 words)",
  "keywords_zh": ["中文关键词1","中文关键词2","中文关键词3"],
  "keywords_en": ["keyword1","keyword2","keyword3"]
}

【示例】
输入标题: "How to Fine-Tune a FLUX Model"
输出title_zh: "如何微调FLUX模型" (不是 "How to Fine-Tune a FLUX Model")

严格按照要求翻译，title_zh必须是中文！`
  : `判断以下内容是否与人工智能领域相关，并生成完整的双语摘要。

标题: ${title}
描述: ${description}

🔥 重要：以下任何情况都必须判为【相关】！

📋 强制【相关】的关键词（包含任一即算）：
AI, ML, LLM, GPT, ChatGPT, OpenAI, Claude, Gemini, Google, Microsoft, Amazon, Meta, Apple, NVIDIA, Anthropic, PostgreSQL, 搜索, 机器学习, 深度学习, 算法, 数据库, 云计算, API, SDK, Isaac, Replicate, Attention, Sparse

📋 强制【相关】的产品发布类型：
- ✅ 任何AI/ML相关产品发布（Isaac 0.1, Google AI搜索等）  
- ✅ 大厂技术基础设施（PostgreSQL for ChatGPT等）
- ✅ 开发者工具和平台（Replicate, SDK等）
- ✅ 研究论文和技术突破（Attention机制等）
- ✅ AI安全和伦理讨论（虚假信息检测等）
- ✅ 自动驾驶和机器人技术（NVIDIA DRIVE等）

📋 强制【相关】的公司（发布的任何技术都算）：
OpenAI, Google, Microsoft, Meta, Amazon, Apple, NVIDIA, Anthropic, Replicate, Hugging Face

🚨 特别强调：AI产品发布必须推送！
- Isaac模型发布 ✅
- Google搜索AI功能 ✅  
- NVIDIA自动驾驶技术 ✅
- PostgreSQL优化（支撑AI服务）✅
- 任何大模型相关基础设施 ✅

❌ 仅以下内容判为不相关:
- 纯娱乐八卦、体育比赛
- 传统制造业、房地产交易  
- 个人生活、美食旅游
- 完全无关的政治新闻

🔑 核心原则：宁可多收录100篇，不可漏掉1个AI产品发布！

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

async function publishToPayload(env, article, logs, forceInclude = false) {
  // 🧪 检查模拟模式
  const payloadEndpoint = env.PAYLOAD_API_ENDPOINT;
  if (payloadEndpoint && payloadEndpoint.startsWith('mock://')) {
    logs.push('[Payload] 🧪 模拟模式激活');
    
    // 模拟成功响应
    const mockId = `mock_${Date.now()}`;
    const mockSlug = generateSlug(article.title, article.title_en, article.summary_en?.keywords || [], forceInclude);
    
    logs.push(`[Payload] 📄 模拟发布: ${article.title.substring(0, 50)}...`);
    logs.push(`[Payload] ✅ 发布成功 ID: ${mockId}`);
    
    return true;
  }

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
    article.slug = generateSlug(article.title, article.title_en, article.summary_en?.keywords || [], forceInclude);
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

function generateSlug(title, titleEn, keywords, forceUnique = false) {
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
    .substring(0, 50);        // 限制长度，为时间戳留空间
  
  // 确保不为空
  let finalSlug = baseSlug || `ai-article-${Date.now().toString(36)}`;
  
  // 对强制收录的文章添加唯一时间戳
  if (forceUnique) {
    finalSlug += `-${Date.now().toString(36)}`;
  }
  
  return finalSlug;
}

// ==================== 📱 Telegram → Payload 发布功能 ====================

/**
 * 处理Telegram频道消息并发布到Payload CMS
 * @param {Object} env - 环境变量
 * @param {Object} telegramUpdate - Telegram更新对象
 * @returns {Object} 处理结果
 */
async function handleTelegramToPayload(env, telegramUpdate) {
  const logs = [];
  logs.push('[TG→Payload] 开始处理Telegram消息');

  try {
    // 检查是否为删除操作
    if (telegramUpdate.edited_channel_post?.text === '' || 
        telegramUpdate.edited_message?.text === '' ||
        telegramUpdate.channel_post_deleted || 
        telegramUpdate.message_deleted) {
      
      const messageId = telegramUpdate.edited_channel_post?.message_id || 
                       telegramUpdate.edited_message?.message_id ||
                       telegramUpdate.channel_post_deleted?.message_id ||
                       telegramUpdate.message_deleted?.message_id;
      
      if (messageId) {
        logs.push(`[TG→Payload] 🗑️ 检测到删除操作，消息ID: ${messageId}`);
        const deleteResult = await deleteFromPayloadCMS(env, messageId);
        logs.push(`[TG→Payload] ${deleteResult.success ? '✅ 删除成功' : '❌ 删除失败'}`);
        return { success: deleteResult.success, logs, action: 'delete' };
      }
    }

    // 解析Telegram消息
    const messageData = parseTelegramMessage(telegramUpdate);
    if (!messageData) {
      logs.push('[TG→Payload] ❌ 无效的Telegram消息格式或RSS内容被过滤');
      return { success: false, logs, error: '无效的Telegram消息格式' };
    }

    logs.push(`[TG→Payload] ✅ 解析消息: ${messageData.text?.substring(0, 100)}...`);

    // 直接发布到Payload CMS (不使用AI处理)
    const payloadResult = await publishToPayloadCMS(env, messageData);
    if (payloadResult.success) {
      logs.push(`[TG→Payload] 🎉 发布成功 ID: ${payloadResult.id}`);
      
      // 可选：回复确认消息到Telegram
      if (env.TG_REPLY_ON_SUCCESS === 'true') {
        await sendTelegramReply(env, messageData.chat_id, 
          `✅ 已成功发布到Payload CMS\n🆔 文章ID: ${payloadResult.id}`);
      }
      
      return {
        success: true,
        logs,
        payload_id: payloadResult.id,
        payload_slug: payloadResult.slug,
        action: 'publish'
      };
    } else {
      logs.push(`[TG→Payload] ❌ 发布失败: ${payloadResult.error}`);
      return { success: false, logs, error: payloadResult.error };
    }

  } catch (error) {
    logs.push(`[TG→Payload] 💥 处理异常: ${error.message}`);
    console.error('[TG→Payload Error]', error);
    return { success: false, logs, error: error.message };
  }
}

/**
 * 解析Telegram消息
 * @param {Object} update - Telegram更新对象
 * @returns {Object|null} 解析后的消息数据
 */
function parseTelegramMessage(update) {
  // 支持频道帖子和群组消息
  const message = update.message || update.channel_post || update.edited_message || update.edited_channel_post;
  
  if (!message) {
    console.log('[TG Parser] 未找到有效消息');
    return null;
  }

  const messageText = message.text || message.caption || '';
  
  // 🚫 检测RSS自动推送内容，避免循环发布
  const isRSSContent = detectRSSAutoContent(messageText, message);
  if (isRSSContent) {
    console.log('[TG Parser] 🔄 检测到RSS自动内容，跳过发布到Payload');
    return null; // 返回null阻止进一步处理
  }

  const result = {
    message_id: message.message_id,
    chat_id: message.chat?.id,
    chat_type: message.chat?.type,
    date: new Date(message.date * 1000).toISOString(),
    text: messageText,
    entities: message.entities || [],
    photo: message.photo || null,
    document: message.document || null,
    video: message.video || null,
    link: null,
    hashtags: [],
    is_manual_post: true // 标记为手动发布的内容
  };

  // 提取链接和标签
  if (message.entities) {
    for (const entity of message.entities) {
      if (entity.type === 'url') {
        const link = result.text.substring(entity.offset, entity.offset + entity.length);
        if (!result.link) result.link = link;
      }
      if (entity.type === 'text_link') {
        if (!result.link) result.link = entity.url;
      }
      if (entity.type === 'hashtag') {
        const hashtag = result.text.substring(entity.offset, entity.offset + entity.length);
        result.hashtags.push(hashtag.replace('#', '')); // 移除#号，只保留标签文本
      }
    }
  }

  return result;
}

/**
 * 🔍 检测RSS自动推送内容，防止循环发布
 * @param {string} text - 消息文本
 * @param {Object} message - 完整消息对象
 * @returns {boolean} 是否为RSS自动内容
 */
function detectRSSAutoContent(text, message) {
  if (!text) return false;

  // 1. 检测Bot发送的消息（通过User-Agent或via_bot字段）
  if (message.via_bot || message.from?.is_bot) {
    console.log('[RSS Detection] 🤖 Bot发送的消息');
    return true;
  }

  // 2. 检测典型的RSS格式特征
  const rssPatterns = [
    /📰.*摘要：/i,           // RSS摘要格式
    /🔗.*来源：/i,           // RSS来源标识
    /📊.*发布时间：/i,       // RSS时间格式
    /🏷️.*标签：/i,          // RSS标签格式
    /📍.*链接：/i,           // RSS链接格式
    /由.*自动推送/i,         // 自动推送标识
    /SijiGPT.*整理/i,        // 系统整理标识
  ];

  for (const pattern of rssPatterns) {
    if (pattern.test(text)) {
      console.log('[RSS Detection] 📋 匹配RSS格式模式:', pattern);
      return true;
    }
  }

  // 3. 检测RSS源域名链接（表示来自RSS聚合）
  const rssSourceDomains = [
    'openai.com/blog',
    'blog.google',
    'deepmind.com',
    'huggingface.co/blog',
    'aws.amazon.com/blogs',
    'anthropic.com/news',
    'arxiv.org',
    'simonwillison.net',
    'karpathy.github.io',
    'lilianweng.github.io'
  ];

  const hasRSSSource = rssSourceDomains.some(domain => 
    text.toLowerCase().includes(domain.toLowerCase())
  );

  if (hasRSSSource) {
    console.log('[RSS Detection] 🔗 包含RSS源域名链接');
    return true;
  }

  // 4. 检测双语摘要格式（RSS系统特有）
  const bilingualPattern = /.*\n.*\n.*English\s*Summary.*\n.*中文摘要.*/i;
  if (bilingualPattern.test(text)) {
    console.log('[RSS Detection] 🌐 检测到双语摘要格式');
    return true;
  }

  // 5. 检测消息时间和系统推送时间的匹配
  const messageTime = new Date(message.date * 1000);
  const isNearScheduledTime = isNearSystemScheduledTime(messageTime);
  const hasTechKeywords = /AI|人工智能|机器学习|深度学习|技术|开发|编程/i.test(text);

  if (isNearScheduledTime && hasTechKeywords && text.length > 300) {
    console.log('[RSS Detection] ⏰ 时间和内容特征匹配RSS推送');
    return true;
  }

  return false; // 不是RSS内容，允许发布到Payload
}

/**
 * 检查是否接近系统定时推送时间
 * @param {Date} messageTime - 消息时间
 * @returns {boolean} 是否接近推送时间
 */
function isNearSystemScheduledTime(messageTime) {
  const hour = messageTime.getUTCHours();
  const minute = messageTime.getUTCMinutes();
  
  // 系统推送时间：0, 4, 7, 11, 14 UTC (±10分钟容错)
  const scheduledHours = [0, 4, 7, 11, 14];
  
  return scheduledHours.some(schedHour => {
    return hour === schedHour && minute <= 10; // 推送后10分钟内
  });
}

/**
 * 使用AI增强内容
 * @param {Object} env - 环境变量
 * @param {Object} messageData - 消息数据
 * @returns {Object} 增强后的内容
 */
async function enhanceContentWithAI(env, messageData) {
  try {
    const prompt = `请帮我优化以下Telegram频道消息，使其更适合发布到技术博客：

原始内容: ${messageData.text}

请生成：
1. 优化后的标题（简洁有力）
2. 结构化的描述（包含要点总结）
3. 相关的技术标签
4. SEO友好的简短摘要

以JSON格式返回：
{
  "title": "优化后的标题",
  "description": "结构化描述",
  "summary": "SEO摘要",
  "tags": ["标签1", "标签2", "标签3"],
  "category": "技术分类"
}`;

    const aiResult = await callOpenRouterAI(env, prompt, 'enhancement');
    if (aiResult && aiResult.trim()) {
      try {
        const enhanced = JSON.parse(aiResult);
        return {
          ...messageData,
          title: enhanced.title || messageData.title,
          description: enhanced.description || messageData.description,
          summary: enhanced.summary || messageData.text.substring(0, 300),
          ai_tags: enhanced.tags || [],
          ai_category: enhanced.category || 'Technology'
        };
      } catch (parseError) {
        console.log('[AI Enhancement] JSON解析失败，使用原始内容');
      }
    }
  } catch (error) {
    console.log('[AI Enhancement] AI增强失败:', error.message);
  }

  return messageData;
}

/**
 * 发布内容到Payload CMS
 * @param {Object} env - 环境变量
 * @param {Object} content - 内容数据
 * @returns {Object} 发布结果
 */
async function publishToPayloadCMS(env, content) {
  try {
    const payloadEndpoint = env.PAYLOAD_API_ENDPOINT;
    const payloadEmail = env.PAYLOAD_EMAIL;
    const payloadPassword = env.PAYLOAD_PASSWORD;
    
    if (!payloadEndpoint) {
      return { 
        success: false, 
        error: '未配置Payload CMS连接信息 (PAYLOAD_API_ENDPOINT)' 
      };
    }

    // 🧪 模拟模式检测
    if (payloadEndpoint.startsWith('mock://')) {
      console.log('[Payload] 🧪 模拟模式激活');
      
      // 模拟成功响应
      const mockId = `mock_${Date.now()}`;
      const mockSlug = generateSlugFromContent(content.text);
      
      console.log(`[Payload] 📄 模拟发布: ${content.text.substring(0, 50)}...`);
      console.log(`[Payload] 🏷️  标签: ${content.hashtags.join(', ')}`);
      console.log(`[Payload] 📅 时间: ${content.date}`);
      
      return {
        success: true,
        id: mockId,
        slug: mockSlug,
        mockMode: true,
        previewData: {
          title: content.title || 'Telegram频道消息',
          content: content.text,
          tags: content.hashtags,
          source: 'telegram_manual',
          publishedAt: content.date,
          link: content.link,
          chat_id: content.chat_id,
          message_id: content.message_id
        }
      };
    }
    
    // 🔐 使用与RSS系统相同的登录方式
    let token;
    
    if (!payloadEmail || !payloadPassword) {
      return {
        success: false,
        error: '未配置Payload登录凭据 (PAYLOAD_EMAIL, PAYLOAD_PASSWORD)'
      };
    }
    
    console.log('[Payload] 🔐 开始登录...');
    const loginResponse = await fetch(`${payloadEndpoint}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: payloadEmail,
        password: payloadPassword
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      return {
        success: false,
        error: `Payload登录失败: ${errorText}`
      };
    }
    
    const loginData = await loginResponse.json();
    token = loginData.token;
    console.log('[Payload] ✅ 登录成功');

    // 构建Payload文档数据 - 简化版本，不使用AI处理
    const payloadDoc = {
      title: content.title || content.text.substring(0, 100), // 使用前100字符作为标题
      title_en: content.title || content.text.substring(0, 100),
      content: content.text, // 直接使用原始文本内容
      slug: generateSlugFromContent(content.text),
      publishedAt: content.date,
      source: {
        name: 'Telegram Manual',
        url: content.link,
        author: 'SijiGPT Bot'
      },
      original_language: 'zh', // 假设是中文
      summary_zh: {
        content: content.text,
        keywords: content.hashtags.map(tag => ({ keyword: tag }))
      },
      _status: 'published'
    };

    console.log('[Payload] 📄 准备发布文档...');

    const response = await fetch(`${payloadEndpoint}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `JWT ${token}`, // 使用动态获取的token
        'User-Agent': 'SijiGPT-TelegramBot/1.0'
      },
      body: JSON.stringify(payloadDoc)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('[Payload] ✅ 发布成功');
      return {
        success: true,
        id: result.doc?.id || result.id,
        slug: result.doc?.slug || result.slug,
        url: `${payloadEndpoint}/${result.doc?.slug || result.slug}`
      };
    } else {
      const errorText = await response.text();
      console.log('[Payload] ❌ 发布失败:', errorText);
      
      return {
        success: false,
        error: `Payload API错误 (${response.status}): ${errorText}`,
        status: response.status
      };
    }

  } catch (error) {
    return {
      success: false,
      error: `发布到Payload失败: ${error.message}`
    };
  }
}

/**
 * 从Payload CMS删除对应的文章
 * @param {Object} env - 环境变量
 * @param {number} telegramMessageId - Telegram消息ID
 * @returns {Object} 删除结果
 */
async function deleteFromPayloadCMS(env, telegramMessageId) {
  try {
    const payloadEndpoint = env.PAYLOAD_API_ENDPOINT;
    const payloadApiKey = env.PAYLOAD_API_KEY;
    
    if (!payloadEndpoint || !payloadApiKey) {
      return { 
        success: false, 
        error: '未配置Payload CMS连接信息' 
      };
    }

    // 1. 先查找对应的文章
    const searchUrl = `${payloadEndpoint}/api/posts?where[sourceData.telegram_message_id][equals]=${telegramMessageId}`;
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `API-Key ${payloadApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      return { success: false, error: `查找失败: ${searchResponse.status}` };
    }

    const searchResult = await searchResponse.json();
    
    if (!searchResult.docs || searchResult.docs.length === 0) {
      return { success: false, error: `未找到对应的文章 (TG消息ID: ${telegramMessageId})` };
    }

    // 2. 删除找到的文章
    const article = searchResult.docs[0];
    const deleteResponse = await fetch(`${payloadEndpoint}/api/posts/${article.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `API-Key ${payloadApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (deleteResponse.ok) {
      return {
        success: true,
        id: article.id,
        telegram_message_id: telegramMessageId
      };
    } else {
      const errorText = await deleteResponse.text();
      return {
        success: false,
        error: `删除失败 (${deleteResponse.status}): ${errorText}`
      };
    }

  } catch (error) {
    return {
      success: false,
      error: `删除操作失败: ${error.message}`
    };
  }
}
async function sendTelegramReply(env, chatId, message) {
  try {
    const botToken = env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.log('[TG Reply] 发送回复失败:', error.message);
  }
}

/**
 * 生成内容的slug
 * @param {string} text - 文本内容
 * @returns {string} slug
 */
function generateSlugFromContent(text) {
  if (!text) {
    return `tg-post-${Date.now().toString(36)}`;
  }
  
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) || `tg-post-${Date.now().toString(36)}`;
}

/**
 * 获取Telegram测试页面HTML
 */
async function getTestPageHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>斯基GPT - Telegram→Payload测试</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            line-height: 1.6;
        }
        .container { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 12px;
            margin: 20px 0;
        }
        .status { 
            padding: 10px; 
            border-radius: 6px; 
            margin: 10px 0; 
        }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        button { 
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 6px; 
            cursor: pointer;
            margin: 5px;
        }
        button:hover { background: #0056b3; }
        button:disabled { background: #6c757d; cursor: not-allowed; }
        textarea { 
            width: 100%; 
            min-height: 150px; 
            padding: 10px; 
            border: 1px solid #ddd; 
            border-radius: 6px;
            font-family: monospace;
        }
        .endpoint { 
            background: #e9ecef; 
            padding: 8px 12px; 
            border-radius: 4px; 
            font-family: monospace;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <h1>📱 斯基GPT - Telegram→Payload 测试工具</h1>
    
    <div class="container">
        <h2>🚫 防循环发布机制</h2>
        <div class="info">
            <strong>✅ 智能识别RSS自动内容</strong><br>
            • 检测Bot发送的消息<br>
            • 识别RSS格式特征（摘要、来源、标签等）<br>
            • 检测RSS源域名链接<br>
            • 匹配双语摘要格式<br>
            • 时间匹配系统推送时段<br>
            <strong>🎯 只发布手动原创内容到Payload（不使用AI处理）</strong><br>
            <strong>🗑️ 支持同步删除：TG删除消息时自动删除Payload文章</strong>
        </div>
    </div>

    <div class="container">
        <h2>🔗 Webhook 端点</h2>
        <div class="endpoint" id="webhookUrl">
            https://siji-worker-v2.chengqiangshang.workers.dev/telegram-webhook
        </div>
        <button onclick="copyToClipboard('webhookUrl')">复制链接</button>
        <button onclick="testWebhook()">测试连接</button>
    </div>

    <div class="container">
        <h2>🧪 模拟 Telegram 消息测试</h2>
        <textarea id="testMessage" placeholder="编辑测试消息JSON...">{
  "message": {
    "message_id": 12345,
    "chat": {
      "id": -1001234567890,
      "type": "channel",
      "title": "斯基GPT测试频道"
    },
    "date": ${Math.floor(Date.now() / 1000)},
    "text": "🚀 新AI突破：GPT-5正式发布！\\n\\nOpenAI今天宣布了革命性的GPT-5模型，在推理、创造性和多模态理解方面实现重大突破。\\n\\n核心亮点：\\n• 推理能力提升300%\\n• 支持视频、音频、文本多模态\\n• 实时交互响应\\n• 更强的代码生成能力\\n\\n这标志着人工智能进入新的发展阶段。\\n\\n#GPT5 #OpenAI #人工智能 #技术突破\\n\\nhttps://openai.com/gpt-5-announcement",
    "entities": [
      {"type": "hashtag", "offset": 150, "length": 5},
      {"type": "hashtag", "offset": 156, "length": 7},
      {"type": "hashtag", "offset": 164, "length": 5},
      {"type": "hashtag", "offset": 170, "length": 5},
      {"type": "url", "offset": 180, "length": 35}
    ]
  }
}</textarea>
        <br>
        <button onclick="sendTestMessage()" id="sendBtn">🚀 发送测试消息</button>
        <button onclick="loadPreset('manual')">✏️ 手动内容模板</button>
        <button onclick="loadPreset('rss')">🤖 RSS内容模板(被拦截)</button>
        <button onclick="loadPreset('news')">📰 新闻模板</button>
        <button onclick="loadPreset('tech')">💻 技术模板</button>
    </div>

    <div class="container">
        <h2>📊 测试结果</h2>
        <div id="result"></div>
    </div>

    <div class="container">
        <h2>⚙️ 系统状态检查</h2>
        <button onclick="checkHealth()">🔍 检查健康状态</button>
        <button onclick="checkRSSTest()">📡 测试RSS聚合</button>
        <div id="systemStatus"></div>
    </div>

    <script>
        async function copyToClipboard(elementId) {
            const text = document.getElementById(elementId).textContent;
            await navigator.clipboard.writeText(text);
            showStatus('✅ 已复制到剪贴板', 'success');
        }

        async function testWebhook() {
            try {
                const response = await fetch('/telegram-webhook', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ test: true })
                });
                
                const text = await response.text();
                if (response.ok) {
                    showStatus('✅ Webhook连接正常', 'success');
                } else {
                    showStatus(\`⚠️ Webhook响应: \${response.status}\`, 'info');
                }
            } catch (error) {
                showStatus(\`❌ 连接失败: \${error.message}\`, 'error');
            }
        }

        async function sendTestMessage() {
            const btn = document.getElementById('sendBtn');
            btn.disabled = true;
            btn.textContent = '发送中...';
            
            try {
                const message = JSON.parse(document.getElementById('testMessage').value);
                const response = await fetch('/telegram-webhook', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(message)
                });

                const result = await response.json();
                document.getElementById('result').innerHTML = \`
                    <pre style="background: #f8f9fa; padding: 15px; border-radius: 6px; overflow-x: auto;">
\${JSON.stringify(result, null, 2)}
                    </pre>
                \`;
                
                if (result.success) {
                    showStatus('🎉 消息处理成功！', 'success');
                } else {
                    showStatus(\`⚠️ 处理失败: \${result.error || 'Unknown error'}\`, 'error');
                }
            } catch (error) {
                showStatus(\`❌ 测试失败: \${error.message}\`, 'error');
                document.getElementById('result').innerHTML = \`
                    <div class="error">错误: \${error.message}</div>
                \`;
            } finally {
                btn.disabled = false;
                btn.textContent = '🚀 发送测试消息';
            }
        }

        async function checkHealth() {
            try {
                const response = await fetch('/health');
                const data = await response.json();
                document.getElementById('systemStatus').innerHTML = \`
                    <div class="success">
                        <strong>✅ 系统健康状态</strong><br>
                        服务: \${data.service}<br>
                        版本: \${data.version}<br>
                        AI提供商: \${data.provider}<br>
                        RSS策略: \${data.rss_strategy}<br>
                        Telegram: \${data.telegram_webhook}<br>
                        功能: \${data.features ? data.features.join(', ') : 'N/A'}<br>
                        时间: \${data.timestamp}
                    </div>
                \`;
            } catch (error) {
                document.getElementById('systemStatus').innerHTML = \`
                    <div class="error">❌ 健康检查失败: \${error.message}</div>
                \`;
            }
        }

        async function checkRSSTest() {
            showStatus('🔄 正在测试RSS聚合...', 'info');
            try {
                const response = await fetch('/test', { method: 'POST' });
                const data = await response.json();
                document.getElementById('systemStatus').innerHTML = \`
                    <div class="info">
                        <strong>📡 RSS测试结果</strong><br>
                        处理文章: \${data.count} 篇<br>
                        发布文章: \${data.published} 篇<br>
                        AI提供商: \${data.provider}<br>
                        执行日志: \${data.logs ? data.logs.length : 0} 条
                    </div>
                \`;
                showStatus('✅ RSS测试完成', 'success');
            } catch (error) {
                showStatus(\`❌ RSS测试失败: \${error.message}\`, 'error');
            }
        }

        function loadPreset(type) {
            const presets = {
                manual: {
                    text: "💡 我的想法：关于AI发展的思考\\n\\n今天看到GPT-5的消息，让我想到了AI发展的几个关键点：\\n\\n1. 模型能力的指数级增长\\n2. 计算资源需求的挑战\\n3. AI安全和对齐的重要性\\n\\n我认为未来的AI发展需要更加注重可控性和透明度。\\n\\n#AI思考 #未来科技 #个人观点"
                },
                rss: {
                    text: "📰 AI新闻摘要：OpenAI发布GPT-5\\n\\n🔗 来源：https://openai.com/blog/gpt-5\\n\\n📊 发布时间：2024-01-23\\n\\nEnglish Summary: OpenAI announces GPT-5 with revolutionary capabilities...\\n\\n中文摘要：OpenAI今天宣布发布GPT-5模型，在推理和创造性方面实现重大突破...\\n\\n🏷️ 标签：#GPT5 #OpenAI #人工智能\\n\\n由SijiGPT系统自动推送整理"
                },
                news: {
                    text: "📰 重大科技新闻：苹果发布AI芯片\\n\\n苹果公司今日正式发布了专为AI计算设计的M3 Ultra芯片，性能较上一代提升40%。\\n\\n关键特性：\\n• 神经网络引擎性能翻倍\\n• 支持端到端AI推理\\n• 功耗降低25%\\n\\n#Apple #AI芯片 #M3Ultra #科技新闻\\n\\nhttps://apple.com/m3-ultra"
                },
                tech: {
                    text: "💻 开发思考：Next.js的发展方向\\n\\n最近在使用Next.js 14，感受到了服务器组件的强大。这让我思考前端开发的未来：\\n\\n• 服务端渲染回归主流\\n• 边缘计算的重要性\\n• 开发体验的持续优化\\n\\n作为开发者，我们需要拥抱这些变化。\\n\\n#NextJS #前端开发 #个人思考\\n\\n分享一些学习心得..."
                }
            };

            if (presets[type]) {
                const template = {
                    message: {
                        message_id: Math.floor(Math.random() * 100000),
                        chat: {
                            id: -1001234567890,
                            type: "channel",
                            title: "斯基GPT测试频道"
                        },
                        date: Math.floor(Date.now() / 1000),
                        text: presets[type].text
                    }
                };
                document.getElementById('testMessage').value = JSON.stringify(template, null, 2);
                const statusMessages = {
                    manual: '✏️ 手动内容模板(将发布到Payload)',
                    rss: '🤖 RSS内容模板(将被拦截)',
                    news: '📰 新闻模板',
                    tech: '💻 技术模板'
                };
                showStatus(statusMessages[type] || \`📝 已加载\${type}模板\`, type === 'rss' ? 'error' : 'info');
            }
        }

        function showStatus(message, type) {
            const statusDiv = document.createElement('div');
            statusDiv.className = \`status \${type}\`;
            statusDiv.textContent = message;
            document.body.appendChild(statusDiv);
            
            setTimeout(() => {
                statusDiv.remove();
            }, 3000);
        }

        // 页面加载时检查系统状态
        window.addEventListener('load', checkHealth);
    </script>
</body>
</html>`;
}