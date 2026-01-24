// 清理质量差的文章脚本

async function analyzeArticleQuality() {
  console.log('🔍 分析现有文章质量...');
  
  // 获取所有文章
  const response = await fetch('https://payload-website-starter-blush-sigma.vercel.app/api/posts?limit=1000');
  const data = await response.json();
  
  const badArticles = [];
  const recentArticles = [];
  
  data.docs.forEach(doc => {
    const publishDate = new Date(doc.publishedAt);
    const isRecent = publishDate > new Date('2026-01-23'); // 昨天开始的文章
    
    if (isRecent) {
      recentArticles.push(doc);
      
      // 检测垃圾内容标志
      const hasBadTitle = doc.title && (
        doc.title.includes('AI技术：') ||
        doc.title.includes('科技动态：') ||
        doc.title.includes('技术文章：') ||
        /AI.*模式ls/.test(doc.title) ||
        /门控.*稀疏.*注意力.*Combining/.test(doc.title)
      );
      
      const hasBadSummary = doc.summary_zh?.content && (
        doc.summary_zh.content.includes('这是一篇关于') ||
        doc.summary_zh.content.includes('相关技术介绍') ||
        doc.summary_zh.content.length < 100
      );
      
      const hasGenericKeywords = doc.summary_zh?.keywords?.some(kw => 
        kw.keyword === 'AI技术' || kw.keyword === '产品发布' || kw.keyword === '科技新闻'
      );
      
      if (hasBadTitle || hasBadSummary || hasGenericKeywords) {
        badArticles.push({
          id: doc.id,
          title: doc.title,
          publishedAt: doc.publishedAt,
          issues: {
            badTitle: hasBadTitle,
            badSummary: hasBadSummary,
            genericKeywords: hasGenericKeywords
          }
        });
      }
    }
  });
  
  console.log(`.总文章数: ${data.docs.length}`);
  console.log(`📅 近期文章数: ${recentArticles.length}`);
  console.log(`🗑️ 垃圾文章数: ${badArticles.length}`);
  console.log('');
  
  console.log('🗑️ 垃圾文章列表:');
  badArticles.forEach((article, i) => {
    console.log(`${i+1}) ID${article.id}: ${article.title.substring(0, 60)}...`);
    console.log(`   时间: ${article.publishedAt}`);
    console.log(`   问题: 标题${article.issues.badTitle ? '❌' : '✅'} 摘要${article.issues.badSummary ? '❌' : '✅'} 关键词${article.issues.genericKeywords ? '❌' : '✅'}`);
    console.log('');
  });
  
  return { total: data.docs.length, recent: recentArticles.length, bad: badArticles.length, badList: badArticles };
}

// 删除垃圾文章函数（需要认证）
async function deleteArticles(articleIds, authToken) {
  console.log(`🗑️ 开始删除 ${articleIds.length} 篇垃圾文章...`);
  
  let deleted = 0;
  for (const id of articleIds) {
    try {
      const response = await fetch(`https://payload-website-starter-blush-sigma.vercel.app/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `JWT ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log(`✅ 删除成功: ID${id}`);
        deleted++;
      } else {
        console.log(`❌ 删除失败: ID${id} - ${response.status}`);
      }
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`❌ 删除错误: ID${id} - ${error.message}`);
    }
  }
  
  console.log(`🏁 完成删除: ${deleted}/${articleIds.length} 篇文章`);
  return deleted;
}

// 执行分析
analyzeArticleQuality().then(result => {
  console.log('📊 分析完成！');
  console.log(`建议删除 ${result.bad} 篇垃圾文章，释放空间给高质量AI处理的内容。`);
  
  if (result.bad > 0) {
    console.log('');
    console.log('🔧 下一步操作选项:');
    console.log('1. 删除垃圾文章后重新等待RSS推送');
    console.log('2. 保留文章但提升AI处理质量');
    console.log('3. 批量重新处理选定的重要文章');
  }
});