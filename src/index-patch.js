// 在第 15-18 行，修改 OPENROUTER_CONFIG
const OPENROUTER_CONFIG = {
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  models: [
    'anthropic/claude-3.5-sonnet',
    'x-ai/grok-2-1212', 
    'qwen/qwen-2.5-72b-instruct'
  ]
};

// 新增：带重试的 OpenRouter 调用函数
async function callOpenRouterWithFallback(env, messages, maxTokens = 4000) {
  const models = OPENROUTER_CONFIG.models;
  
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      console.log(`[OpenRouter] 尝试模型 ${i+1}/${models.length}: ${model}`);
      
      const response = await fetch(OPENROUTER_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sijigpt.com',
          'X-Title': 'SiJiGPT'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: maxTokens,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[OpenRouter] ${model} 失败 (${response.status}): ${error}`);
        
        // 如果是地区限制，尝试下一个模型
        if (response.status === 403) {
          console.log(`[OpenRouter] ${model} 地区受限，切换到下一个模型...`);
          continue;
        }
        
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`[OpenRouter] ✓ ${model} 成功`);
      return data.choices[0].message.content;
      
    } catch (error) {
      console.error(`[OpenRouter] ${model} 错误:`, error.message);
      
      // 如果是最后一个模型，抛出错误
      if (i === models.length - 1) {
        throw new Error(`所有模型都失败了: ${error.message}`);
      }
    }
  }
}
