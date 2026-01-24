/**
 * AI分层筛选配置 - 放宽标准，重点捕捉AI产品发布和功能更新
 * 
 * 架构：
 * 1. Grok/Groq 初级筛选（快速、宽松）
 * 2. Gemini 2.5 Pro 二级筛选（深度、语义理解）
 */

export const AI_SCREENING_CONFIG = {
  // 第一层筛选：Grok/Groq - 快速宽松筛选
  primary_screening: {
    models: ['x-ai/grok-2-1212', 'groq/llama-3.1-70b-versatile'],
    threshold: 0.3, // 降低阈值，更宽松
    keywords_weight: 0.6,
    context_weight: 0.4,
    
    // 扩展的AI相关关键词
    ai_keywords: [
      // 核心AI术语
      'AI', 'ML', 'LLM', 'GPT', 'ChatGPT', 'Claude', 'Gemini', 'Bard',
      'machine learning', 'deep learning', 'neural network', 'transformer',
      'diffusion', 'stable diffusion', 'midjourney', 'dalle',
      
      // AI Agent和自动化
      'ai agent', 'autonomous agent', 'multi-agent', 'agent framework',
      'langchain', 'autogen', 'crew ai', 'semantic kernel',
      'workflow automation', 'robotic process automation', 'rpa',
      
      // AI软硬件产品
      'ai chip', 'gpu', 'tpu', 'ai accelerator', 'inference engine',
      'edge ai', 'ai sdk', 'api', 'model serving', 'deployment',
      'ai platform', 'mlops', 'ai infrastructure',
      
      // 产品发布关键词
      'launch', 'release', 'unveil', 'announce', 'introduce',
      'beta', 'preview', 'update', 'version', 'upgrade',
      '发布', '推出', '上线', '更新', '升级', '版本',
      
      // 功能更新
      'feature', 'capability', 'enhancement', 'improvement',
      'integration', 'support', 'plugin', 'extension',
      '功能', '特性', '增强', '改进', '集成', '支持'
    ],
    
    // 重要公司和平台
    important_entities: [
      'openai', 'google', 'microsoft', 'meta', 'amazon', 'apple',
      'nvidia', 'anthropic', 'hugging face', 'replicate',
      'stability ai', 'midjourney', 'runaway', 'adobe',
      'salesforce', 'databricks', 'snowflake', 'github',
      '谷歌', '微软', '苹果', '英伟达', '亚马逊'
    ],
    
    // AI产品和服务
    ai_products: [
      'chatgpt', 'claude', 'gemini', 'bard', 'copilot', 'siri', 'alexa',
      'midjourney', 'stable diffusion', 'dall-e', 'firefly',
      'langchain', 'llama', 'palm', 'gpt-4', 'gpt-3.5',
      'whisper', 'codex', 'embeddings', 'fine-tuning',
      'isaac', 'replicate', 'hugging face', 'gradio'
    ]
  },
  
  // 第二层筛选：Gemini 2.5 Pro - 深度语义理解
  secondary_screening: {
    model: 'google/gemini-2.5-flash-thinking-exp',
    threshold: 0.6, // 稍高阈值，但仍然包容
    
    // 深度评估维度
    evaluation_criteria: {
      ai_relevance: 0.25,      // AI技术相关性
      product_impact: 0.25,    // 产品影响力
      innovation_level: 0.20,  // 创新程度
      market_significance: 0.15, // 市场意义
      technical_depth: 0.15    // 技术深度
    },
    
    // 必须通过的产品类型
    must_include_types: [
      'ai_model_release',      // AI模型发布
      'ai_product_launch',     // AI产品上线
      'ai_feature_update',     // AI功能更新
      'ai_platform_service',   // AI平台服务
      'ai_hardware_announce',  // AI硬件发布
      'ai_sdk_api_release',    // AI SDK/API发布
      'ai_research_breakthrough', // AI研究突破
      'ai_company_news',       // AI公司重要消息
      'ai_funding_acquisition', // AI融资收购
      'ai_partnership',        // AI合作伙伴关系
      'ai_regulation_policy',  // AI监管政策
      'ai_ethics_safety'       // AI伦理安全
    ]
  },
  
  // 筛选提示词模板
  prompts: {
    primary_screening: `你是一个AI新闻筛选专家。请快速判断以下内容是否与AI领域相关。

标题: {title}
描述: {description}

🎯 筛选目标：捕捉所有AI软硬件产品发布、AI Agent、功能更新等

✅ 必须包含的内容类型：
- AI/ML模型发布和更新
- AI产品和服务上线
- AI硬件和芯片发布  
- AI开发工具和平台
- AI Agent和自动化工具
- 大厂AI功能更新
- AI研究和论文
- AI公司动态和融资
- AI政策和监管

🔍 关键信号词：
AI, ML, ChatGPT, Claude, Gemini, GPT, 机器学习, 深度学习, 神经网络, Agent, 自动化, 发布, 更新, 上线

请返回JSON格式：
{
  "relevant": true/false,
  "confidence": 0.0-1.0,
  "category": "产品发布/技术更新/研究论文/公司动态/其他",
  "reason": "简短原因"
}

原则：宁可多收录，不要遗漏重要AI产品发布！`,

    secondary_screening: `你是一个资深AI行业分析师。请对以下已通过初筛的内容进行深度评估。

标题: {title}  
描述: {description}
初筛结果: {primary_result}

📊 评估维度：
1. AI相关性 (25%)：与AI技术的直接关联度
2. 产品影响力 (25%)：对AI生态的潜在影响
3. 创新程度 (20%)：技术或应用的创新性
4. 市场意义 (15%)：商业和市场价值
5. 技术深度 (15%)：技术内容的专业程度

🎯 重点关注：
- 重大AI产品发布（如新模型、新平台）
- 知名公司的AI功能更新
- AI基础设施和工具链
- AI Agent和自动化解决方案
- 影响行业的AI研究成果

请返回JSON格式：
{
  "approved": true/false,
  "overall_score": 0.0-1.0,
  "dimension_scores": {
    "ai_relevance": 0.0-1.0,
    "product_impact": 0.0-1.0, 
    "innovation_level": 0.0-1.0,
    "market_significance": 0.0-1.0,
    "technical_depth": 0.0-1.0
  },
  "content_type": "具体分类",
  "key_highlights": ["要点1", "要点2", "要点3"],
  "reasoning": "详细分析原因"
}

标准：保持开放态度，重点是不遗漏有价值的AI产品和技术更新。`
  }
};

// 筛选流程实现
export async function performLayeredScreening(title, description, env) {
  console.log('🔍 开始分层AI筛选...');
  
  // 第一层：快速筛选
  const primaryResult = await primaryScreening(title, description, env);
  console.log('📋 初级筛选结果:', primaryResult);
  
  if (!primaryResult.relevant) {
    // 完全不相关，直接拒绝
    return {
      approved: false,
      stage: 'primary_rejected',
      result: primaryResult
    };
  }
  
  // 高置信度直接通过
  if (primaryResult.confidence >= 0.8) {
    return {
      approved: true,
      stage: 'primary_approved',
      result: primaryResult
    };
  }
  
  // 中等置信度进入二级筛选
  if (primaryResult.confidence >= 0.3) {
    console.log('🔬 进入二级深度筛选...');
    const secondaryResult = await secondaryScreening(title, description, primaryResult, env);
    console.log('📊 二级筛选结果:', secondaryResult);
    
    return {
      approved: secondaryResult.approved,
      stage: 'secondary_completed',
      primary_result: primaryResult,
      secondary_result: secondaryResult
    };
  }
  
  // 低置信度拒绝
  return {
    approved: false,
    stage: 'primary_low_confidence',
    result: primaryResult
  };
}

async function primaryScreening(title, description, env) {
  const config = AI_SCREENING_CONFIG.primary_screening;
  const prompt = AI_SCREENING_CONFIG.prompts.primary_screening
    .replace('{title}', title)
    .replace('{description}', description);
  
  // 使用Grok或Groq进行快速筛选
  for (const model of config.models) {
    try {
      const result = await callAIModel(model, prompt, env);
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      console.log(`❌ ${model} 初筛失败:`, error.message);
      continue;
    }
  }
  
  // 全部失败，返回保守结果
  return { relevant: false, confidence: 0, reason: "AI调用失败" };
}

async function secondaryScreening(title, description, primaryResult, env) {
  const prompt = AI_SCREENING_CONFIG.prompts.secondary_screening
    .replace('{title}', title)
    .replace('{description}', description)
    .replace('{primary_result}', JSON.stringify(primaryResult));
  
  try {
    const result = await callAIModel('google/gemini-2.5-flash-thinking-exp', prompt, env);
    return JSON.parse(result);
  } catch (error) {
    console.log('❌ Gemini二筛失败:', error.message);
    // 失败时采用宽松策略
    return {
      approved: primaryResult.confidence >= 0.5,
      reasoning: "二级筛选失败，基于初筛结果决策"
    };
  }
}

// 辅助函数：调用AI模型
async function callAIModel(model, prompt, env) {
  // 这里需要根据实际的API调用方式实现
  // 暂时返回模拟结果
  throw new Error('需要实现具体的AI模型调用');
}