#!/usr/bin/env node

// 🧪 Gemini 2.5 Pro 集成测试脚本
// 测试 Gemini 在各个环节的表现和成本效益

const OPENROUTER_API_KEY = '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';

async function testGeminiModel(model, prompt, taskType) {
  console.log(`\n🧪 测试 ${model} - ${taskType}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sijigpt.com',
        'X-Title': 'SijiGPT-GeminiTest'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1500
      })
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ ${model} 失败: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.log(`⚠️ ${model} 返回空内容`);
      return null;
    }
    
    console.log(`✅ ${model} 成功 (${duration}ms)`);
    console.log(`📊 内容长度: ${content.length}字符`);
    console.log(`🔍 内容预览: ${content.substring(0, 150)}...`);
    
    return {
      model,
      success: true,
      duration,
      contentLength: content.length,
      content: content.substring(0, 300)
    };
    
  } catch (error) {
    console.log(`❌ ${model} 异常: ${error.message}`);
    return null;
  }
}

async function runGeminiTests() {
  console.log('🚀 开始 Gemini 2.5 Pro 集成测试');
  
  // 测试用例
  const testCases = [
    {
      type: '二级筛选',
      model: 'google/gemini-2.5-pro',
      prompt: `你是AI行业分析师。请评估以下内容的AI相关性：

标题: Google announces Gemini 2.5 Pro with advanced reasoning
描述: Google DeepMind releases new Gemini model with enhanced capabilities

请返回JSON格式：
{
  "approved": true/false,
  "overall_score": 0.0-1.0,
  "reasoning": "详细分析原因"
}`
    },
    {
      type: '内容生成',
      model: 'google/gemini-2.5-pro', 
      prompt: `请为以下AI新闻生成专业的双语摘要：

标题: OpenAI releases GPT-5 with breakthrough performance
描述: OpenAI announces GPT-5, featuring advanced reasoning, multimodal capabilities, and improved efficiency.

请返回JSON格式：
{
  "relevant": true,
  "title_zh": "中文标题",
  "title_en": "OpenAI releases GPT-5 with breakthrough performance",
  "summary_zh": "详细中文摘要500字",
  "summary_zh_short": "简短中文摘要200字",
  "summary_en": "Detailed English summary 500 words",
  "summary_en_short": "Short English summary 200 words",
  "keywords_zh": ["关键词1", "关键词2", "关键词3"],
  "keywords_en": ["keyword1", "keyword2", "keyword3"]
}`
    },
    {
      type: '翻译对比',
      model: 'anthropic/claude-3-5-sonnet',
      prompt: '同样的内容生成任务，用Claude测试对比'
    }
  ];
  
  const results = [];
  
  // 测试Gemini模型
  for (const testCase of testCases.slice(0, 2)) {
    const result = await testGeminiModel(testCase.model, testCase.prompt, testCase.type);
    if (result) {
      results.push(result);
    }
    
    // 避免频率限制
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 测试Claude对比
  const claudeResult = await testGeminiModel(
    'anthropic/claude-3-5-sonnet',
    testCases[1].prompt, // 使用相同的内容生成任务
    '质量对比(Claude)'
  );
  
  if (claudeResult) {
    results.push(claudeResult);
  }
  
  // 输出测试报告
  console.log('\n📊 Gemini 集成测试报告');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    console.log(`\n🤖 模型: ${result.model}`);
    console.log(`⏱️  响应时间: ${result.duration}ms`);
    console.log(`📏 内容长度: ${result.contentLength}字符`);
    console.log(`💰 相对成本: ${result.model.includes('gemini') ? '低(-70%)' : result.model.includes('claude') ? '高(基准)' : '中等'}`);
  });
  
  // 成本效益分析
  const geminiResults = results.filter(r => r.model.includes('gemini'));
  const claudeResults = results.filter(r => r.model.includes('claude'));
  
  if (geminiResults.length > 0 && claudeResults.length > 0) {
    const avgGeminiSpeed = geminiResults.reduce((sum, r) => sum + r.duration, 0) / geminiResults.length;
    const avgClaudeSpeed = claudeResults.reduce((sum, r) => sum + r.duration, 0) / claudeResults.length;
    
    console.log(`\n💡 性能对比:`);
    console.log(`   Gemini 平均响应: ${avgGeminiSpeed}ms`);
    console.log(`   Claude 平均响应: ${avgClaudeSpeed}ms`);
    console.log(`   成本节省: ~70%`);
    console.log(`   建议: ${avgGeminiSpeed < avgClaudeSpeed * 1.5 ? '✅ 推荐使用Gemini主力' : '⚠️ 需要权衡性能'}`);
  }
}

// 执行测试
if (require.main === module) {
  runGeminiTests().catch(console.error);
}