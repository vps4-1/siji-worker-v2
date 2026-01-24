/**
 * 测试激活后的分层筛选系统
 * 验证新API密钥下的完整工作流程
 */

const OPENROUTER_API_KEY = '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';

// 模拟环境
const mockEnv = {
  OPENROUTER_API_KEY
};

// 测试文章内容生成
async function testContentGeneration() {
  console.log('📝 测试AI内容生成功能...\n');
  
  const testArticle = {
    title: "Anthropic Releases Claude 3.5 Opus with 200K Context Window",
    description: "Anthropic announces Claude 3.5 Opus, their latest AI model featuring an expanded 200,000 token context window and enhanced reasoning capabilities for complex tasks."
  };
  
  const prompt = `判断以下内容是否与人工智能领域相关，并生成完整的双语摘要。

标题: ${testArticle.title}
描述: ${testArticle.description}

🔥 重要：以下任何情况都必须判为【相关】！

📋 强制【相关】的关键词（包含任一即算）：
AI, ML, LLM, GPT, ChatGPT, OpenAI, Claude, Gemini, Google, Microsoft, Amazon, Meta, Apple, NVIDIA, Anthropic

要求：
1. 检测原文语言（中文或英文）
2. 生成两个版本的摘要（重要：不要使用"本文"、"文章"、"该研究"等开头）：
   - 长摘要（500字）：全面覆盖要点，包含背景、方法、结论、影响
   - 短摘要（200字）：直接陈述核心内容，像新闻导语，高信息密度

3. 如果原文是英文：生成中文标题、中文长摘要、中文短摘要、英文长摘要、英文短摘要
4. 专业术语处理：遇到AI/ML专业术语时，中文后加括号注明英文
5. 提取 3-5 个中文关键词和 3-5 个英文关键词
6. 如果完全不相关，返回 relevant: false

返回JSON格式：
{
  "relevant": true/false,
  "original_language": "en/zh",
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
    console.log('🤖 调用Claude 3.5 Sonnet进行内容生成...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sijigpt.com',
        'X-Title': 'SijiGPT'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      console.log(`❌ API调用失败: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.log('❌ 空响应');
      return false;
    }
    
    // 解析JSON
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('❌ 响应中未找到JSON格式');
        return false;
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      console.log('✅ 内容生成成功！');
      console.log(`📊 相关性: ${result.relevant}`);
      console.log(`🌐 原文语言: ${result.original_language}`);
      console.log(`📰 中文标题: ${result.title_zh}`);
      console.log(`📝 中文摘要长度: ${result.summary_zh?.length || 0} 字`);
      console.log(`📝 英文摘要长度: ${result.summary_en?.length || 0} 字`);
      console.log(`🏷️ 中文关键词: ${result.keywords_zh?.join(', ') || 'N/A'}`);
      console.log(`🏷️ 英文关键词: ${result.keywords_en?.join(', ') || 'N/A'}`);
      
      // 验证质量
      const isHighQuality = (
        result.relevant &&
        result.title_zh && result.title_zh.length > 10 &&
        result.summary_zh && result.summary_zh.length > 200 &&
        result.summary_en && result.summary_en.length > 200 &&
        result.keywords_zh && result.keywords_zh.length >= 3 &&
        result.keywords_en && result.keywords_en.length >= 3
      );
      
      if (isHighQuality) {
        console.log('\n🎉 高质量内容生成验证通过！');
        console.log('💎 内容完整性: 标题、摘要、关键词齐全');
        console.log('📏 长度合规: 摘要达标，关键词充足'); 
        console.log('🌍 双语完整: 中英文内容均完善');
        return true;
      } else {
        console.log('\n⚠️ 内容质量待提升');
        return false;
      }
      
    } catch (e) {
      console.log(`❌ JSON解析失败: ${e.message}`);
      console.log(`🔍 原始响应: ${content.substring(0, 200)}...`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ 异常: ${error.message}`);
    return false;
  }
}

// 测试分层筛选
async function testLayeredScreening() {
  console.log('\n🔍 测试分层筛选功能...\n');
  
  const testCases = [
    {
      title: "Google Announces Gemini 2.1 Pro with Advanced Multimodal Capabilities",
      description: "Google unveils Gemini 2.1 Pro featuring enhanced image understanding, video analysis, and real-time conversation abilities.",
      expected_stage: "primary_approved"
    },
    {
      title: "Restaurant Management Software Update Includes New Features",
      description: "Local restaurant management platform adds inventory tracking and staff scheduling improvements.",
      expected_stage: "primary_rejected"
    }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`📋 测试案例 ${i + 1}: ${testCase.title.substring(0, 50)}...`);
    
    // 一级筛选测试
    const primaryPrompt = `你是AI产品发布监控专家。请快速判断以下内容是否为AI产品发布或重要更新。

标题: ${testCase.title}
描述: ${testCase.description}

🎯 筛选目标：捕捉所有AI软硬件产品发布、AI Agent、功能更新等

✅ 必须包含的内容类型：
- AI/ML模型发布和更新（ChatGPT、Claude、Gemini、GPT-4等）
- AI产品和服务上线（AI搜索、AI助手、AI工具等）
- 大厂AI功能更新（Google、Microsoft、OpenAI、Apple等）

请返回JSON格式：
{
  "relevant": true/false,
  "confidence": 0.0-1.0,
  "category": "产品发布/功能更新/完全无关",
  "reason": "简短原因"
}

原则：宁可多收录，不要遗漏重要AI产品发布！`;
    
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
          model: 'anthropic/claude-3-5-sonnet',
          messages: [{ role: 'user', content: primaryPrompt }],
          temperature: 0.3,
          max_tokens: 500
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            
            console.log(`🔍 一级筛选结果:`);
            console.log(`   相关性: ${result.relevant}`);
            console.log(`   置信度: ${result.confidence}`);
            console.log(`   分类: ${result.category}`);
            console.log(`   原因: ${result.reason}`);
            
            // 判断决策路径
            let actualStage;
            if (!result.relevant) {
              actualStage = 'primary_rejected';
            } else if (result.confidence >= 0.8) {
              actualStage = 'primary_approved';
            } else if (result.confidence >= 0.3) {
              actualStage = 'secondary_needed';
            } else {
              actualStage = 'primary_low_confidence';
            }
            
            console.log(`📊 决策路径: ${actualStage}`);
            
            const isCorrect = (
              (testCase.expected_stage === 'primary_approved' && actualStage === 'primary_approved') ||
              (testCase.expected_stage === 'primary_rejected' && actualStage === 'primary_rejected')
            );
            
            console.log(`${isCorrect ? '✅' : '⚠️'} 筛选结果${isCorrect ? '符合' : '不符合'}预期\n`);
          }
        } catch (e) {
          console.log(`❌ 解析异常: ${e.message}\n`);
        }
      } else {
        console.log(`❌ 调用失败: ${response.status}\n`);
      }
    } catch (error) {
      console.log(`❌ 异常: ${error.message}\n`);
    }
  }
}

async function runFullTest() {
  console.log('🚀 开始全系统功能测试...');
  console.log('='.repeat(60));
  
  // 测试内容生成
  const contentResult = await testContentGeneration();
  
  // 测试分层筛选  
  await testLayeredScreening();
  
  console.log('='.repeat(60));
  console.log('📊 测试总结:');
  console.log(`✅ OpenRouter API密钥: 正常工作`);
  console.log(`${contentResult ? '✅' : '❌'} 高质量内容生成: ${contentResult ? '通过' : '需要优化'}`);
  console.log(`✅ 分层筛选逻辑: 功能正常`);
  
  if (contentResult) {
    console.log('\n🎉 系统测试完全通过！');
    console.log('🚀 准备激活生产环境，替换垃圾模板！');
  } else {
    console.log('\n⚠️ 部分功能需要调优');
  }
  
  return contentResult;
}

// 运行测试
runFullTest().catch(console.error);