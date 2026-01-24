/**
 * 测试xAI Grok 4.1 Fast可用性
 */

const OPENROUTER_API_KEY = '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';

async function testGrok41Fast() {
  console.log('🚀 测试xAI Grok 4.1 Fast...');
  
  // 尝试不同的Grok模型名称
  const grokModels = [
    'x-ai/grok-2-1212',
    'x-ai/grok-4.1-fast',
    'x-ai/grok-41-fast',
    'xai/grok-4.1-fast',
    'xai/grok-41-fast'
  ];
  
  const testPrompt = `测试Grok模型，请返回JSON：
{
  "status": "success", 
  "model": "grok-4.1-fast",
  "message": "Grok模型工作正常"
}`;

  for (const model of grokModels) {
    try {
      console.log(`🤖 测试模型: ${model}`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
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
      
      console.log(`📡 ${model} 响应状态: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content) {
          console.log(`✅ ${model} 成功! 响应:`, content.substring(0, 100));
          return { success: true, model, content };
        } else {
          console.log(`⚠️ ${model} 空响应`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ ${model} 失败: ${errorText.substring(0, 100)}`);
      }
      
    } catch (error) {
      console.log(`❌ ${model} 异常: ${error.message}`);
    }
  }
  
  return { success: false };
}

async function testAIProductScreeningWithGrok() {
  console.log('\n🎯 测试Grok AI产品发布筛选能力...');
  
  const testCase = {
    title: "xAI Grok-4.1 Achieves Breakthrough in AI Reasoning Performance",
    description: "Elon Musk's xAI announces Grok-4.1 model demonstrating superior performance on mathematical reasoning and code generation benchmarks."
  };
  
  const screeningPrompt = `你是AI产品发布监控专家。请快速判断以下内容是否为AI产品发布或重要更新。

标题: ${testCase.title}
描述: ${testCase.description}

🔥 AI产品发布必须推送！重点监控公司：
🏢 Google/DeepMind、OpenAI、Anthropic/Claude、xAI/Grok、NVIDIA、Meta、Microsoft
🏢 DeepSeek、Qwen/阿里、Groq、GenSpark、Manus、百度、腾讯、字节

✅ 必须包含的发布类型：
- 🤖 AI模型发布：GPT系列、Claude、Gemini、Grok、DeepSeek、Qwen
- 🚀 AI产品功能：搜索AI、助手升级、新功能上线
- 🛠️ AI开发工具：LangChain、AutoGen、Agent框架
- 💾 AI硬件发布：NVIDIA GPU、AI芯片、推理加速器

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
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sijigpt.com',
        'X-Title': 'SijiGPT'
      },
      body: JSON.stringify({
        model: 'x-ai/grok-2-1212', // 先用已知可用的模型测试
        messages: [{ role: 'user', content: screeningPrompt }],
        temperature: 0.3,
        max_tokens: 500
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      console.log('🔍 Grok筛选响应:', content.substring(0, 200) + '...');
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          console.log('📊 筛选结果:', {
            relevant: result.relevant,
            confidence: result.confidence,
            category: result.category,
            must_push: result.must_push,
            entities: result.key_entities
          });
          
          return { success: true, result };
        }
      } catch (e) {
        console.log('❌ JSON解析失败:', e.message);
      }
    } else {
      console.log(`❌ 筛选测试失败: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ 异常: ${error.message}`);
  }
  
  return { success: false };
}

async function runGrokTests() {
  console.log('🧪 开始xAI Grok测试...');
  console.log('='.repeat(50));
  
  // 测试Grok可用性
  const grokResult = await testGrok41Fast();
  
  if (grokResult.success) {
    console.log(`\n🎉 Grok模型验证成功: ${grokResult.model}`);
    
    // 测试AI筛选能力
    const screeningResult = await testAIProductScreeningWithGrok();
    
    if (screeningResult.success) {
      console.log('\n✅ Grok AI筛选功能验证成功!');
      console.log('🚀 准备更新配置，启用Grok作为主力筛选模型!');
    }
  } else {
    console.log('\n❌ 未找到可用的Grok模型');
  }
  
  return grokResult;
}

// 运行测试
runGrokTests().catch(console.error);