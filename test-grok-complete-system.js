/**
 * 完整测试：Grok 4.1 Fast + 分层筛选系统
 */

const OPENROUTER_API_KEY = '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';

async function testGrokScreeningSystem() {
  console.log('🚀 完整测试：Grok 4.1 Fast分层筛选系统');
  console.log('='.repeat(60));
  
  const testCases = [
    {
      title: "xAI Grok 4.1 Fast Achieves Breakthrough Performance on AI Benchmarks",
      description: "Elon Musk's xAI announces Grok 4.1 Fast model demonstrating superior performance on reasoning, coding, and mathematical benchmarks.",
      expected: "high_confidence_pass",
      category: "重大AI模型发布"
    },
    {
      title: "Google DeepMind Releases Gemini 2.1 with Enhanced Multimodal AI",
      description: "Google unveils Gemini 2.1 featuring advanced image understanding, video analysis capabilities.",
      expected: "high_confidence_pass", 
      category: "重大AI产品发布"
    },
    {
      title: "GenSpark Introduces Smart AI-Powered Search Platform",
      description: "GenSpark launches new AI search functionality with personalized results and context understanding.",
      expected: "medium_confidence",
      category: "AI产品功能发布"
    },
    {
      title: "Restaurant Menu Management Software Update",
      description: "Local software company releases update for restaurant menu management with new inventory features.",
      expected: "low_confidence_reject",
      category: "完全无关"
    }
  ];
  
  // 一级筛选提示词
  const primaryPrompt = (title, description) => `你是AI产品发布监控专家。请快速判断以下内容是否为AI产品发布或重要更新。

标题: ${title}
描述: ${description}

🔥 AI产品发布必须推送！重点监控公司：
🏢 Google/DeepMind、OpenAI、Anthropic/Claude、xAI/Grok、NVIDIA、Meta、Microsoft
🏢 DeepSeek、Qwen/阿里、Groq、GenSpark、Manus、百度、腾讯、字节

⭐ 超高优先级（见到就推）：
- OpenAI全家桶产品 🏆
- Google/DeepMind AI技术 🏆  
- NVIDIA AI硬件生态 🏆
- Anthropic Claude系列 🏆
- xAI Grok突破 🏆
- GenSpark AI产品 🏆

请返回JSON格式：
{
  "relevant": true/false,
  "confidence": 0.0-1.0,
  "category": "产品发布/功能更新/模型发布/硬件发布/完全无关",
  "key_entities": ["检测到的关键实体"],
  "release_signals": ["发现的发布信号"],
  "must_push": true/false,
  "reason": "检测原因"
}

🎯 原则：宁可多收录，不要遗漏重要AI产品发布！`;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    console.log(`\n📋 测试案例 ${i + 1}/${testCases.length}: ${testCase.category}`);
    console.log(`标题: ${testCase.title}`);
    console.log(`预期: ${testCase.expected}`);
    
    try {
      // 使用Grok 4.1 Fast进行一级筛选
      console.log('🔍 Grok 4.1 Fast 一级筛选...');
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sijigpt.com',
          'X-Title': 'SijiGPT'
        },
        body: JSON.stringify({
          model: 'x-ai/grok-4.1-fast',
          messages: [{ role: 'user', content: primaryPrompt(testCase.title, testCase.description) }],
          temperature: 0.3,
          max_tokens: 800
        })
      });
      
      if (!response.ok) {
        console.log(`❌ Grok调用失败: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        console.log('❌ Grok返回空响应');
        continue;
      }
      
      // 解析JSON
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.log('⚠️ 未找到JSON格式响应');
          console.log(`原始响应: ${content.substring(0, 150)}...`);
          continue;
        }
        
        const result = JSON.parse(jsonMatch[0]);
        
        console.log('📊 Grok 4.1 Fast筛选结果:');
        console.log(`   ✅ 相关性: ${result.relevant}`);
        console.log(`   📈 置信度: ${result.confidence}`);
        console.log(`   📂 分类: ${result.category}`);
        console.log(`   🏢 关键实体: ${result.key_entities?.join(', ') || 'N/A'}`);
        console.log(`   🚀 发布信号: ${result.release_signals?.join(', ') || 'N/A'}`);
        console.log(`   🔥 必推: ${result.must_push}`);
        console.log(`   💡 原因: ${result.reason}`);
        
        // 判断决策路径
        let actualResult;
        if (!result.relevant) {
          actualResult = 'rejected';
          console.log('📋 决策: 🚫 一级拒绝');
        } else if (result.confidence >= 0.8) {
          actualResult = 'primary_approved';
          console.log('📋 决策: ✅ 一级高分通过');
        } else if (result.confidence >= 0.3) {
          actualResult = 'secondary_needed';
          console.log('📋 决策: 🔬 需要二级深度分析');
        } else {
          actualResult = 'low_confidence';
          console.log('📋 决策: ⚠️ 低置信度拒绝');
        }
        
        // 检验预期
        const isCorrect = (
          (testCase.expected === 'high_confidence_pass' && actualResult === 'primary_approved') ||
          (testCase.expected === 'medium_confidence' && actualResult === 'secondary_needed') ||
          (testCase.expected === 'low_confidence_reject' && actualResult === 'rejected')
        );
        
        console.log(`${isCorrect ? '🎉' : '⚠️'} 结果${isCorrect ? '符合' : '不符合'}预期`);
        
      } catch (e) {
        console.log(`❌ JSON解析失败: ${e.message}`);
        console.log(`原始响应: ${content.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`❌ 测试异常: ${error.message}`);
    }
    
    console.log('-'.repeat(40));
  }
  
  // 测试内容生成
  console.log('\n📝 测试Grok 4.1 Fast内容生成能力...');
  
  const contentPrompt = `判断以下内容是否与人工智能领域相关，并生成完整的双语摘要。

标题: xAI Grok 4.1 Fast Breaks New Ground in AI Performance  
描述: Elon Musk's xAI team announces Grok 4.1 Fast, achieving state-of-the-art results on multiple AI benchmarks including reasoning, mathematics, and code generation.

要求：
1. 检测原文语言（英文）
2. 生成中文标题、中文长摘要（约500字）、中文短摘要（约200字）、英文长摘要、英文短摘要
3. 提取 3-5 个中文关键词和 3-5 个英文关键词

返回JSON格式：
{
  "relevant": true,
  "original_language": "en",
  "title_zh": "中文标题",
  "title_en": "English Title",
  "summary_zh": "详细中文摘要（约500字）",
  "summary_zh_short": "简短中文摘要（约200字）",
  "summary_en": "Detailed English summary (around 500 words)",
  "summary_en_short": "Short English summary (around 200 words)",
  "keywords_zh": ["关键词1", "关键词2", "关键词3"],
  "keywords_en": ["keyword1", "keyword2", "keyword3"]
}`;

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
        model: 'x-ai/grok-4.1-fast',
        messages: [{ role: 'user', content: contentPrompt }],
        temperature: 0.3,
        max_tokens: 2000
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          
          console.log('✅ Grok 4.1 Fast内容生成成功!');
          console.log(`📰 中文标题: ${result.title_zh}`);
          console.log(`📝 中文摘要长度: ${result.summary_zh?.length || 0} 字`);
          console.log(`📝 英文摘要长度: ${result.summary_en?.length || 0} 字`);
          console.log(`🏷️ 中文关键词: ${result.keywords_zh?.join(', ') || 'N/A'}`);
          console.log(`🏷️ 英文关键词: ${result.keywords_en?.join(', ') || 'N/A'}`);
          
          const isHighQuality = (
            result.title_zh && result.title_zh.length > 10 &&
            result.summary_zh && result.summary_zh.length > 200 &&
            result.summary_en && result.summary_en.length > 200
          );
          
          console.log(`${isHighQuality ? '💎' : '⚠️'} 内容质量: ${isHighQuality ? '优秀' : '需要改进'}`);
        }
      } catch (e) {
        console.log(`❌ 内容生成JSON解析失败: ${e.message}`);
      }
    } else {
      console.log(`❌ 内容生成失败: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ 内容生成异常: ${error.message}`);
  }
  
  console.log('\n='.repeat(60));
  console.log('🎉 Grok 4.1 Fast系统测试完成!');
  console.log('🚀 准备激活生产环境，启用Grok 4.1 Fast作为主力!');
}

// 运行测试
testGrokScreeningSystem().catch(console.error);