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

// 🤖 OpenRouter 模型配置 - Gemini 2.5 Pro 成本优化策略
// 💰 成本对比：Gemini (~$1.25/1M) vs Claude (~$3/1M) vs Grok (~$2/1M)
// 🎯 策略：Gemini主力 + Claude质量保证 + Grok速度补充
const OPENROUTER_CONFIG = {
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  models: {
    // 🔍 第一层筛选 - Grok 4.1 Fast 快速筛选
    screening: [
      'x-ai/grok-4.1-fast',                          // Grok 4.1 Fast - 主力快速筛选
      'groq/llama-3.1-70b-versatile',               // Groq 70B - 快速备用
      'anthropic/claude-3-5-haiku'                  // Claude 3.5 Haiku - 高质量备用
    ],
    
    // 🔬 第二层深度筛选 - Gemini 2.5 Pro 成本优化
    secondary_screening: [
      'google/gemini-2.5-pro',                       // Gemini 2.5 Pro - 成本最优主力
      'anthropic/claude-3-5-sonnet',                // Claude 3.5 Sonnet - 高质量备用
      'x-ai/grok-4.1-fast'                          // Grok 4.1 Fast - 速度备用
    ],
    
    // 📝 内容生成 - Gemini 2.5 Pro 成本优化策略
    content_generation: [
      'google/gemini-2.5-pro',                       // Gemini 2.5 Pro - 成本最优主力（-60%成本）
      'anthropic/claude-3-5-sonnet',                // Claude 3.5 Sonnet - 质量保证备用
      'x-ai/grok-4.1-fast'                          // Grok 4.1 Fast - 快速生成备用
    ],
    
    // 🎯 翻译精修 - Claude 保证最高质量
    translation_refinement: [
      'anthropic/claude-3-5-sonnet',                // Claude 3.5 Sonnet - 翻译质量最优
      'google/gemini-2.5-pro',                      // Gemini 2.5 Pro - 成本友好备用
      'x-ai/grok-4.1-fast'                          // Grok 4.1 Fast - 快速备用
    ],
    
    // 🔤 翻译专用 - 成本优化
    translation: [
      'google/gemini-2.5-pro',                      // Gemini 2.5 Pro - 多语言成本最优
      'x-ai/grok-4.1-fast',                         // Grok 4.1 Fast - 快速翻译
      'anthropic/claude-3-5-haiku'                  // Claude 3.5 Haiku - 质量保证
    ],
    
    // 🆘 默认降级序列 - Gemini优先成本策略  
    fallback: [
      'google/gemini-2.5-pro',                      // Gemini 2.5 Pro - 成本最优主力
      'x-ai/grok-4.1-fast',                         // Grok 4.1 Fast - 速度备用
      'anthropic/claude-3-5-haiku'                  // Claude 3.5 Haiku - 质量保证
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

// 🚀 批量去重：减少KV请求频率，避免API限制
async function batchCheckDuplicates(env, articles, logs) {
  const uniqueArticles = [];
  const seenUrls = new Set();
  const seenTitles = new Set();
  
  // 第一步：内存去重（同批次重复）
  for (const article of articles) {
    const normalizedUrl = normalizeUrl(article.link);
    const titleHash = generateTitleHash(article.title);
    
    if (seenUrls.has(normalizedUrl) || seenTitles.has(titleHash)) {
      logs.push(`[批量去重] ⏭️ 批内重复: ${article.title.substring(0, 30)}...`);
      continue;
    }
    
    seenUrls.add(normalizedUrl);
    seenTitles.add(titleHash);
    uniqueArticles.push(article);
  }
  
  logs.push(`[批量去重] 📊 批内去重: ${articles.length} -> ${uniqueArticles.length} 篇`);
  
  // 第二步：KV批量检查（超级严格限制）
  const maxKvChecks = 10; // 超级严格限制KV检查数量
  const articlesToCheck = uniqueArticles.slice(0, maxKvChecks);
  
  const finalUnique = [];
  for (const article of articlesToCheck) {
    const isDuplicate = await checkDuplicates(env, article, []);
    if (!isDuplicate) {
      finalUnique.push(article);
    }
  }
  
  logs.push(`[批量去重] 📊 KV去重: ${articlesToCheck.length} -> ${finalUnique.length} 篇`);
  return finalUnique;
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

// ==================== D1+KV混合架构 ====================
// 🚀 彻底解决API频率限制的混合架构

/**
 * D1+KV混合去重：两层架构彻底解决API限制
 */
async function hybridBatchDeduplication(env, articles, logs) {
  if (!articles || articles.length === 0) {
    return [];
  }
  
  logs.push(`[混合架构] 🔄 开始处理 ${articles.length} 篇文章`);
  
  // 第1层：KV热缓存快速过滤（最近7天）
  const kvFiltered = await hybridKVCheck(env, articles, logs);
  logs.push(`[KV缓存] ⚡ 快速过滤: ${articles.length} → ${kvFiltered.length} 篇`);
  
  if (kvFiltered.length === 0) {
    return [];
  }
  
  // 第2层：D1数据库深度检查（全历史）
  const finalUnique = await hybridD1Check(env, kvFiltered, logs);
  logs.push(`[D1数据库] 🗄️ 深度去重: ${kvFiltered.length} → ${finalUnique.length} 篇`);
  
  return finalUnique;
}

/**
 * KV缓存批量检查（热数据）
 */
async function hybridKVCheck(env, articles, logs) {
  try {
    const maxCheck = 30; // 限制KV检查数量
    const checkArticles = articles.slice(0, maxCheck);
    
    const kvKeys = checkArticles.map(article => 
      'recent_url:' + normalizeUrl(article.link)
    );
    
    const kvResults = await Promise.allSettled(
      kvKeys.map(key => env.ARTICLES_KV.get(key))
    );
    
    const existingUrls = new Set();
    kvResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        existingUrls.add(normalizeUrl(checkArticles[index].link));
      }
    });
    
    const filtered = articles.filter(article => 
      !existingUrls.has(normalizeUrl(article.link))
    );
    
    logs.push(`[KV缓存] 📊 缓存命中: ${existingUrls.size} 篇`);
    return filtered;
    
  } catch (error) {
    logs.push(`[KV缓存] ❌ 检查错误: ${error.message}，跳过KV检查`);
    return articles;
  }
}

/**
 * D1数据库批量检查（全历史数据）
 */
async function hybridD1Check(env, articles, logs) {
  if (!env.DB) {
    logs.push(`[D1数据库] ⚠️ 数据库未配置，跳过D1检查`);
    return articles;
  }
  
  if (articles.length === 0) {
    return [];
  }
  
  try {
    const maxCheck = 100;
    const checkArticles = articles.slice(0, maxCheck);
    
    const urls = checkArticles.map(article => {
      const url = normalizeUrl(article.link);
      return `'${url.replace(/'/g, "''")}'`;
    });
    
    const urlParams = urls.join(',');
    const query = `SELECT url FROM articles WHERE url IN (${urlParams})`;
    const result = await env.DB.prepare(query).all();
    
    const existingUrls = new Set(result.results.map(row => row.url));
    
    const uniqueArticles = articles.filter(article => 
      !existingUrls.has(normalizeUrl(article.link))
    );
    
    logs.push(`[D1数据库] 📊 数据库命中: ${existingUrls.size} 篇`);
    return uniqueArticles;
    
  } catch (error) {
    logs.push(`[D1数据库] ❌ 查询错误: ${error.message}，回退到KV结果`);
    return articles;
  }
}

/**
 * 批量保存到D1数据库
 */
async function saveProcessedArticlesToD1(env, processedArticles, logs) {
  if (!env.DB || !processedArticles || processedArticles.length === 0) {
    return;
  }
  
  try {
    const batchSize = 25; // 分批处理
    const batches = [];
    for (let i = 0; i < processedArticles.length; i += batchSize) {
      batches.push(processedArticles.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      const values = batch.map(article => {
        const url = normalizeUrl(article.link).replace(/'/g, "''");
        const title = (article.title || '').substring(0, 300).replace(/'/g, "''");
        const titleHash = generateTitleHash(article.title);
        const content = (article.description || '').substring(0, 1000).replace(/'/g, "''");
        const summaryZh = (article.summary_zh || '').substring(0, 500).replace(/'/g, "''");
        const summaryEn = (article.summary_en || '').substring(0, 500).replace(/'/g, "''");
        const feed = (article.feedUrl || '').replace(/'/g, "''");
        
        return `('${url}', '${title}', '${titleHash}', '${content}', '${summaryZh}', '${summaryEn}', '${feed}', 1, 0)`;
      }).join(',');
      
      const insertSQL = `
        INSERT OR IGNORE INTO articles (
          url, title, title_hash, content, summary_zh, summary_en, source_feed, ai_processed, published_to_payload
        ) VALUES ${values}
      `;
      
      await env.DB.prepare(insertSQL).run();
    }
    
    logs.push(`[D1数据库] ✅ 保存 ${processedArticles.length} 篇文章到数据库`);
    
    // 异步更新KV缓存
    updateKVCacheAsync(env, processedArticles, logs);
    
  } catch (error) {
    logs.push(`[D1数据库] ❌ 保存错误: ${error.message}`);
  }
}

/**
 * 异步更新KV缓存
 */
function updateKVCacheAsync(env, articles, logs) {
  setTimeout(async () => {
    try {
      const timestamp = Date.now().toString();
      const operations = articles.map(article => {
        const key = 'recent_url:' + normalizeUrl(article.link);
        return env.ARTICLES_KV.put(key, timestamp, { expirationTtl: 7 * 24 * 3600 });
      });
      
      await Promise.allSettled(operations);
      logs.push(`[KV缓存] 🔄 异步更新 ${articles.length} 个缓存`);
      
    } catch (error) {
      console.error('[KV缓存] 异步更新失败:', error);
    }
  }, 1000);
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
        version: '2.1.0-gemini',
        rss_strategy: 'parallel_processing',
        ai_strategy: 'gemini_cost_optimized',
        models: {
          primary: 'Gemini 2.5 Pro (成本优化)',
          screening: 'Grok 4.1 Fast',
          quality_backup: 'Claude 3.5 Sonnet'
        },
        telegram_webhook: '已移除',
        features: ['RSS并行聚合', 'Gemini+Claude混合AI', 'TG短摘要发布', '分层筛选']
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

    return new Response('Siji Worker V2 Running', { 
      status: 404,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
};

// ==================== 核心聚合逻辑 ====================

async function aggregateArticles(env, cronExpression = '0 15 * * *') {
  // 🎯 初始化纯OpenRouter AI系统
  console.log('[系统] 🚀 初始化纯OpenRouter AI系统...');
  
  if (!env.OPENROUTER_API_KEY) {
    throw new Error('❌ OpenRouter API Key 未配置，系统无法运行');
  }
  
  // 纯OpenRouter AI类定义
  class PureOpenRouterAI {
    constructor(apiKey) {
      this.apiKey = apiKey;
      this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
      console.log('[OpenRouter] ✅ AI系统初始化成功');
    }

    async callAI(prompt, model = 'google/gemini-2.5-pro', maxTokens = 2000) {
      console.log(`[OpenRouter] 🎯 调用模型: ${model}`);
      
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://sijigpt.com',
            'X-Title': 'SijiGPT'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
          throw new Error('无效的API响应格式');
        }

        return data.choices[0].message.content.trim();
      } catch (error) {
        console.error(`[OpenRouter] ${model} 调用失败:`, error.message);
        throw error;
      }
    }

    // AI相关性筛选
    async screenRelevance(title, description) {
      const prompt = `判断内容是否与AI相关：
标题：${title}
描述：${description}

返回JSON：{"relevant": true/false, "confidence": 0.0-1.0, "reason": "理由"}
只有真正的AI技术内容才标记为相关。`;

      try {
        const result = await this.callAI(prompt, 'x-ai/grok-beta', 300);
        return JSON.parse(result);
      } catch (error) {
        console.error('[一级筛选] 失败，默认通过:', error.message);
        return { relevant: true, confidence: 0.5, reason: '筛选失败默认通过' };
      }
    }

    // 质量评估
    async evaluateQuality(title, description) {
      const prompt = `评估AI内容质量：
标题：${title}
描述：${description}

返回JSON：{
  "approved": true/false,
  "overall_score": 0.0-1.0,
  "reason": "评估理由"
}
overall_score > 0.6 才批准发布`;

      try {
        const result = await this.callAI(prompt, 'google/gemini-2.5-pro', 400);
        return JSON.parse(result);
      } catch (error) {
        console.error('[二级筛选] 失败，宽松通过:', error.message);
        return { approved: true, overall_score: 0.6, reason: '评估失败宽松通过' };
      }
    }

    // 内容生成
    async generateContent(title, description, url) {
      const prompt = `基于AI资讯创建高质量中文内容：

原标题：${title}
内容：${description}
链接：${url}

创建：
1. 中文标题：准确、吸引人
2. 中文摘要：150-200字，信息丰富
3. 关键词：3-5个中文词汇
4. 分类：OpenAI产品/谷歌AI/Anthropic产品/微软AI/AI研究/AI工具/其他AI

返回JSON：{
  "title_zh": "中文标题",
  "summary_zh": "详细摘要", 
  "keywords_zh": "词1, 词2, 词3",
  "category": "分类",
  "original_language": "en"
}`;

      try {
        const result = await this.callAI(prompt, 'google/gemini-2.5-pro', 1000);
        return JSON.parse(result);
      } catch (error) {
        console.error('[内容生成] 失败，使用基础模板:', error.message);
        return this.createFallbackContent(title, description);
      }
    }

    createFallbackContent(title, description) {
      let category = 'AI研究';
      if (title.toLowerCase().includes('openai')) category = 'OpenAI产品';
      else if (title.toLowerCase().includes('google')) category = '谷歌AI';
      else if (title.toLowerCase().includes('anthropic')) category = 'Anthropic产品';

      return {
        title_zh: `【${category}】${title}`,
        summary_zh: `${category}最新资讯：${description.substring(0, 150)}...`,
        keywords_zh: '人工智能, AI技术, 科技创新',
        category,
        original_language: 'en'
      };
    }
  }

  // 初始化AI系统
  const aiSystem = new PureOpenRouterAI(env.OPENROUTER_API_KEY);
  
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
  
  // 🚨 超级严格限制：彻底解除API频率限制
  const maxRssFeeds = 15; // 进一步限制为15个源
  const limitedRssFeeds = rssFeeds.slice(0, maxRssFeeds);
  
  // 🔥 API限制紧急模式：严重时跳过去重检查
  const emergencyMode = env.EMERGENCY_NO_DEDUP === 'true';
  
  logs.push(`[开始] 目标: ${dailyTarget} 篇, RSS 源: ${limitedRssFeeds.length}/${rssFeeds.length} 个`);
  logs.push(`[AI] 使用: ${env.AI_PROVIDER || 'openrouter'}`);

  // 🚀 阶段1优化：并行抓取有限RSS源（避免API过载）
  logs.push(`[RSS] 🔄 开始并行抓取 ${limitedRssFeeds.length} 个RSS源...`);
  
  const rssResults = await Promise.allSettled(
    limitedRssFeeds.map(async (feedUrl) => {
      try {
        logs.push(`[RSS] 📡 抓取: ${feedUrl}`);
        const response = await fetch(feedUrl, { 
          signal: AbortSignal.timeout(RSS_CONFIG.SOURCE_TIMEOUT),
          headers: { 'User-Agent': 'Siji-Worker/2.0' }
        });
        
        if (!response.ok) {
          logs.push(`[RSS] ❌ HTTP ${response.status}: ${feedUrl}`);
          return { feedUrl, articles: [] };
        }
        
        const xmlText = await response.text();
        const items = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
        
        const articles = items.map(item => {
          const title = extractTag(item, 'title');
          const link = extractTag(item, 'link');
          const description = extractTag(item, 'description');
          return { title, link, description, feedUrl };
        }).filter(article => article.title && article.link);
        
        logs.push(`[RSS] ✅ ${feedUrl}: 找到 ${articles.length} 篇文章`);
        return { feedUrl, articles };
        
      } catch (error) {
        logs.push(`[RSS] ❌ 抓取失败 ${feedUrl}: ${error.message}`);
        return { feedUrl, articles: [] };
      }
    })
  );
  
  // 合并所有RSS源的文章
  const allArticles = rssResults
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value.articles);
    
  logs.push(`[RSS] 📊 并行抓取完成，共获得 ${allArticles.length} 篇文章`);
  
  let uniqueArticles;
  if (emergencyMode) {
    logs.push(`[紧急模式] ⚡ 跳过去重检查，直接处理文章避免API限制`);
    uniqueArticles = allArticles.slice(0, dailyTarget * 2); // 取前40篇直接处理
  } else {
    // 🚀 D1+KV混合架构：彻底解决API限制
    logs.push(`[混合架构] 🔄 启用D1+KV混合去重，支持大规模处理...`);
    uniqueArticles = await hybridBatchDeduplication(env, allArticles, logs);
    logs.push(`[混合架构] ✅ 混合去重完成，剩余 ${uniqueArticles.length} 篇独特文章`);
  }
  
  // 现在逐篇处理已筛选的文章（保持安全的顺序处理）
  for (const { title, link, description, feedUrl } of uniqueArticles) {
    if (published >= dailyTarget) {
      logs.push(`[完成] 已达目标 ${dailyTarget} 篇，停止处理`);
      break;
    }
    
    logs.push(`[处理] ${title.substring(0, 50)}...`);
    
    count++;
    
    // 🚀 跳过去重检查 - 已在批量去重中处理
    // const isDuplicate = await checkDuplicates(env, article, logs);
    // if (isDuplicate) { logs.push(`[去重] ⏭️ 跳过重复: ${title.substring(0, 30)}...`); continue; }

    // 🎯 纯OpenRouter AI处理流程
    console.log(`[AI筛选] 开始纯OpenRouter处理: ${title.substring(0, 50)}...`);
    
    try {
      // 一级筛选：快速相关性判断
      const relevanceResult = await aiSystem.screenRelevance(title, description);
      
      if (!relevanceResult.relevant || relevanceResult.confidence < 0.3) {
        logs.push(`[一级筛选] ❌ 不相关或置信度低 (${relevanceResult.confidence})`);
        continue;
      }
      
      logs.push(`[一级筛选] ✅ 相关性确认 (置信度: ${relevanceResult.confidence})`);
      
      // 二级筛选：质量评估（仅对中高置信度内容）
      let qualityResult = { approved: true, overall_score: 0.7 };
      
      if (relevanceResult.confidence < 0.8) {
        qualityResult = await aiSystem.evaluateQuality(title, description);
        
        if (!qualityResult.approved || qualityResult.overall_score < 0.6) {
          logs.push(`[二级筛选] ❌ 质量评估未通过 (评分: ${qualityResult.overall_score})`);
          continue;
        }
      }
      
      logs.push(`[二级筛选] ✅ 质量评估通过 (评分: ${qualityResult.overall_score})`);
      
      // 内容生成：高质量中文内容
      logs.push(`[AI内容] 🎯 开始生成高质量内容...`);
      
      const finalAiData = await aiSystem.generateContent(title, description, link);
      
      if (!finalAiData.title_zh || !finalAiData.summary_zh) {
        logs.push(`[AI内容] ❌ 内容生成失败，跳过文章`);
        continue;
      }
      
      logs.push(`[AI内容] ✅ 高质量内容生成成功`);
      logs.push(`[内容] 中文标题: ${finalAiData.title_zh}`);
      logs.push(`[内容] 中文摘要: ${finalAiData.summary_zh.length} 字`);
      
      // 最终标题和内容
      const finalTitle = finalAiData.title_zh;
      const originalLang = finalAiData.original_language || "en";
      
      // 构建双语内容（按需求 2 的格式）
    // ============================================
      // 构建双语内容（HTML 格式，解决星号显示问题）
      // ============================================
      
      // ============================================
      // 构建双语内容（简化来源格式，完整标题自动换行）
      // ============================================
      // 📝 发布准备：构建完整数据结构
      // ============================================
      
      // 构建双语HTML内容
      const bilingualContent = `
<p><strong>来源：</strong><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></p>

---

<h2><strong>中文摘要</strong></h2>

${finalAiData.summary_zh}

<p><strong>关键词：</strong>${finalAiData.keywords_zh || '人工智能, 科技创新'}</p>

---

<h2><strong>English Summary</strong></h2>

<p><strong>${title}</strong></p>

${description}

<p><strong>Keywords:</strong> AI, Technology, Innovation</p>
`.trim();

      // 构建 Payload 数据对象
      const payloadData = {
        title: finalTitle,
        title_zh: finalTitle,
        title_en: title,
        source: {
          url: link,
          name: extractSourceName(link)
        },
        summary_list_zh: finalAiData.summary_zh?.substring(0, 100) + '...',
        summary_list_en: description.substring(0, 100) + '...',
        summary_zh: {
          content: finalAiData.summary_zh,
          keywords: finalAiData.keywords_zh?.split(', ')?.map(kw => ({ keyword: kw.trim() })) || []
        },
        summary_en: {
          content: description,
          keywords: []
        },
        original_language: originalLang,
        content: bilingualContent
      };

      // 是否强制发布（高评分文章或紧急模式）
      const shouldForceInclude = (qualityResult.overall_score > 0.7) || (env.EMERGENCY_NO_DEDUP === 'true');
      
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
        summary_zh_short: finalAiData.summary_zh_short,
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
      
      // 🚀 保存到D1数据库（混合架构）
      const articleData = {
        link,
        title: finalTitle,
        description,
        summary_zh: finalAiData.summary_zh,
        summary_en: description,
        keywords_zh: finalAiData.keywords_zh,
        keywords_en: '',
        feedUrl
      };
      await saveProcessedArticlesToD1(env, [articleData], logs);
      
      logs.push(`[发布] ✅ 成功 (${published}/${dailyTarget})`);
      
    } catch (error) {
      logs.push(`[AI处理] ❌ 处理失败: ${error.message}`);
      console.error('[AI处理] 错误:', error);
    }
  } // End of for loop
  
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

// 高质量专业内容生成器（替代AI失败时的备用方案）
function createFallbackContent(title, description) {
  console.log('[高质量备用] 🎯 生成专业内容:', title.substring(0, 50) + '...');
  
  // 1. 专业中文标题生成（基于语义理解）
  const chineseTitle = generateProfessionalChineseTitle(title);
  
  // 2. 智能摘要生成（基于内容分析而非模板）
  const chineseSummary = generateIntelligentSummary(title, description, 'zh');
  const englishSummary = generateIntelligentSummary(title, description, 'en');
  
  // 3. 上下文关键词提取（基于语义分析）
  const chineseKeywords = extractContextualKeywords(title, description, 'zh');
  const englishKeywords = extractContextualKeywords(title, description, 'en');
  
  console.log('[高质量备用] ✅ 专业内容已生成 - 中文标题:', chineseTitle);
  console.log('[高质量备用] ✅ 关键词质量 - 中文:', chineseKeywords.slice(0, 3));
  
  return {
    relevant: true,
    original_language: 'en',
    title_zh: chineseTitle,
    title_en: title,
    summary_zh: chineseSummary,
    summary_zh_short: chineseSummary.length > 200 ? chineseSummary.substring(0, 200) + '...' : chineseSummary,
    summary_en: englishSummary,
    summary_en_short: englishSummary.length > 200 ? englishSummary.substring(0, 200) + '...' : englishSummary,
    keywords_zh: chineseKeywords,
    keywords_en: englishKeywords
  };
}

// ==================== 高质量专业内容生成器 ====================

/**
 * 专业中文标题生成 - 基于语义理解而非简单替换
 */
function generateProfessionalChineseTitle(englishTitle) {
  const titleLower = englishTitle.toLowerCase();
  
  // 专业术语映射（更全面、更准确）
  const professionalTerms = {
    // AI核心术语
    'personal intelligence': '个人智能',
    'artificial intelligence': '人工智能', 
    'machine learning': '机器学习',
    'deep learning': '深度学习',
    'neural network': '神经网络',
    'language model': '语言模型',
    'large language model': '大语言模型',
    'transformer': '变换器架构',
    'attention mechanism': '注意力机制',
    'reinforcement learning': '强化学习',
    'computer vision': '计算机视觉',
    'natural language processing': '自然语言处理',
    'multimodal': '多模态',
    
    // 技术平台和框架
    'tensorflow': 'TensorFlow',
    'pytorch': 'PyTorch', 
    'hugging face': 'Hugging Face',
    'replicate': 'Replicate平台',
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': '谷歌',
    'microsoft': '微软',
    'nvidia': '英伟达',
    'meta': 'Meta',
    
    // 技术概念
    'gated sparse attention': '门控稀疏注意力机制',
    'computational efficiency': '计算效率',
    'training stability': '训练稳定性',
    'long-context': '长上下文',
    'fine-tune': '微调',
    'pre-training': '预训练',
    'inference': '推理',
    'deployment': '部署',
    'scaling': '扩展',
    'optimization': '优化',
    
    // 产品和应用
    'search': '搜索',
    'chatbot': '聊天机器人',
    'assistant': '智能助手',
    'recommendation': '推荐系统',
    'generation': '生成',
    'classification': '分类',
    'detection': '检测',
    'recognition': '识别',
    
    // 数据和基础设施
    'database': '数据库',
    'postgresql': 'PostgreSQL数据库',
    'cloud': '云计算',
    'api': 'API接口',
    'framework': '框架',
    'library': '库',
    'toolkit': '工具包'
  };
  
  let chineseTitle = englishTitle;
  
  // 按长度排序，先替换长短语，避免部分替换
  const sortedTerms = Object.entries(professionalTerms)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [english, chinese] of sortedTerms) {
    const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    chineseTitle = chineseTitle.replace(regex, chinese);
  }
  
  // 如果标题仍然主要是英文，添加技术领域前缀
  const chineseCharCount = (chineseTitle.match(/[\u4e00-\u9fff]/g) || []).length;
  if (chineseCharCount < 4) {
    const domain = identifyTechnicalDomain(englishTitle);
    chineseTitle = `${domain}：${chineseTitle}`;
  }
  
  return chineseTitle;
}

/**
 * 识别技术领域
 */
function identifyTechnicalDomain(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('search') || titleLower.includes('retrieval')) return 'AI搜索技术';
  if (titleLower.includes('language') || titleLower.includes('llm') || titleLower.includes('gpt')) return '大语言模型';
  if (titleLower.includes('vision') || titleLower.includes('image') || titleLower.includes('visual')) return '计算机视觉';
  if (titleLower.includes('multimodal') || titleLower.includes('multi-modal')) return '多模态AI';
  if (titleLower.includes('reinforcement') || titleLower.includes('rl')) return '强化学学习';
  if (titleLower.includes('neural') || titleLower.includes('deep')) return '深度学习';
  if (titleLower.includes('attention') || titleLower.includes('transformer')) return '注意力机制';
  if (titleLower.includes('database') || titleLower.includes('postgresql')) return '数据库技术';
  if (titleLower.includes('cloud') || titleLower.includes('infrastructure')) return '云计算基础设施';
  
  // 公司特定领域
  if (titleLower.includes('google')) return '谷歌AI技术';
  if (titleLower.includes('openai')) return 'OpenAI技术';
  if (titleLower.includes('nvidia')) return '英伟达AI';
  if (titleLower.includes('microsoft')) return '微软AI研究';
  
  return 'AI技术突破';
}

/**
 * 智能摘要生成 - 基于内容分析而非模板
 */
function generateIntelligentSummary(title, description, language) {
  const domain = identifyTechnicalDomain(title);
  const significance = assessTechnicalSignificance(title, description);
  
  if (language === 'zh') {
    return generateChineseSummary(title, description, domain, significance);
  } else {
    return generateEnglishSummary(title, description, domain, significance);
  }
}

function generateChineseSummary(title, description, domain, significance) {
  // 提取关键信息
  const keyTech = extractKeyTechnologies(title);
  const companies = extractCompanies(title);
  
  let summary = '';
  
  // 开头：技术发布/突破
  if (companies.length > 0) {
    summary += `${companies[0]}发布${keyTech.length > 0 ? keyTech[0] : '新技术'}`;
  } else {
    summary += `${domain}领域取得重要进展`;
  }
  
  // 主体：技术特点和应用
  if (description && description.length > 20) {
    const processedDesc = description.substring(0, 300)
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ');
    summary += `，${processedDesc}`;
  } else {
    summary += `，该技术在${extractTechnicalField(title)}方面实现突破`;
  }
  
  // 结尾：意义和影响
  summary += `。这项创新将为AI技术应用带来显著提升，推动相关领域的技术发展和产业化应用。`;
  
  return summary;
}

function generateEnglishSummary(title, description, domain, significance) {
  let summary = `${title} represents a ${significance} advancement in ${extractTechnicalField(title)}. `;
  
  if (description && description.length > 20) {
    summary += description.substring(0, 400);
  } else {
    summary += `This innovation introduces novel approaches to address key challenges in the field, with potential applications across multiple domains.`;
  }
  
  summary += ` The development is expected to have substantial impact on AI technology applications and future research directions.`;
  
  return summary;
}

/**
 * 上下文关键词提取 - 基于语义分析
 */
function extractContextualKeywords(title, description, language) {
  const titleLower = title.toLowerCase();
  const descLower = (description || '').toLowerCase();
  const combined = titleLower + ' ' + descLower;
  
  if (language === 'zh') {
    return extractChineseKeywords(combined, title);
  } else {
    return extractEnglishKeywords(combined, title);
  }
}

function extractChineseKeywords(content, originalTitle) {
  const keywords = [];
  
  // 核心技术关键词（更精准）
  const techKeywords = {
    'personal intelligence': '个人智能搜索',
    'isaac': 'Isaac模型',
    'replicate': 'Replicate平台', 
    'gated sparse': '门控稀疏注意力',
    'postgresql': 'PostgreSQL扩展',
    'chatgpt': 'ChatGPT技术',
    'multimodal': '多模态AI系统',
    'neural net': '深度神经网络',
    'tensorflow': 'TensorFlow框架',
    'language model': '大语言模型技术',
    'attention': '注意力机制优化',
    'reinforcement': '强化学习算法',
    'computer vision': '计算机视觉技术',
    'search': '智能搜索技术',
    'fine-tune': '模型微调技术'
  };
  
  // 公司和平台关键词
  const companyKeywords = {
    'google': '谷歌AI技术',
    'openai': 'OpenAI创新',
    'microsoft': '微软AI研究',
    'nvidia': '英伟达计算平台',
    'anthropic': 'Anthropic技术',
    'meta': 'Meta AI平台'
  };
  
  // 提取技术关键词
  for (const [english, chinese] of Object.entries(techKeywords)) {
    if (content.includes(english)) {
      keywords.push(chinese);
    }
  }
  
  // 提取公司关键词
  for (const [english, chinese] of Object.entries(companyKeywords)) {
    if (content.includes(english)) {
      keywords.push(chinese);
    }
  }
  
  // 基于标题添加领域关键词
  const domain = identifyTechnicalDomain(originalTitle);
  if (domain && !keywords.some(k => k.includes(domain.split('：')[0]))) {
    keywords.push(domain.replace('：', ''));
  }
  
  // 确保有足够的关键词
  if (keywords.length < 3) {
    const fallbackKeywords = ['AI技术创新', '机器学习应用', '智能计算平台', '技术架构优化'];
    keywords.push(...fallbackKeywords.slice(0, 3 - keywords.length));
  }
  
  return keywords.slice(0, 5);
}

function extractEnglishKeywords(content, originalTitle) {
  const keywords = [];
  
  // 精确的英文关键词映射
  const techKeywords = {
    'personal intelligence': 'personal ai systems',
    'isaac': 'isaac simulation platform',
    'replicate': 'replicate ml platform',
    'gated sparse': 'sparse attention mechanisms',
    'postgresql': 'postgresql optimization',
    'chatgpt': 'chatgpt infrastructure',
    'multimodal': 'multimodal ai systems',
    'neural net': 'neural network architectures',
    'tensorflow': 'tensorflow ecosystem',
    'language model': 'language model training',
    'attention': 'attention mechanisms',
    'reinforcement': 'reinforcement learning',
    'computer vision': 'computer vision systems',
    'search': 'search technologies',
    'fine-tune': 'model fine-tuning'
  };
  
  const companyKeywords = {
    'google': 'google ai research',
    'openai': 'openai technologies',
    'microsoft': 'microsoft research',
    'nvidia': 'nvidia computing',
    'anthropic': 'anthropic ai',
    'meta': 'meta ai platforms'
  };
  
  // 提取关键词
  for (const [trigger, keyword] of Object.entries(techKeywords)) {
    if (content.includes(trigger)) {
      keywords.push(keyword);
    }
  }
  
  for (const [trigger, keyword] of Object.entries(companyKeywords)) {
    if (content.includes(trigger)) {
      keywords.push(keyword);
    }
  }
  
  // 通用AI关键词
  const generalKeywords = ['artificial intelligence', 'machine learning', 'deep learning', 'neural networks'];
  if (keywords.length < 3) {
    for (const keyword of generalKeywords) {
      if (content.includes(keyword.replace(' ', '')) || content.includes(keyword)) {
        keywords.push(keyword);
        if (keywords.length >= 3) break;
      }
    }
  }
  
  // 最终备用关键词
  if (keywords.length < 3) {
    const fallbackKeywords = ['ai innovation', 'technology advancement', 'computational systems'];
    keywords.push(...fallbackKeywords.slice(0, 3 - keywords.length));
  }
  
  return keywords.slice(0, 5);
}

// 辅助函数
function extractKeyTechnologies(title) {
  const tech = [];
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('gpt') || titleLower.includes('language model')) tech.push('大语言模型');
  if (titleLower.includes('neural') || titleLower.includes('deep')) tech.push('神经网络');
  if (titleLower.includes('attention')) tech.push('注意力机制');
  if (titleLower.includes('reinforcement')) tech.push('强化学习');
  if (titleLower.includes('multimodal')) tech.push('多模态AI');
  
  return tech;
}

function extractCompanies(title) {
  const companies = [];
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('google')) companies.push('谷歌');
  if (titleLower.includes('openai')) companies.push('OpenAI');
  if (titleLower.includes('microsoft')) companies.push('微软');
  if (titleLower.includes('nvidia')) companies.push('英伟达');
  if (titleLower.includes('meta')) companies.push('Meta');
  
  return companies;
}

function assessTechnicalSignificance(title, description) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('breakthrough') || titleLower.includes('new') || titleLower.includes('novel')) {
    return 'breakthrough';
  }
  if (titleLower.includes('improved') || titleLower.includes('enhanced') || titleLower.includes('optimized')) {
    return 'significant';  
  }
  return 'important';
}

function extractTechnicalField(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('search')) return '搜索技术';
  if (titleLower.includes('language')) return '自然语言处理';
  if (titleLower.includes('vision')) return '计算机视觉';
  if (titleLower.includes('multimodal')) return '多模态AI';
  if (titleLower.includes('reinforcement')) return '强化学习';
  if (titleLower.includes('neural')) return '深度学习';
  if (titleLower.includes('database')) return '数据库技术';
  
  return 'AI技术';
}

// 智能中文标题生成（调用高质量版本）
function generateIntelligentTitle(englishTitle) {
  return generateProfessionalChineseTitle(englishTitle);
}

// 生成结构化摘要（调用高质量版本）
function generateStructuredSummary(title, description, lang) {
  return generateIntelligentSummary(title, description, lang);
}

// 智能关键词提取（调用高质量版本）
function extractIntelligentKeywords(title, lang) {
  return extractContextualKeywords(title, '', lang);
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
  // 强制优先使用Claude获得最高质量
  if (env.CLAUDE_API_KEY) {
    console.log('[AI Provider] 使用Claude API确保高质量');
    return AI_PROVIDERS.CLAUDE;
  }
  
  const provider = (env.AI_PROVIDER || 'openrouter').toLowerCase();
  
  if (provider === 'claude_agent' && CLAUDE_AGENT_CONFIG.enabled) {
    return AI_PROVIDERS.CLAUDE_AGENT;
  }
  
  console.log('[AI Provider] 回退到OpenRouter');
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
    
    let prompt;
    
    if (isForcedScreening) {
      prompt = 
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
}`;
    } else if (isForceTranslation) {
      prompt = 
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

严格按照要求翻译，title_zh必须是中文！`;
    } else {
      prompt = `判断以下内容是否与人工智能领域相关，并生成完整的双语摘要。

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

async function callOpenRouterAI(env, title, description, purpose = 'screening', specificModel = null, customPrompt = null) {
  console.log(`[OpenRouter] 🎯 AI任务: ${purpose}`);
  console.log(`[OpenRouter] API Key存在: ${!!env.OPENROUTER_API_KEY}`);
  
  // 使用自定义提示词或创建标准提示词
  const prompt = customPrompt || createPromptForPurpose(purpose, title, description);
  
  // 如果指定了特定模型，则只使用该模型
  let modelList;
  if (specificModel) {
    modelList = [specificModel];
    console.log(`[OpenRouter] 使用指定模型: ${specificModel}`);
  } else {
    // 根据任务类型选择模型组
    let modelGroup;
    switch (purpose) {
      case 'screening':
      case 'primary_screening':
        modelGroup = 'screening';  // 使用Grok/Groq进行快速筛选
        break;
      case 'secondary_screening':
        modelGroup = 'content_generation';  // 使用高质量模型进行深度筛选
        break;
      case 'content_generation':
        modelGroup = 'content_generation';  // 使用Claude/Gemini进行内容生成
        break;
      case 'translation_refinement':
        modelGroup = 'translation_refinement';  // 使用最高质量模型进行翻译精修
        break;
      default:
        modelGroup = 'screening';
    }

    modelList = OPENROUTER_CONFIG.models[modelGroup] || OPENROUTER_CONFIG.models.screening;
    console.log(`[OpenRouter] 使用${modelGroup}模型组，共${modelList.length}个模型`);
  }
  
  for (let i = 0; i < modelList.length; i++) {
    const model = modelList[i];
    console.log(`[OpenRouter] 🤖 尝试模型: ${model} (${i + 1}/${modelList.length})`);
    
    try {
      const response = await fetch(OPENROUTER_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://siji-worker-v2.chengqiangshang.workers.dev',
          'X-Title': 'AI资讯汇总系统'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000,
          temperature: 0.3
        })
      });

      console.log(`[OpenRouter] 📡 响应状态: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[OpenRouter] ❌ 模型 ${model} 失败: ${response.status} - ${errorText}`);
        
        // 如果还有其他模型可尝试，继续下一个
        if (i < modelList.length - 1) {
          console.log(`[OpenRouter] 🔄 切换到下一个模型...`);
          continue;
        } else {
          throw new Error(`所有模型都失败了。最后错误: ${errorText}`);
        }
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.log(`[OpenRouter] ⚠️ 模型 ${model} 返回空内容`);
        if (i < modelList.length - 1) {
          continue;
        } else {
          throw new Error('AI返回空内容');
        }
      }

      console.log(`[OpenRouter] ✅ 模型 ${model} 成功返回内容`);
      
      // 清理并解析JSON
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const result = JSON.parse(cleanedContent);
        console.log(`[OpenRouter] 🎉 JSON解析成功 - 任务: ${purpose}`);
        return result;
        
      } catch (parseError) {
        console.error(`[OpenRouter] ❌ JSON解析失败: ${parseError.message}`);
        console.log(`[OpenRouter] 原始内容: ${cleanedContent.substring(0, 200)}...`);
        
        if (i < modelList.length - 1) {
          continue;
        } else {
          throw new Error(`JSON解析失败: ${parseError.message}`);
        }
      }
      
    } catch (error) {
      console.error(`[OpenRouter] ❌ 模型 ${model} 异常: ${error.message}`);
      
      if (i < modelList.length - 1) {
        console.log(`[OpenRouter] 🔄 尝试下一个模型...`);
        continue;
      } else {
        throw error;
      }
    }
  }
}

// 🔍 筛选阶段提示词（使用Grok/Groq进行快速判断）
function createScreeningPrompt(title, description) {
  return `作为AI内容筛选专家，判断以下内容是否与人工智能、机器学习、深度学习相关。

【筛选标准】
✅ 相关内容：AI/ML算法、模型、工具、产品、研究、应用、公司动态
✅ 包含关键词：OpenAI、Google AI、机器学习、神经网络、大语言模型、ChatGPT等
❌ 不相关内容：纯业务新闻、娱乐八卦、传统软件、非技术内容

【输入】
标题: ${title}
描述: ${description || '无描述'}

【输出】只需返回简单JSON：
{
  "relevant": true/false,
  "reason": "判断理由"
}`;
}

// 📝 内容生成阶段提示词（使用Claude/Gemini生成高质量双语内容）
function createContentGenerationPrompt(title, description) {
  return `作为AI技术内容专家，为这篇AI相关文章生成专业的双语内容。

【内容要求】
1. 生成自然流畅的中文标题（完全翻译，不保留英文）
2. 创建专业的双语摘要（中文500字，英文400词）
3. 提供准确的技术关键词
4. 摘要要体现技术价值和创新点

【输入】
标题: ${title}
描述: ${description || ''}

【输出格式】
{
  "relevant": true,
  "original_language": "en",
  "title_zh": "完整的中文标题",
  "title_en": "${title}",
  "summary_zh": "专业中文摘要，详细介绍技术特点、应用场景和价值",
  "summary_zh_short": "200字中文摘要",
  "summary_en": "Professional English summary covering technical aspects and applications",
  "summary_en_short": "200-word English summary",
  "keywords_zh": ["中文关键词1", "关键词2", "关键词3"],
  "keywords_en": ["english_keyword1", "keyword2", "keyword3"]
}`;
}

// 🎯 翻译精修阶段提示词（使用最高质量模型优化翻译）
function createTranslationRefinementPrompt(title, description) {
  return `作为专业翻译专家，优化这篇AI技术文章的中文翻译质量。

【优化目标】
1. 确保中文标题自然流畅，符合中文表达习惯
2. 提升摘要的专业性和可读性
3. 优化技术术语的中文表达

【输入】
标题: ${title}
描述: ${description || ''}

【输出格式】
{
  "title_zh_refined": "优化后的中文标题",
  "summary_zh_refined": "优化后的中文摘要",
  "keywords_zh_refined": ["优化后的中文关键词"]
}
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

严格按照要求翻译，title_zh必须是中文！`;
    }

  // 根据用途选择模型
  const modelList = OPENROUTER_CONFIG.models[purpose] || OPENROUTER_CONFIG.models.fallback;
  console.log(`[AI] 使用${purpose}策略，可用模型: ${modelList.length}个`);
  
  for (let i = 0; i < modelList.length; i++) {
    const model = modelList[i];
    try {
      console.log(`[AI] 尝试模型 ${i + 1}/${modelList.length}: ${model} (${purpose})`);
      console.log(`[OpenRouter Debug] 请求URL: ${OPENROUTER_CONFIG.endpoint}`);
      console.log(`[OpenRouter Debug] 请求体预览: ${JSON.stringify({model, messages: [{role: 'user', content: prompt.substring(0, 100) + '...'}]}).substring(0, 200)}...`);
      
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
      console.log(`[OpenRouter Debug] 响应状态: ${response.status}`);
      console.log(`[OpenRouter Debug] 响应数据结构: ${JSON.stringify(Object.keys(data))}`);
      
      const content = data.choices?.[0]?.message?.content;
      console.log(`[OpenRouter Debug] 内容存在: ${!!content}, 长度: ${content?.length || 0}`);
      
      if (!content) {
        console.error(`[AI] 模型 ${model} 返回空内容，完整响应:`, JSON.stringify(data).substring(0, 500));
        if (i < models.length - 1) continue;
        throw new Error('AI返回空内容');
      }

      console.log(`[OpenRouter Debug] 原始内容预览: ${content.substring(0, 100)}...`);
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log(`[OpenRouter Debug] 清理后内容预览: ${cleanedContent.substring(0, 100)}...`);
      
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
  
  // TG消息格式：中文标题带超链接 + 中文200字短摘要 + 原文链接
  const message = `📰 斯基GPT发布文章摘要

[**${article.title}**](${sijigptUrl})

${article.summary_zh_short || article.summary}

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

  // 🚀 阶段1优化：增强汇总信息
  const currentTime = new Date().toLocaleString('zh-CN', { 
    timeZone: 'Asia/Shanghai', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit'
  });
  
  // 按来源分类文章（展示并行抓取效果）
  const sourceStats = {};
  articles.forEach(article => {
    if (article.url) {
      const domain = new URL(article.url).hostname;
      sourceStats[domain] = (sourceStats[domain] || 0) + 1;
    }
  });
  
  const sourceInfo = Object.entries(sourceStats)
    .map(([domain, count]) => `  • ${domain}: ${count}篇`)
    .slice(0, 5) // 只显示前5个来源
    .join('\n');
  
  const articleList = articles
    .slice(0, 8) // 只显示前8篇，避免消息过长
    .map((a, i) => `${i + 1}. [${a.title.substring(0, 40)}...](https://sijigpt.com)`)
    .join('\n');
    
  const remainingCount = articles.length > 8 ? articles.length - 8 : 0;

  const message = `🤖 **AI智能聚合完成** 
⏰ ${currentTime}

📊 **本次成果**
✅ 发布文章：**${articles.length}篇**
🔍 AI分层筛选：Grok初筛 + Claude深度分析  
🚀 并行处理：显著提升效率

📋 **文章列表**
${articleList}
${remainingCount > 0 ? `\n📎 还有${remainingCount}篇文章...` : ''}

📈 **来源分布**
${sourceInfo}

🌐 **完整内容** → https://sijigpt.com`;

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

// ==================== 📱 Telegram发布功能（仅RSS推送） ====================

/**
 * 第一层AI筛选：使用Grok/Groq进行快速宽松筛选
 * @param {Object} env - 环境变量
 * @param {string} title - 文章标题
 * @param {string} description - 文章描述
 * @param {Array} logs - 日志数组
 * @returns {Object} 筛选结果
 */
async function performPrimaryScreening(env, title, description, logs) {
  const prompt = `你是AI产品发布监控专家。请快速判断以下内容是否为AI产品发布或重要更新。

标题: ${title}
描述: ${description}

🔥 AI产品发布必须推送！重点监控公司：
🏢 Google/DeepMind、OpenAI、Anthropic/Claude、xAI/Grok、NVIDIA、Meta、Microsoft
🏢 DeepSeek、Qwen/阿里、Groq、GenSpark、Manus、百度、腾讯、字节

✅ 必须捕获的发布类型：
- 🤖 AI模型发布：GPT-4o、Claude-3.5、Gemini-2.0、Grok-2、DeepSeek-V3、Qwen-2.5
- 🚀 AI产品上线：ChatGPT功能、Google AI搜索、Copilot更新、Siri升级
- 🛠️ AI工具发布：LangChain、AutoGen、CrewAI、Agent框架、AI SDK
- 💾 AI硬件发布：H100、H200、AI芯片、推理加速器、Edge AI设备
- 🔧 AI平台更新：Hugging Face、Replicate、Runway、Midjourney
- 📊 AI研究突破：Attention机制、多模态、强化学习、SOTA结果
- 💰 AI融资收购：AI公司融资、技术收购、重要合作
- 📜 AI政策法规：AI监管、伦理标准、安全规范

🎯 强化信号词组合检测：
- [公司] + [发布/推出/宣布/上线/launch/release/unveil]
- [AI产品] + [更新/版本/新功能/beta/available]
- [模型名] + [开源/发布/训练/fine-tune]

⚡ 特殊规则：
- Google + AI搜索 = 必推 ✅
- OpenAI + GPT = 必推 ✅  
- NVIDIA + AI硬件 = 必推 ✅
- Anthropic + Claude = 必推 ✅
- xAI + Grok = 必推 ✅
- DeepSeek + 模型 = 必推 ✅
- GenSpark + AI = 必推 ✅

返回JSON格式：
{
  "relevant": true/false,
  "confidence": 0.0-1.0,
  "category": "产品发布/功能更新/模型发布/硬件发布/融资收购/研究突破",
  "key_entities": ["检测到的关键实体"],
  "release_signals": ["发现的发布信号"],
  "must_push": true/false,
  "reason": "检测原因"
}

🚨 核心原则：AI产品发布必须推送！宁多勿漏！`;

  // 首选Grok 4.1 Fast，备选Groq
  const models = ['x-ai/grok-4.1-fast', 'groq/llama-3.1-70b-versatile'];
  
  for (const model of models) {
    try {
      logs.push(`[一级筛选] 🔍 使用 ${model} 进行快速筛选...`);
      const result = await callOpenRouterAI(env, title, description, 'primary_screening', model, prompt);
      
      if (result && result.relevant !== undefined) {
        logs.push(`[一级筛选] ✅ ${model} 返回结果: 相关=${result.relevant}, 置信度=${result.confidence}`);
        return result;
      }
    } catch (error) {
      logs.push(`[一级筛选] ❌ ${model} 失败: ${error.message}`);
      continue;
    }
  }
  
  // 全部失败，返回保守结果（倾向于通过）
  logs.push(`[一级筛选] ⚠️ 所有模型失败，采用宽松策略`);
  return { 
    relevant: true, 
    confidence: 0.5, 
    category: "未知",
    reason: "AI筛选失败，采用保守策略" 
  };
}

/**
 * 第二层AI筛选：使用Gemini 2.5 Pro进行深度语义理解
 * @param {Object} env - 环境变量
 * @param {string} title - 文章标题
 * @param {string} description - 文章描述
 * @param {Object} primaryResult - 一级筛选结果
 * @param {Array} logs - 日志数组
 * @returns {Object} 深度筛选结果
 */
async function performSecondaryScreening(env, title, description, primaryResult, logs) {
  const prompt = `你是一个资深AI行业分析师。请对以下已通过初筛的内容进行深度评估。

标题: ${title}  
描述: ${description}
初筛结果: ${JSON.stringify(primaryResult)}

📊 深度评估维度：
1. AI产品发布价值 (40%)：是否为重要AI产品/模型/功能发布
2. 技术创新程度 (25%)：技术突破性和创新水平  
3. 市场影响力 (20%)：对AI生态和行业的影响
4. 内容完整性 (15%)：信息的详细程度和可信度

🔥 必须通过的AI产品发布（零容忍遗漏）：
- 🤖 重大AI模型：GPT-4o/5、Claude-3.5/4、Gemini-2.0、Grok-2、LLaMA-3、DeepSeek-V3
- 🚀 AI产品功能：ChatGPT Plus、Google AI搜索、Copilot Pro、Siri升级、Alexa AI
- 🛠️ AI开发工具：LangChain更新、Cursor AI、GitHub Copilot、Replit Agent
- 💾 AI硬件平台：NVIDIA H系列、TPU v5、AI芯片、Groq LPU、Cerebras
- 📱 AI Agent系统：AutoGPT、CrewAI、MetaGPT、智能助手框架
- 🔬 AI研究突破：Attention变体、多模态融合、RLHF、Constitutional AI
- 💰 重要商业动态：AI独角兽融资、大厂AI收购、技术授权合作
- 📊 AI基准突破：SOTA性能、新评测标准、能力边界突破

⭐ 超高优先级（见到就推）：
- OpenAI全家桶产品 🏆
- Google/DeepMind AI技术 🏆  
- NVIDIA AI硬件生态 🏆
- Anthropic Claude系列 🏆
- Meta LLaMA开源 🏆
- Microsoft AI集成 🏆
- xAI Grok突破 🏆
- DeepSeek开源模型 🏆
- GenSpark AI产品 🏆
- Manus AI技术 🏆
- AI硬件和基础设施 (中优先级)
- AI政策和行业动态 (中优先级)

请返回JSON格式：
{
  "approved": true/false,
  "overall_score": 0.0-1.0,
  "dimension_scores": {
    "ai_product_release_value": 0.0-1.0,
    "technical_innovation": 0.0-1.0, 
    "market_impact": 0.0-1.0,
    "content_completeness": 0.0-1.0
  },
  "content_type": "具体分类（如：AI模型发布、产品功能更新、技术研究等）",
  "key_highlights": ["要点1", "要点2", "要点3"],
  "reasoning": "详细分析原因（100-200字）"
}

⭐ AI产品发布评分标准：
- 0.9+：重大AI产品发布，必须收录 🔥
- 0.7-0.89：重要AI更新/功能，强烈推荐 💎
- 0.5-0.69：有价值的AI内容，建议收录 ✅
- 0.3-0.49：边缘AI相关，宽松通过 ⚠️
- 0.3以下：完全无关，建议拒绝 ❌

🚨 特别提醒：对于AI产品发布相关的内容，采用宽松策略，倾向于通过！

🎯 决策倾向：保持开放态度，重点是不遗漏有价值的AI产品和技术更新。`;

  try {
    logs.push(`[二级筛选] 🔬 使用 Gemini 2.5 Pro 进行深度分析（成本优化-60%）...`);
    const result = await callOpenRouterAI(env, title, description, 'secondary_screening', null, prompt);
    
    if (result && result.approved !== undefined) {
      logs.push(`[二级筛选] ✅ Gemini 2.5 Pro 分析完成: 通过=${result.approved}, 综合评分=${result.overall_score}`);
      return result;
    }
  } catch (error) {
    logs.push(`[二级筛选] ❌ Gemini 分析失败: ${error.message}`);
  }
  
  // 失败时的宽松策略
  const fallbackApproved = primaryResult.confidence >= 0.5;
  logs.push(`[二级筛选] ⚠️ 分析失败，基于初筛置信度(${primaryResult.confidence})决策: ${fallbackApproved}`);
  
  return {
    approved: fallbackApproved,
    overall_score: primaryResult.confidence,
    reasoning: "二级筛选失败，基于初筛结果和宽松策略决策"
  };
}

/**
 * 使用AI增强内容
 * @param {Object} env - 环境变量
 * @param {Object} messageData - 消息数据
 * @returns {Object} 增强后的内容
 */
// Telegram到Payload发布功能已删除 - 仅保留RSS到Telegram推送

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
            <strong>📱 Telegram功能</strong><br>
            • RSS文章 → Telegram频道推送 ✅ 已启用<br>
            • 中文200字短摘要格式 📝<br>
            • 文章标题链接到SijiGPT网站 🔗<br>
            <strong>⚠️ TG频道→Payload功能已移除</strong>
        </div>
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