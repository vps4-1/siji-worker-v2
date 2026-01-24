/**
 * 简化的AI调用函数测试
 * 修复运行时作用域问题
 */

// 确保函数在全局作用域中定义
globalThis.callOpenRouterAI = async function callOpenRouterAI(env, title, description, purpose = 'screening', specificModel = null, customPrompt = null) {
  console.log(`[OpenRouter] 🎯 AI任务: ${purpose}`);
  console.log(`[OpenRouter] API Key存在: ${!!env.OPENROUTER_API_KEY}`);
  
  if (!env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY未配置');
  }
  
  // 使用自定义提示词或创建标准提示词
  const prompt = customPrompt || createPromptForPurpose(purpose, title, description);
  
  // 简化的模型选择逻辑
  let modelList = specificModel ? [specificModel] : ['google/gemini-2.5-pro'];
  
  console.log(`[OpenRouter] 使用模型: ${modelList[0]}`);
  
  for (const model of modelList) {
    try {
      console.log(`[OpenRouter] 🔄 尝试模型: ${model}`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://siji-worker-v2.chengqiangshang.workers.dev',
          'X-Title': 'SijiGPT Worker'
        },
        body: JSON.stringify({
          model: model,
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 2000,
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[OpenRouter] ${model} HTTP错误 ${response.status}: ${errorText}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content.trim();
        console.log(`[OpenRouter] ✅ ${model} 响应长度: ${content.length}`);
        
        // 尝试解析JSON
        try {
          const result = JSON.parse(content);
          console.log(`[OpenRouter] ✅ JSON解析成功`);
          return result;
        } catch (parseError) {
          console.error(`[OpenRouter] JSON解析错误: ${parseError.message}`);
          return { error: 'JSON解析失败', content };
        }
      }
    } catch (error) {
      console.error(`[OpenRouter] ${model} 请求错误:`, error.message);
      continue;
    }
  }
  
  throw new Error('所有模型都失败了');
};

// 导出函数确保可用性
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { callOpenRouterAI: globalThis.callOpenRouterAI };
}