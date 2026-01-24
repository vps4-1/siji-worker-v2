// 🎯 纯OpenRouter AI调用系统 - 无备用策略
// 专注：高质量内容生成、中文本地化、简洁高效

export class PureOpenRouterAI {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('OpenRouter API Key 是必需的');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  // 核心AI调用方法
  async callAI(prompt, model = 'google/gemini-2.5-pro', options = {}) {
    const {
      maxTokens = 2000,
      temperature = 0.7,
      systemPrompt = '',
      timeout = 30000
    } = options;

    const payload = {
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature
    };

    console.log(`[OpenRouter] 🎯 调用模型: ${model}`);

    try {
      const response = await Promise.race([
        fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://sijigpt.com',
            'X-Title': 'SijiGPT'
          },
          body: JSON.stringify(payload)
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('请求超时')), timeout)
        )
      ]);

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

  // AI相关性筛选 (一级筛选)
  async screenRelevance(title, description) {
    const prompt = `请判断以下内容是否与AI/人工智能/机器学习相关：

标题：${title}
描述：${description}

要求：
1. 返回JSON格式：{"relevant": true/false, "confidence": 0.0-1.0, "reason": "判断理由"}
2. 只有真正涉及AI技术、产品、研究的内容才判定为相关
3. confidence > 0.6 才认为高相关性`;

    try {
      const result = await this.callAI(prompt, 'x-ai/grok-beta', { maxTokens: 300 });
      return JSON.parse(result);
    } catch (error) {
      console.error('[一级筛选] 解析失败，默认通过:', error.message);
      return { relevant: true, confidence: 0.5, reason: '解析失败默认通过' };
    }
  }

  // 深度质量评估 (二级筛选) 
  async evaluateQuality(title, description, relevanceResult) {
    const prompt = `作为AI内容专家，请深度评估以下内容的质量和重要性：

标题：${title}
描述：${description}
初步相关性：${relevanceResult.confidence}

评估维度：
1. 技术创新性 (0-1)
2. 行业影响力 (0-1) 
3. 内容完整性 (0-1)
4. 时效价值 (0-1)

返回JSON格式：
{
  "approved": true/false,
  "overall_score": 0.0-1.0,
  "innovation": 0.0-1.0,
  "impact": 0.0-1.0,
  "completeness": 0.0-1.0,
  "timeliness": 0.0-1.0,
  "reason": "评估理由"
}

标准：overall_score > 0.6 才批准发布`;

    try {
      const result = await this.callAI(prompt, 'google/gemini-2.5-pro', { maxTokens: 500 });
      return JSON.parse(result);
    } catch (error) {
      console.error('[二级筛选] 解析失败，宽松通过:', error.message);
      return { 
        approved: true, 
        overall_score: 0.6, 
        reason: '解析失败宽松通过' 
      };
    }
  }

  // 高质量内容生成
  async generateContent(title, description, url, qualityScore = 0.7) {
    const systemPrompt = `你是专业的AI科技内容编辑，擅长：
1. 精准的中文本地化表达
2. 专业术语的准确翻译
3. 吸引人的标题创作
4. 结构化的内容摘要`;

    const prompt = `基于以下AI资讯创建高质量中文内容：

原标题：${title}
内容描述：${description}
来源链接：${url}
质量评分：${qualityScore}

请创建：
1. 中文标题：准确、吸引人、符合中文表达习惯
2. 中文摘要：150-200字，结构清晰，包含关键信息
3. 核心关键词：3-5个中文关键词，用逗号分隔
4. 内容分类：从以下选择 [OpenAI产品, 谷歌AI, Anthropic产品, 微软AI, AI研究, AI工具, AI应用, 机器学习, 深度学习, 其他AI]

返回JSON格式：
{
  "title_zh": "中文标题",
  "summary_zh": "详细中文摘要",
  "keywords_zh": "关键词1, 关键词2, 关键词3",
  "category": "内容分类",
  "original_language": "en"
}

要求：
- 标题自然流畅，避免生硬翻译
- 摘要信息丰富，突出创新点
- 关键词准确反映内容核心`;

    try {
      const result = await this.callAI(prompt, 'google/gemini-2.5-pro', { 
        systemPrompt,
        maxTokens: 1000,
        temperature: 0.8 
      });
      return JSON.parse(result);
    } catch (error) {
      console.error('[内容生成] 解析失败，使用基础翻译:', error.message);
      return this.createFallbackContent(title, description);
    }
  }

  // 标题优化和精修
  async refineTitle(chineseTitle, originalTitle, context) {
    const prompt = `作为资深编辑，请优化这个中文标题：

原英文标题：${originalTitle}
当前中文标题：${chineseTitle}
内容背景：${context}

优化目标：
1. 更自然的中文表达
2. 保持准确性和吸引力
3. 适合中文读者习惯
4. 突出关键信息

返回JSON格式：
{
  "refined_title": "优化后的标题",
  "improvement_reason": "优化理由"
}`;

    try {
      const result = await this.callAI(prompt, 'anthropic/claude-3-5-haiku:beta', { 
        maxTokens: 300 
      });
      const parsed = JSON.parse(result);
      return parsed.refined_title || chineseTitle;
    } catch (error) {
      console.error('[标题优化] 失败，保持原标题:', error.message);
      return chineseTitle;
    }
  }

  // 基础内容创建（出错时使用）
  createFallbackContent(title, description) {
    // 简单的关键词映射
    const keywordMap = {
      'OpenAI': 'OpenAI',
      'GPT': 'GPT',
      'ChatGPT': 'ChatGPT', 
      'Google': '谷歌',
      'Gemini': 'Gemini',
      'Anthropic': 'Anthropic',
      'Claude': 'Claude',
      'AI': '人工智能',
      'Machine Learning': '机器学习',
      'Deep Learning': '深度学习',
      'Neural Network': '神经网络',
      'LLM': '大语言模型',
      'AGI': '通用人工智能'
    };

    let chineseTitle = title;
    let category = 'AI研究';

    // 简单翻译和分类
    Object.entries(keywordMap).forEach(([en, zh]) => {
      chineseTitle = chineseTitle.replace(new RegExp(en, 'gi'), zh);
    });

    // 基础分类判断
    if (title.toLowerCase().includes('openai')) category = 'OpenAI产品';
    else if (title.toLowerCase().includes('google')) category = '谷歌AI';
    else if (title.toLowerCase().includes('anthropic')) category = 'Anthropic产品';
    else if (title.toLowerCase().includes('microsoft')) category = '微软AI';

    return {
      title_zh: `【${category}】${chineseTitle}`,
      summary_zh: `这是关于${category}的重要资讯：${description.substring(0, 100)}...`,
      keywords_zh: '人工智能, AI技术, 科技创新',
      category,
      original_language: 'en'
    };
  }
}

// 全局初始化函数
export function initializePureOpenRouter(env) {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY 环境变量未设置');
  }
  
  return new PureOpenRouterAI(env.OPENROUTER_API_KEY);
}