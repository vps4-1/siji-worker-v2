// 测试强制收录逻辑
const testArticles = [
  {
    title: "Scaling PostgreSQL to power 800 million ChatGPT users",
    description: "How OpenAI scales PostgreSQL for ChatGPT"
  },
  {
    title: "Personal Intelligence in AI Mode in Search: Help t...", 
    description: "Google launches new AI search features"
  },
  {
    title: "NVIDIA DRIVE AV Raises the Bar for Vehicle Safety",
    description: "NVIDIA launches new autonomous vehicle technology"
  },
  {
    title: "Run Isaac 0.1 on Replicate",
    description: "Isaac model release on Replicate platform"
  },
  {
    title: "Gated Sparse Attention: Combining Computational Ef...",
    description: "Research paper on attention mechanisms"
  },
  {
    title: "AI-Powered Disinformation Swarms Are Coming for De...",
    description: "Article about AI and disinformation"
  }
];

const forceIncludeKeywords = [
  'PostgreSQL', 'ChatGPT', 'Google', 'Microsoft', 'NVIDIA', 'OpenAI', 
  'Isaac', 'Replicate', 'Attention', 'Sparse', 'AI Mode', 'DRIVE AV',
  'Personal Intelligence', 'Gated Sparse'
];

console.log('🧪 测试强制收录逻辑\n');

testArticles.forEach((article, index) => {
  const shouldForceInclude = forceIncludeKeywords.some(keyword => 
    article.title.toLowerCase().includes(keyword.toLowerCase()) || 
    article.description?.toLowerCase().includes(keyword.toLowerCase())
  );
  
  const matchedKeywords = forceIncludeKeywords.filter(keyword => 
    article.title.toLowerCase().includes(keyword.toLowerCase()) || 
    article.description?.toLowerCase().includes(keyword.toLowerCase())
  );
  
  console.log(`文章 ${index + 1}: ${article.title.substring(0, 50)}...`);
  console.log(`  强制收录: ${shouldForceInclude ? '✅ 是' : '❌ 否'}`);
  if (shouldForceInclude) {
    console.log(`  匹配关键词: ${matchedKeywords.join(', ')}`);
  }
  console.log('');
});