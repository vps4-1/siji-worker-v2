/**
 * 测试新分层AI筛选系统
 * 验证AI产品发布检测能力
 */

// 测试用例：覆盖各种AI产品发布场景
const testCases = [
  // 🔥 必须通过的重大AI产品发布
  {
    title: "OpenAI Announces GPT-4.5 with Enhanced Reasoning Capabilities",
    description: "OpenAI today unveiled GPT-4.5, featuring improved logical reasoning, mathematical problem-solving, and multi-step planning capabilities.",
    expected: "primary_approved", // 应该一级高分直接通过
    category: "重大AI模型发布"
  },
  
  {
    title: "Google DeepMind Releases Gemini 2.1 Pro with Advanced Multimodal AI",
    description: "Google's latest AI model Gemini 2.1 Pro now supports advanced image understanding, video analysis, and real-time conversation.",
    expected: "primary_approved",
    category: "重大AI产品发布"
  },
  
  {
    title: "NVIDIA Launches H200 AI Accelerator for Large Language Models",
    description: "NVIDIA introduces the H200 Tensor Core GPU designed specifically for training and inference of large language models with 141GB HBM3e memory.",
    expected: "primary_approved", 
    category: "AI硬件发布"
  },
  
  {
    title: "Anthropic Claude 3.5 Opus Now Available with 200K Context Window",
    description: "Anthropic releases Claude 3.5 Opus featuring an expanded 200,000 token context window and improved reasoning for complex tasks.",
    expected: "primary_approved",
    category: "重大AI模型发布"
  },
  
  {
    title: "xAI Grok-2 Achieves State-of-the-Art Performance on Mathematical Reasoning",
    description: "Elon Musk's xAI announces Grok-2 model demonstrating superior performance on mathematical and scientific reasoning benchmarks.",
    expected: "primary_approved",
    category: "重大AI研究突破"
  },
  
  // 🎯 中等置信度，需要二级筛选
  {
    title: "DeepSeek Open Sources V3 Model Architecture and Training Code",
    description: "Chinese AI company DeepSeek releases the complete architecture and training methodology for their V3 language model family.",
    expected: "secondary_screening",
    category: "AI开源项目"
  },
  
  {
    title: "GenSpark Introduces AI-Powered Smart Search with Personalization",
    description: "GenSpark launches new search functionality that uses AI to provide personalized results based on user context and preferences.",
    expected: "secondary_screening",
    category: "AI产品功能更新"
  },
  
  {
    title: "Manus AI Unveils Real-Time Language Translation for Enterprise",
    description: "Manus AI presents their enterprise solution for real-time translation across 50+ languages with industry-specific terminology.",
    expected: "secondary_screening", 
    category: "AI企业产品"
  },
  
  // 🤖 AI Agent和自动化
  {
    title: "Microsoft Releases AutoGen 2.0 with Enhanced Multi-Agent Orchestration",
    description: "Microsoft announces AutoGen 2.0 featuring improved multi-agent coordination, better tool integration, and streamlined workflows.",
    expected: "primary_approved",
    category: "AI Agent框架"
  },
  
  {
    title: "LangChain Introduces Agent Swarm for Complex Task Automation",
    description: "LangChain unveils Agent Swarm, allowing multiple AI agents to collaborate on complex, multi-step automation tasks.",
    expected: "primary_approved",
    category: "AI Agent系统"
  },
  
  // ❌ 应该被拒绝的内容
  {
    title: "New Restaurant Opens Downtown with Modern Cuisine",
    description: "A new Mediterranean restaurant featuring fresh ingredients and innovative dishes has opened in the downtown area.",
    expected: "primary_rejected",
    category: "完全不相关"
  },
  
  {
    title: "Stock Market Analysis: Technology Sector Performance Update",
    description: "Overview of technology sector performance in Q4 2024, including analysis of major tech company earnings and market trends.",
    expected: "primary_rejected", 
    category: "一般商业新闻"
  }
];

async function testLayeredScreening() {
  console.log('🧪 开始测试分层AI筛选系统...');
  console.log('='.repeat(60));
  
  let totalTests = 0;
  let passedTests = 0;
  
  for (const testCase of testCases) {
    totalTests++;
    
    console.log(`\n📋 测试 ${totalTests}/${testCases.length}: ${testCase.category}`);
    console.log(`标题: ${testCase.title.substring(0, 80)}...`);
    console.log(`预期: ${testCase.expected}`);
    
    try {
      // 模拟环境变量
      const mockEnv = {
        OPENROUTER_API_KEY: 'test-key'  // 测试用密钥
      };
      
      const mockLogs = [];
      
      // 执行一级筛选
      console.log('🔍 执行一级筛选...');
      const primaryResult = await performPrimaryScreening(mockEnv, testCase.title, testCase.description, mockLogs);
      
      let actualResult = '';
      let shouldContinue = true;
      
      if (!primaryResult.relevant) {
        actualResult = 'primary_rejected';
        shouldContinue = false;
      } else if (primaryResult.confidence >= 0.8) {
        actualResult = 'primary_approved';
        shouldContinue = false;
      } else if (primaryResult.confidence >= 0.3) {
        actualResult = 'secondary_screening';
      } else {
        actualResult = 'primary_low_confidence';
        shouldContinue = false;
      }
      
      // 如果需要二级筛选
      if (shouldContinue && actualResult === 'secondary_screening') {
        console.log('🔬 执行二级筛选...');
        const secondaryResult = await performSecondaryScreening(mockEnv, testCase.title, testCase.description, primaryResult, mockLogs);
        
        if (secondaryResult && secondaryResult.approved) {
          actualResult = 'secondary_approved';
        } else {
          actualResult = 'secondary_rejected';
        }
      }
      
      // 检查结果
      const testPassed = (
        (testCase.expected === 'primary_approved' && actualResult === 'primary_approved') ||
        (testCase.expected === 'primary_rejected' && actualResult === 'primary_rejected') ||
        (testCase.expected === 'secondary_screening' && (actualResult === 'secondary_approved' || actualResult === 'secondary_rejected'))
      );
      
      if (testPassed) {
        passedTests++;
        console.log(`✅ 测试通过: ${actualResult}`);
      } else {
        console.log(`❌ 测试失败: 预期 ${testCase.expected}, 实际 ${actualResult}`);
      }
      
      // 显示日志摘要
      if (mockLogs.length > 0) {
        console.log(`📝 处理日志: ${mockLogs[mockLogs.length - 1]}`);
      }
      
    } catch (error) {
      console.log(`❌ 测试异常: ${error.message}`);
    }
    
    console.log('-'.repeat(40));
  }
  
  console.log(`\n📊 测试总结:`);
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过测试: ${passedTests}`);
  console.log(`通过率: ${(passedTests / totalTests * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！分层筛选系统工作正常。');
  } else {
    console.log('⚠️ 部分测试失败，需要调整筛选逻辑。');
  }
  
  return { totalTests, passedTests, success: passedTests === totalTests };
}

// 如果直接运行此文件
if (typeof require !== 'undefined' && require.main === module) {
  testLayeredScreening().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { testLayeredScreening, testCases };