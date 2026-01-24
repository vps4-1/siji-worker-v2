/**
 * 生产环境测试 - 验证新的分层AI筛选系统
 */

// 测试配置
const TEST_CONFIG = {
  workerUrl: 'https://siji-worker-v2.chengqiangshang.workers.dev/test',
  testPayload: {
    description: '测试新分层AI筛选系统',
    limit: 5  // 少量测试
  }
};

// 真实的AI相关RSS文章示例
const REAL_AI_ARTICLES = [
  {
    title: "OpenAI launches GPT-4 Turbo with improved reasoning",
    description: "New model features enhanced reasoning capabilities and reduced costs for developers",
    expected: "should_pass_primary"
  },
  {
    title: "Google DeepMind announces Gemini 2.0 with multimodal capabilities", 
    description: "Advanced AI system can process text, images, audio and video simultaneously",
    expected: "should_pass_primary"
  },
  {
    title: "Anthropic releases Claude 3.5 Sonnet with better coding abilities",
    description: "Latest Claude model shows significant improvements in programming tasks",
    expected: "should_pass_primary"
  },
  {
    title: "New PostgreSQL extension optimizes database performance for AI workloads",
    description: "Extension provides better indexing and query optimization for machine learning applications",
    expected: "should_pass_secondary"
  },
  {
    title: "Microsoft integrates AI copilot into Excel for automated data analysis",
    description: "Excel users can now use natural language to generate insights and visualizations",
    expected: "should_pass_primary"
  },
  {
    title: "Startup raises $50M for revolutionary restaurant management software",
    description: "New SaaS platform helps restaurants optimize inventory and staff scheduling",
    expected: "should_reject"
  }
];

async function testProductionScreening() {
  console.log('🏭 开始生产环境AI筛选测试...\n');
  
  try {
    // 1. 触发Worker处理
    console.log('📤 发送测试请求到Worker...');
    const response = await fetch(TEST_CONFIG.workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_CONFIG.testPayload)
    });
    
    if (!response.ok) {
      throw new Error(`Worker请求失败: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Worker响应:', result);
    
    // 2. 等待处理完成
    console.log('\n⏳ 等待文章处理完成...');
    await new Promise(resolve => setTimeout(resolve, 30000)); // 等待30秒
    
    // 3. 检查最新发布的文章
    console.log('\n📊 检查最新发布的文章...');
    const postsResponse = await fetch('https://payload-website-starter-blush-sigma.vercel.app/api/posts?limit=10&sort=-publishedAt');
    
    if (!postsResponse.ok) {
      throw new Error(`获取文章失败: ${postsResponse.status}`);
    }
    
    const postsData = await postsResponse.json();
    const recentPosts = postsData.docs || [];
    
    console.log(`\n📋 发现 ${recentPosts.length} 篇最新文章:`);
    
    // 4. 分析筛选质量
    let qualityScore = 0;
    let aiRelatedCount = 0;
    let totalCount = Math.min(recentPosts.length, 5);
    
    recentPosts.slice(0, 5).forEach((post, index) => {
      console.log(`\n📄 文章 ${index + 1}:`);
      console.log(`   ID: ${post.id}`);
      console.log(`   标题: ${post.title}`);
      console.log(`   中文标题: ${post.title_zh || '无'}`);
      
      // 处理嵌套的摘要结构
      const summaryZhText = post.summary_zh?.content || post.summary_zh || '';
      const summaryEnText = post.summary_en?.content || post.summary_en || '';
      const keywordsZh = post.keywords_zh?.map(k => k.keyword || k) || post.summary_zh?.keywords?.map(k => k.keyword || k) || [];
      const keywordsEn = post.keywords_en?.map(k => k.keyword || k) || [];
      
      console.log(`   摘要长度: 中文${summaryZhText.length}字, 英文${summaryEnText.length}字`);
      console.log(`   关键词: 中文[${keywordsZh.slice(0,3).join(', ')}], 英文[${keywordsEn.slice(0,3).join(', ')}]`);
      
      // 判断AI相关性
      const title = (post.title || '').toLowerCase();
      const titleZh = (post.title_zh || '').toLowerCase(); 
      const summaryZh = String(summaryZhText).toLowerCase();
      
      const aiKeywords = ['ai', 'gpt', 'claude', 'gemini', 'openai', 'google', 'microsoft', 'nvidia', 'anthropic', 
                         'machine learning', 'deep learning', 'neural', 'agent', 'automation', 
                         '人工智能', '机器学习', '深度学习', '神经网络', '智能', '自动化'];
      
      const isAiRelated = aiKeywords.some(keyword => 
        title.includes(keyword) || titleZh.includes(keyword) || summaryZh.includes(keyword)
      );
      
      if (isAiRelated) {
        aiRelatedCount++;
        console.log(`   ✅ AI相关内容`);
      } else {
        console.log(`   ❓ 可能非AI相关`);
      }
      
      // 检查内容质量
      const hasGoodTitle = (post.title_zh && post.title_zh.length > 5) || (post.title && post.title.length > 10);
      const hasGoodSummary = summaryZhText && summaryZhText.length > 50;
      const hasKeywords = keywordsZh && keywordsZh.length >= 2;
      
      if (hasGoodTitle && hasGoodSummary && hasKeywords) {
        qualityScore += 1;
        console.log(`   ✅ 内容质量良好`);
      } else {
        console.log(`   ⚠️ 内容质量待改进 (标题:${hasGoodTitle}, 摘要:${hasGoodSummary}, 关键词:${hasKeywords})`);
      }
    });
    
    // 5. 生成测试报告
    const aiRelevanceRate = totalCount > 0 ? (aiRelatedCount / totalCount * 100).toFixed(1) : 0;
    const contentQualityRate = totalCount > 0 ? (qualityScore / totalCount * 100).toFixed(1) : 0;
    
    console.log(`\n\n📈 分层筛选系统测试报告:`);
    console.log('=' .repeat(60));
    console.log(`🎯 AI相关性: ${aiRelatedCount}/${totalCount} (${aiRelevanceRate}%)`);
    console.log(`📝 内容质量: ${qualityScore}/${totalCount} (${contentQualityRate}%)`);
    
    if (aiRelevanceRate >= 80) {
      console.log('✅ AI相关性筛选: 优秀');
    } else if (aiRelevanceRate >= 60) {
      console.log('⚠️ AI相关性筛选: 良好');
    } else {
      console.log('❌ AI相关性筛选: 需改进');
    }
    
    if (contentQualityRate >= 80) {
      console.log('✅ 内容生成质量: 优秀');
    } else if (contentQualityRate >= 60) {
      console.log('⚠️ 内容生成质量: 良好');  
    } else {
      console.log('❌ 内容生成质量: 需改进');
    }
    
    console.log(`\n🔍 系统状态:`);
    console.log(`- 分层筛选: Grok/Groq初筛 → Gemini深度分析`);
    console.log(`- 筛选策略: 宽松标准，重点捕捉AI产品发布`);
    console.log(`- 内容生成: Claude 3.5 Sonnet + OpenRouter备选`);
    console.log(`- 测试时间: ${new Date().toLocaleString()}`);
    
    return {
      ai_relevance_rate: parseFloat(aiRelevanceRate),
      content_quality_rate: parseFloat(contentQualityRate),
      total_articles: totalCount,
      ai_related_articles: aiRelatedCount,
      quality_articles: qualityScore
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

// 如果作为脚本运行
if (typeof require !== 'undefined' && require.main === module) {
  testProductionScreening()
    .then(result => {
      console.log('\n🎉 测试完成，结果:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 测试异常:', error);
      process.exit(1);
    });
}

// 导出供其他模块使用  
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testProductionScreening };
}