// 测试Claude API直接调用质量
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

async function testClaudeAPI() {
  const testTitle = "Personal Intelligence in AI Mode in Search: Help that's uniquely yours";
  const testDescription = "Google introduces new AI-powered search features with personalized intelligence to provide more relevant and customized search results for users.";
  
  const prompt = `判断以下内容是否与人工智能领域相关，并生成完整的双语内容。

强制相关标准：包含AI、机器学习、深度学习、ChatGPT、Claude、大语言模型等关键词，或来自重点公司：OpenAI、Google、Microsoft、Meta、Amazon、Apple、NVIDIA、Anthropic、Replicate、Hugging Face等。

【重要】专业翻译要求：
- title_zh必须是自然流畅的中文，不是英文！
- 严禁保留英文原标题
- 如果遇到专业术语，用中文主体+英文括号补充

【示例】
输入标题: "Personal Intelligence in AI Mode in Search"
输出title_zh: "搜索中的AI模式个人智能" 或 "Google搜索个人智能AI模式"

标题: ${testTitle}
描述: ${testDescription}

要求输出严格的JSON格式：
{
  "relevant": true/false,
  "original_language": "en",
  "title_zh": "专业中文标题（不是英文）",
  "title_en": "${testTitle}",
  "summary_zh": "约500字的专业中文摘要",
  "summary_zh_short": "约200字的中文短摘要",
  "summary_en": "约500词的英文摘要", 
  "summary_en_short": "约200词的英文短摘要",
  "keywords_zh": ["中文关键词1", "中文关键词2"],
  "keywords_en": ["english keyword1", "english keyword2"]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      console.error('❌ Claude API Error:', response.status, await response.text());
      return;
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    console.log('🎯 Claude API Response:');
    console.log(content);
    
    // 尝试解析JSON
    try {
      const parsed = JSON.parse(content);
      console.log('\n✅ 解析成功的高质量内容:');
      console.log('中文标题:', parsed.title_zh);
      console.log('中文关键词:', parsed.keywords_zh);
      console.log('中文摘要长度:', parsed.summary_zh?.length, '字符');
    } catch (e) {
      console.log('❌ JSON解析失败，原始内容:', content);
    }

  } catch (error) {
    console.error('❌ API调用失败:', error);
  }
}

testClaudeAPI();