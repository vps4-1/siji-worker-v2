// 🤖 备用AI策略：当OpenRouter不可用时的智能内容处理方案
// 解决方案：规则驱动 + 模式识别 + 内容智能化

/**
 * 备用AI策略配置
 */
const FALLBACK_AI_CONFIG = {
  // AI公司关键词权重（优先级1-10）
  companies: {
    'OpenAI': 10, 'ChatGPT': 10, 'GPT-4': 10, 'GPT-5': 10,
    'Google': 9, 'DeepMind': 9, 'Gemini': 9, 'Bard': 9,
    'Anthropic': 9, 'Claude': 9,
    'xAI': 8, 'Grok': 8,
    'Meta': 8, 'LLaMA': 8, 'Llama': 8,
    'Microsoft': 7, 'Copilot': 7,
    'NVIDIA': 8, 'Tesla': 6,
    'DeepSeek': 7, '阿里': 6, 'Qwen': 6, '千问': 6,
    'Groq': 7, 'GenSpark': 8, 'Manus': 7,
    '百度': 5, '腾讯': 5, '字节': 5, 'ByteDance': 5
  },
  
  // 技术关键词权重
  tech: {
    'AGI': 10, '通用人工智能': 10,
    '大语言模型': 9, 'LLM': 9, 'Large Language Model': 9,
    '多模态': 8, 'multimodal': 8,
    '机器学习': 7, 'machine learning': 7, 'ML': 7,
    '深度学习': 7, 'deep learning': 7,
    '神经网络': 6, 'neural network': 6,
    'transformer': 8, 'attention': 7,
    '强化学习': 6, 'reinforcement learning': 6
  },
  
  // 发布类型权重
  release: {
    '发布': 8, 'release': 8, 'launch': 8, 'announced': 8,
    '更新': 7, 'update': 7, 'upgrade': 7,
    '新版本': 9, 'new version': 9, 'version': 6,
    '开源': 8, 'open source': 8, 'opensource': 8,
    'API': 7, '接口': 7, '工具': 6, 'tool': 6
  }
};

/**
 * 计算内容相关性评分
 */
function calculateRelevanceScore(title, description) {
  let score = 0;
  const content = (title + ' ' + description).toLowerCase();
  
  // 公司权重
  for (const [keyword, weight] of Object.entries(FALLBACK_AI_CONFIG.companies)) {
    if (content.includes(keyword.toLowerCase())) {
      score += weight;
    }
  }
  
  // 技术权重  
  for (const [keyword, weight] of Object.entries(FALLBACK_AI_CONFIG.tech)) {
    if (content.includes(keyword.toLowerCase())) {
      score += weight;
    }
  }
  
  // 发布类型权重
  for (const [keyword, weight] of Object.entries(FALLBACK_AI_CONFIG.release)) {
    if (content.includes(keyword.toLowerCase())) {
      score += weight;
    }
  }
  
  // 归一化到0-1
  return Math.min(score / 50, 1.0);
}

/**
 * 智能分类
 */
function classifyContent(title, description) {
  const content = (title + ' ' + description).toLowerCase();
  
  if (content.includes('openai') || content.includes('chatgpt') || content.includes('gpt-4') || content.includes('gpt-5')) {
    return 'OpenAI产品';
  } else if (content.includes('google') || content.includes('deepmind') || content.includes('gemini') || content.includes('bard')) {
    return 'Google AI';
  } else if (content.includes('anthropic') || content.includes('claude')) {
    return 'Anthropic产品';
  } else if (content.includes('meta') || content.includes('llama')) {
    return 'Meta AI';
  } else if (content.includes('microsoft') || content.includes('copilot')) {
    return 'Microsoft AI';
  } else if (content.includes('nvidia')) {
    return 'NVIDIA技术';
  } else if (content.includes('开源') || content.includes('open source')) {
    return '开源项目';
  } else {
    return '其他AI';
  }
}

/**
 * 生成专业的中文标题
 */
function generateChineseTitle(englishTitle) {
  // 常见翻译映射
  const translations = {
    'release': '发布',
    'announces': '宣布',
    'launches': '推出',
    'updates': '更新',
    'introduces': '引入',
    'unveils': '揭晓',
    'reveals': '发布',
    'new': '全新',
    'latest': '最新',
    'version': '版本',
    'model': '模型',
    'tool': '工具',
    'platform': '平台',
    'service': '服务',
    'API': 'API',
    'feature': '功能',
    'upgrade': '升级'
  };
  
  let chineseTitle = englishTitle;
  
  // 应用翻译
  for (const [en, zh] of Object.entries(translations)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    chineseTitle = chineseTitle.replace(regex, zh);
  }
  
  // 如果还是英文为主，添加中文前缀
  if (chineseTitle === englishTitle) {
    const category = classifyContent(englishTitle, '');
    chineseTitle = `【${category}】${englishTitle}`;
  }
  
  return chineseTitle;
}

/**
 * 生成智能摘要
 */
function generateIntelligentSummary(title, description, language = 'zh') {
  const category = classifyContent(title, description);
  const score = calculateRelevanceScore(title, description);
  
  if (language === 'zh') {
    return {
      content: `这是一篇关于${category}的重要资讯。${description ? description.substring(0, 200) + '...' : ''}`,
      keywords: extractKeywords(title + ' ' + description, 'zh'),
      significance: score > 0.7 ? '高度相关' : score > 0.4 ? '中等相关' : '一般相关'
    };
  } else {
    return {
      content: `This is important news about ${category}. ${description ? description.substring(0, 200) + '...' : ''}`,
      keywords: extractKeywords(title + ' ' + description, 'en'),
      significance: score > 0.7 ? 'Highly Relevant' : score > 0.4 ? 'Moderately Relevant' : 'Generally Relevant'
    };
  }
}

/**
 * 提取关键词
 */
function extractKeywords(content, language) {
  const keywords = [];
  
  if (language === 'zh') {
    const zhKeywords = ['人工智能', '机器学习', '深度学习', '大语言模型', '多模态', 'AI', 'AGI', '神经网络'];
    zhKeywords.forEach(keyword => {
      if (content.includes(keyword)) keywords.push(keyword);
    });
  } else {
    const enKeywords = ['AI', 'machine learning', 'deep learning', 'LLM', 'multimodal', 'AGI', 'neural network'];
    enKeywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword.toLowerCase())) keywords.push(keyword);
    });
  }
  
  return keywords.slice(0, 5); // 最多5个关键词
}

/**
 * 备用AI处理主函数
 */
function processFallbackAI(title, description, purpose = 'screening') {
  if (purpose === 'screening' || purpose === 'primary_screening') {
    // 筛选阶段
    const score = calculateRelevanceScore(title, description);
    const category = classifyContent(title, description);
    
    return {
      isRelevant: score > 0.3,
      confidence: score,
      category: category,
      reason: `规则驱动筛选：相关性评分 ${score.toFixed(2)}`
    };
  } 
  else if (purpose === 'secondary_screening') {
    // 深度筛选
    const score = calculateRelevanceScore(title, description);
    return {
      approved: score > 0.5,
      confidence: score,
      reason: `深度筛选：综合评分 ${score.toFixed(2)}`
    };
  }
  else if (purpose === 'content_generation') {
    // 内容生成
    const chineseTitle = generateChineseTitle(title);
    const zhSummary = generateIntelligentSummary(title, description, 'zh');
    const enSummary = generateIntelligentSummary(title, description, 'en');
    
    return {
      title_zh: chineseTitle,
      title_en: title,
      summary_zh: zhSummary.content,
      summary_zh_short: zhSummary.content.substring(0, 100),
      summary_en: enSummary.content,
      summary_en_short: enSummary.content.substring(0, 100),
      keywords_zh: zhSummary.keywords,
      keywords_en: enSummary.keywords
    };
  }
  
  return null;
}

module.exports = {
  processFallbackAI,
  calculateRelevanceScore,
  classifyContent,
  generateChineseTitle,
  generateIntelligentSummary
};

// 测试示例
if (require.main === module) {
  console.log('🧪 测试备用AI策略...');
  
  const testCases = [
    {
      title: 'OpenAI Releases GPT-5 with Multimodal Capabilities',
      description: 'OpenAI announced the release of GPT-5, featuring advanced multimodal AI capabilities.'
    },
    {
      title: 'Google DeepMind Unveils Gemini Pro 2.0',
      description: 'Google DeepMind introduces the latest version of Gemini with enhanced reasoning.'
    }
  ];
  
  testCases.forEach((test, i) => {
    console.log(`\n--- 测试案例 ${i+1} ---`);
    console.log('标题:', test.title);
    
    const screening = processFallbackAI(test.title, test.description, 'screening');
    console.log('筛选结果:', screening);
    
    if (screening.isRelevant) {
      const content = processFallbackAI(test.title, test.description, 'content_generation');
      console.log('生成内容:', content);
    }
  });
}