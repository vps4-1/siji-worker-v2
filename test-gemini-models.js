#!/usr/bin/env node

// 🔍 检查可用的Gemini模型

const OPENROUTER_API_KEY = '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';

async function testModel(model) {
  console.log(`🧪 测试 ${model}...`);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sijigpt.com',
        'X-Title': 'SijiGPT-ModelTest'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Test message: Is this model available?' }],
        temperature: 0.3,
        max_tokens: 100
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${model} - 可用`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ ${model} - 不可用: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${model} - 错误: ${error.message}`);
    return false;
  }
}

async function checkGeminiModels() {
  console.log('🔍 检查可用的Gemini模型...\n');
  
  const geminiModels = [
    'google/gemini-2.0-flash-exp',
    'google/gemini-pro',
    'google/gemini-pro-1.5',
    'google/gemini-flash-1.5',
    'google/gemini-flash-1.5-8b',
    'google/gemini-2.5-pro',
    'google/gemini-2.0-flash-thinking-exp',
    'google/gemini-flash-2.0'
  ];
  
  const available = [];
  
  for (const model of geminiModels) {
    const isAvailable = await testModel(model);
    if (isAvailable) {
      available.push(model);
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // 避免频率限制
  }
  
  console.log(`\n📊 可用的Gemini模型 (${available.length}个):`);
  available.forEach(model => console.log(`  ✅ ${model}`));
  
  if (available.length > 0) {
    console.log(`\n💡 建议配置:`);
    console.log(`主力模型: ${available[0]}`);
    console.log(`备用模型: ${available[1] || 'anthropic/claude-3-5-haiku'}`);
  }
}

checkGeminiModels().catch(console.error);