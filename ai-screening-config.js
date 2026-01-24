/**
 * 重点AI产品发布筛选配置 - 确保不遗漏任何重要发布
 * 
 * 核心原则：AI产品发布必须推送！
 */

export const AI_PRODUCT_SCREENING = {
  // 🔥 必须捕获的公司和产品 - 任何相关内容都推送
  critical_entities: {
    // 核心AI公司
    companies: [
      'google', 'deepmind', 'alphabet',
      'openai', 'chatgpt', 'gpt',
      'anthropic', 'claude',
      'xai', 'x.ai', 'grok', 'elon musk',
      'meta', 'facebook', 'llama', 'pytorch',
      'microsoft', 'azure', 'copilot', 'bing',
      'amazon', 'aws', 'bedrock', 'alexa',
      'nvidia', 'cuda', 'tensorrt', 'omniverse', 'h100', 'a100',
      'apple', 'siri', 'core ml',
      'deepseek', 'qwen', 'alibaba', 'tongyi',
      'groq', 'cerebras', 'together ai',
      'genspark', 'manus', 'moonshot', 'zhipu',
      'baidu', 'ernie', 'paddle', 'wenxin',
      'tencent', 'hunyuan', 'wechat ai',
      'bytedance', 'doubao', 'volcano engine',
      'minimax', 'abab', 'sensetime',
      'hugging face', 'stability ai', 'midjourney',
      'replicate', 'runway', 'pika labs',
      '谷歌', '微软', '苹果', '英伟达', '亚马逊', '阿里巴巴', '腾讯', '百度', '字节跳动'
    ],
    
    // AI产品和模型
    products: [
      // 大语言模型
      'gpt-4', 'gpt-3.5', 'gpt-4o', 'gpt-4-turbo', 'o1', 'o3',
      'claude-3', 'claude-3.5', 'claude-sonnet', 'claude-haiku', 'claude-opus',
      'gemini', 'gemini-pro', 'gemini-ultra', 'gemini-nano', 'gemini-2.0',
      'llama', 'llama-2', 'llama-3', 'llama-3.1', 'llama-3.2',
      'grok-2', 'grok-1.5', 'grok-beta',
      'deepseek-v2', 'deepseek-coder', 'deepseek-v3',
      'qwen-2', 'qwen-2.5', 'qwen-max', 'tongyi-qianwen',
      'doubao', 'hunyuan', 'ernie-4', 'wenxin',
      'minimax-abab', 'yi-large', 'baichuan',
      
      // AI Agent和框架
      'ai agent', 'autonomous agent', 'multi-agent',
      'langchain', 'langgraph', 'autogen', 'crew ai',
      'semantic kernel', 'haystack', 'llamaindex',
      'chatdev', 'metagpt', 'agentgpt', 'auto-gpt',
      'jarvis', 'friday', 'assistant api',
      'workflow automation', 'process automation',
      
      // AI工具和平台  
      'chatgpt plus', 'claude pro', 'gemini advanced',
      'copilot pro', 'copilot studio', 'github copilot',
      'cursor', 'replit', 'codeium', 'tabnine',
      'stable diffusion', 'midjourney', 'dall-e', 'firefly',
      'sora', 'runway gen', 'pika', 'luma ai',
      'elevenlabs', 'murf ai', 'speechify',
      'perplexity', 'you.com', 'phind', 'devv',
      'notion ai', 'obsidian ai', 'roam research'
    ],
    
    // AI硬件和基础设施
    hardware: [
      'h100', 'h200', 'a100', 'a6000', 'l40s', 'l4',
      'tpu', 'tpu-v4', 'tpu-v5', 'inference chips',
      'ai chip', 'ai accelerator', 'neural processing unit',
      'edge ai', 'jetson', 'xavier', 'orin',
      'groq lpu', 'cerebras wafer', 'graphcore ipu',
      'ai server', 'ai workstation', 'ai cloud',
      'cuda', 'rocm', 'oneapi', 'triton',
      'tensorrt', 'openvino', 'onnx runtime'
    ]
  },
  
  // 🚨 产品发布关键信号词
  release_signals: {
    // 发布动词
    launch_verbs: [
      'launch', 'release', 'unveil', 'announce', 'introduce',
      'debut', 'rollout', 'ship', 'deploy', 'go live',
      'available', 'open source', 'open-source',
      '发布', '推出', '上线', '公布', '宣布', '开源',
      '正式发布', '正式上线', '全面推出'
    ],
    
    // 版本更新
    version_updates: [
      'version', 'v2', 'v3', 'v4', '2.0', '3.0', '4.0',
      'update', 'upgrade', 'enhancement', 'improvement',
      'beta', 'alpha', 'preview', 'early access',
      'new feature', 'new capability', 'now supports',
      '版本', '更新', '升级', '增强', '改进',
      '新功能', '新特性', '新增', '支持'
    ],
    
    // 重要里程碑
    milestones: [
      'breakthrough', 'milestone', 'first', 'world first',
      'record-breaking', 'state-of-the-art', 'sota',
      'best-in-class', 'leading', 'cutting-edge',
      'revolutionary', 'game-changing', 'innovative',
      '突破', '里程碑', '首个', '世界首个',
      '创纪录', '最先进', '领先', '革命性', '创新'
    ]
  },
  
  // 🎯 必须推送的内容类型
  must_push_types: [
    'ai_model_release',        // AI模型发布
    'ai_product_launch',       // AI产品上线
    'ai_api_release',          // AI API发布
    'ai_platform_update',      // AI平台更新
    'ai_hardware_announce',    // AI硬件发布
    'ai_funding_news',         // AI融资消息
    'ai_partnership',          // AI合作发布
    'ai_acquisition',          // AI收购消息
    'ai_research_paper',       // 重要AI论文
    'ai_conference_keynote',   // AI会议重要发言
    'ai_policy_regulation',    // AI政策法规
    'ai_safety_breakthrough', // AI安全突破
    'ai_benchmark_result',     // AI基准测试结果
    'ai_demo_showcase',        // AI产品演示
    'ai_open_source'           // AI开源项目
  ]
};

// 🔍 智能筛选函数 - 基于关键实体和信号词
export function intelligentAIScreening(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const config = AI_PRODUCT_SCREENING;
  
  let score = 0;
  let signals = [];
  let entityMatches = [];
  
  // 1. 检查关键公司/产品 (权重最高)
  for (const company of config.critical_entities.companies) {
    if (text.includes(company.toLowerCase())) {
      score += 0.4; // 公司匹配权重40%
      entityMatches.push(company);
      signals.push(`关键公司: ${company}`);
    }
  }
  
  for (const product of config.critical_entities.products) {
    if (text.includes(product.toLowerCase())) {
      score += 0.3; // 产品匹配权重30%
      entityMatches.push(product);
      signals.push(`AI产品: ${product}`);
    }
  }
  
  for (const hardware of config.critical_entities.hardware) {
    if (text.includes(hardware.toLowerCase())) {
      score += 0.25; // 硬件匹配权重25%
      entityMatches.push(hardware);
      signals.push(`AI硬件: ${hardware}`);
    }
  }
  
  // 2. 检查发布信号词
  for (const verb of config.release_signals.launch_verbs) {
    if (text.includes(verb.toLowerCase())) {
      score += 0.2; // 发布动词权重20%
      signals.push(`发布信号: ${verb}`);
      break; // 只加一次分
    }
  }
  
  for (const version of config.release_signals.version_updates) {
    if (text.includes(version.toLowerCase())) {
      score += 0.15; // 版本更新权重15%
      signals.push(`版本更新: ${version}`);
      break;
    }
  }
  
  for (const milestone of config.release_signals.milestones) {
    if (text.includes(milestone.toLowerCase())) {
      score += 0.1; // 里程碑权重10%
      signals.push(`重要里程碑: ${milestone}`);
      break;
    }
  }
  
  // 3. 特殊规则：重要公司 + 发布信号 = 必须推送
  const hasImportantCompany = entityMatches.some(entity => 
    ['google', 'openai', 'anthropic', 'nvidia', 'meta', 'microsoft', 'xai', 'deepseek', 'genspark'].includes(entity.toLowerCase())
  );
  
  const hasReleaseSignal = config.release_signals.launch_verbs.some(verb => 
    text.includes(verb.toLowerCase())
  );
  
  if (hasImportantCompany && hasReleaseSignal) {
    score = Math.max(score, 0.95); // 强制高分
    signals.push('🔥 重要公司产品发布 - 必须推送!');
  }
  
  // 4. 判定结果
  const shouldPush = score >= 0.3; // 降低阈值，更宽松
  const confidence = Math.min(score, 1.0);
  
  return {
    shouldPush,
    confidence,
    score,
    signals,
    entityMatches,
    reasoning: shouldPush 
      ? `检测到AI产品发布信号，匹配实体: ${entityMatches.join(', ')}`
      : '未检测到足够的AI产品发布信号'
  };
}

// 📋 更新Worker中的筛选逻辑
export const ENHANCED_SCREENING_PROMPT = `你是一个专业的AI新闻筛选专家。请判断以下内容是否应该推送。

标题: {title}
描述: {description}

🔥 核心原则：AI产品发布必须推送！

✅ 必须推送的内容：
🏢 重要公司发布：Google、OpenAI、Anthropic、xAI、NVIDIA、Meta、Microsoft、DeepSeek、Qwen、Groq、GenSpark、Manus等
🤖 AI产品更新：GPT系列、Claude、Gemini、Grok、LLaMA、通义千问、豆包、文心一言等
🛠️ AI工具平台：GitHub Copilot、Cursor、Replit、Perplexity、Notion AI等
🚀 AI Agent发布：LangChain、AutoGen、CrewAI、智能体框架等  
💾 AI硬件发布：H100、A100、TPU、AI芯片、推理加速器等
📊 重要研究：SOTA模型、基准测试、技术突破等

🎯 关键信号词组合：
- [公司名] + [发布/推出/上线/宣布]
- [AI产品] + [更新/版本/新功能]  
- [模型名] + [开源/发布/可用]
- [AI硬件] + [发布/上市/可用]

⚠️ 宽松原则：宁可多收录100篇，不要遗漏1个重要AI产品发布！

请返回JSON格式：
{
  "relevant": true/false,
  "confidence": 0.0-1.0,
  "category": "产品发布/功能更新/研究突破/公司动态/硬件发布/开源项目",
  "key_entities": ["检测到的关键实体"],
  "release_signals": ["检测到的发布信号"],
  "reasoning": "详细分析原因",
  "must_push": true/false // 是否为必推内容
}`;

export default { AI_PRODUCT_SCREENING, intelligentAIScreening, ENHANCED_SCREENING_PROMPT };