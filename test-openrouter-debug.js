// 创建一个调试OpenRouter调用的脚本
const testTitle = "Personal Intelligence in AI Mode in Search: Help that's uniquely yours";
const testDescription = "Google introduces new AI-powered search features with personalized intelligence";

async function testOpenRouterAPI() {
  console.log('🧪 测试OpenRouter API调用...');
  
  const prompt = `判断以下内容是否与人工智能领域相关，并生成完整的双语内容。

【重要】专业翻译要求：
- title_zh必须是自然流畅的中文，不是英文！
- 严禁保留英文原标题

标题: ${testTitle}
描述: ${testDescription}

要求输出严格的JSON格式：
{
  "relevant": true,
  "original_language": "en",
  "title_zh": "搜索中的AI模式个人智能",
  "title_en": "${testTitle}",
  "summary_zh": "Google推出AI搜索个人智能功能...",
  "summary_zh_short": "Google AI搜索新功能...",
  "summary_en": "Google introduces...", 
  "summary_en_short": "AI search features...",
  "keywords_zh": ["搜索技术", "个人智能"],
  "keywords_en": ["search technology", "personal intelligence"]
}`;

  try {
    // 测试最高质量模型
    const models = [
      'anthropic/claude-3-5-sonnet',
      'anthropic/claude-3-5-haiku', 
      'openai/gpt-4o',
      'x-ai/grok-2-1212'
    ];

    for (const model of models) {
      console.log(`\n🎯 测试模型: ${model}`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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'
        },
        body: JSON.stringify({
          model: model,
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 4000,
          temperature: 0.3
        })
      });

      console.log(`状态码: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ 错误: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        console.log('❌ 无内容返回');
        continue;
      }

      console.log('✅ 原始响应:');
      console.log(content.substring(0, 200) + '...');
      
      // 尝试解析JSON
      try {
        const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        
        console.log('\n🎉 成功解析:');
        console.log('中文标题:', parsed.title_zh);
        console.log('相关性:', parsed.relevant);
        console.log('中文关键词:', parsed.keywords_zh);
        
        return; // 找到工作的模型就停止
        
      } catch (e) {
        console.log('❌ JSON解析失败:', e.message);
      }
    }
    
  } catch (error) {
    console.error('❌ API调用失败:', error);
  }
}

testOpenRouterAPI();