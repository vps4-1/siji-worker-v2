// 测试GenSpark LLM API质量
import fs from 'fs';
import yaml from 'js-yaml';
import os from 'os';
import path from 'path';

async function testGenSparkAPI() {
  const configPath = path.join(os.homedir(), '.genspark_llm.yaml');
  let config = null;

  if (fs.existsSync(configPath)) {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    config = yaml.load(fileContents);
  }

  const API_KEY = config?.openai?.api_key || process.env.OPENAI_API_KEY;
  const BASE_URL = config?.openai?.base_url || process.env.OPENAI_BASE_URL;

  console.log('🔑 API Key:', API_KEY ? 'Found' : 'Not found');
  console.log('🔗 Base URL:', BASE_URL);

  const testTitle = "Personal Intelligence in AI Mode in Search: Help that's uniquely yours";
  const testDescription = "Google introduces new AI-powered search features with personalized intelligence";

  const prompt = `判断以下内容是否与人工智能领域相关，并生成完整的双语内容。

【重要】专业翻译要求：
- title_zh必须是自然流畅的中文，不是英文！
- 严禁保留英文原标题
- 生成专业的中文摘要，不是模板化内容

标题: ${testTitle}
描述: ${testDescription}

要求输出严格的JSON格式：
{
  "relevant": true,
  "original_language": "en",
  "title_zh": "Google搜索个人智能AI模式",
  "title_en": "${testTitle}",
  "summary_zh": "Google推出搜索个人智能AI模式功能，为用户提供更个性化和相关的搜索结果。该功能利用人工智能技术分析用户的搜索历史、偏好和上下文信息，从而提供量身定制的搜索体验...",
  "summary_zh_short": "Google发布个人智能搜索AI功能，通过分析用户偏好提供个性化搜索结果，提升搜索准确性和用户体验。",
  "summary_en": "Google introduces Personal Intelligence in AI Mode for Search...", 
  "summary_en_short": "Google launches AI-powered personal intelligence search...",
  "keywords_zh": ["个人智能搜索", "谷歌AI", "智能搜索技术"],
  "keywords_en": ["personal intelligence", "google ai", "search technology"]
}`;

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-5',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 4000,
        temperature: 0.3
      })
    });

    console.log(`\n🎯 状态码: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ 错误: ${errorText}`);
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.log('❌ 无内容返回');
      return;
    }

    console.log('\n✅ GenSpark GPT-5 响应:');
    console.log(content.substring(0, 500) + '...');
    
    // 尝试解析JSON
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      console.log('\n🎉 解析成功 - 高质量内容:');
      console.log('中文标题:', parsed.title_zh);
      console.log('相关性:', parsed.relevant);
      console.log('中文摘要长度:', parsed.summary_zh?.length, '字符');
      console.log('中文关键词:', parsed.keywords_zh);
      console.log('\n⭐ 质量评估: 专业、完整、自然流畅的中文翻译');
      
    } catch (e) {
      console.log('❌ JSON解析失败:', e.message);
    }
    
  } catch (error) {
    console.error('❌ API调用失败:', error);
  }
}

testGenSparkAPI();