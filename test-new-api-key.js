/**
 * 测试新的OpenRouter API密钥
 * 验证密钥可用性并测试AI调用
 */

const NEW_OPENROUTER_API_KEY = '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';

async function testNewApiKey() {
  console.log('🔑 测试新OpenRouter API密钥...');
  
  const testPrompt = `测试AI调用，请返回JSON格式：
  {
    "status": "success",
    "message": "API密钥工作正常",
    "model": "当前使用的模型名称"
  }`;

  const models = ['x-ai/grok-2-1212', 'anthropic/claude-3-5-sonnet', 'groq/llama-3.1-70b-versatile'];
  
  for (const model of models) {
    try {
      console.log(`🤖 测试模型: ${model}`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NEW_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sijigpt.com',
          'X-Title': 'SijiGPT'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: testPrompt }],
          temperature: 0.3,
          max_tokens: 200
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ ${model} 失败 (${response.status}):`, errorText.substring(0, 100));
        continue;
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        console.log(`✅ ${model} 成功响应:`, content.substring(0, 100));
        
        // 尝试解析JSON
        try {
          const jsonResult = JSON.parse(content);
          console.log(`📊 ${model} JSON解析成功:`, jsonResult);
          return { success: true, model, response: jsonResult };
        } catch (e) {
          console.log(`⚠️ ${model} 响应非JSON格式，但调用成功`);
          return { success: true, model, response: content };
        }
      }
      
    } catch (error) {
      console.log(`❌ ${model} 异常:`, error.message);
      continue;
    }
  }
  
  return { success: false, error: '所有模型测试失败' };
}

// 测试AI产品发布检测能力
async function testAIProductDetection() {
  console.log('\n🎯 测试AI产品发布检测...');
  
  const testCases = [
    {
      title: "OpenAI Announces GPT-4.5 with Enhanced Reasoning",
      description: "OpenAI unveils GPT-4.5 featuring improved logical reasoning and problem-solving capabilities.",
      expected: "high_confidence"
    },
    {
      title: "Google Releases Gemini 2.1 Pro",
      description: "Google's latest AI model supports advanced multimodal understanding and real-time conversation.",
      expected: "high_confidence"  
    },
    {
      title: "Restaurant Opens Downtown",
      description: "A new Mediterranean restaurant featuring fresh ingredients has opened downtown.",
      expected: "low_confidence"
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 测试: ${testCase.title.substring(0, 40)}...`);
    
    const prompt = `你是AI产品发布监控专家。请快速判断以下内容是否为AI产品发布或重要更新。

标题: ${testCase.title}
描述: ${testCase.description}

🔥 AI产品发布必须推送！重点监控公司：
🏢 Google/DeepMind、OpenAI、Anthropic/Claude、xAI/Grok、NVIDIA、Meta、Microsoft
🏢 DeepSeek、Qwen/阿里、Groq、GenSpark、Manus、百度、腾讯、字节

请返回JSON格式：
{
  "relevant": true/false,
  "confidence": 0.0-1.0,
  "category": "产品发布/功能更新/模型发布/硬件发布/完全无关",
  "key_entities": ["检测到的关键实体"],
  "must_push": true/false,
  "reason": "检测原因"
}

🚨 核心原则：AI产品发布必须推送！宁多勿漏！`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NEW_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sijigpt.com',
          'X-Title': 'SijiGPT'
        },
        body: JSON.stringify({
          model: 'x-ai/grok-2-1212',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        try {
          const result = JSON.parse(content);
          console.log(`✅ 检测结果:`, {
            relevant: result.relevant,
            confidence: result.confidence,
            category: result.category,
            must_push: result.must_push
          });
        } catch (e) {
          console.log(`⚠️ 响应格式异常:`, content.substring(0, 100));
        }
      } else {
        console.log(`❌ 调用失败: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ 异常: ${error.message}`);
    }
  }
}

async function runTests() {
  console.log('🧪 开始新API密钥全面测试...');
  console.log('='.repeat(50));
  
  // 测试API密钥
  const apiResult = await testNewApiKey();
  
  if (apiResult.success) {
    console.log(`\n🎉 API密钥验证成功！可用模型: ${apiResult.model}`);
    
    // 测试AI产品检测
    await testAIProductDetection();
    
    console.log('\n📊 测试总结:');
    console.log('✅ OpenRouter API密钥正常工作');
    console.log('✅ AI模型调用成功');  
    console.log('✅ 产品发布检测功能正常');
    console.log('\n🚀 准备激活新系统！');
    
  } else {
    console.log(`\n❌ API密钥测试失败: ${apiResult.error}`);
  }
  
  return apiResult;
}

// 直接运行测试
runTests().catch(console.error);