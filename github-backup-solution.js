// GitHub备份发布机制
async function publishToGitHub(env, article, logs) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    logs.push('[GitHub] ⚠️ GitHub配置缺失，跳过备份');
    return false;
  }

  try {
    const fileName = `ai-articles/${new Date().toISOString().split('T')[0]}-${article.slug || 'article'}.md`;
    const content = `# ${article.title}

## 基本信息
- **发布时间**: ${article.publishedAt}
- **来源**: ${article.source?.name || '未知'}
- **原始语言**: ${article.original_language || 'zh'}
- **URL**: ${article.source?.url || '无'}

## 中文摘要
${article.summary_zh?.content || article.content}

**关键词**: ${(article.summary_zh?.keywords || []).map(k => k.keyword).join('、')}

## English Summary  
${article.summary_en?.content || ''}

**Keywords**: ${(article.summary_en?.keywords || []).map(k => k.keyword).join(', ')}

---
*由SijiGPT RSS系统自动生成并强制收录*
`;

    const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${fileName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `AI产品发布: ${article.title}`,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: 'main'
      })
    });

    if (response.ok) {
      const result = await response.json();
      logs.push(`[GitHub] ✅ 备份成功: ${fileName}`);
      return true;
    } else {
      logs.push(`[GitHub] ❌ 备份失败: ${response.status}`);
      return false;
    }
  } catch (error) {
    logs.push(`[GitHub] ❌ 备份错误: ${error.message}`);
    return false;
  }
}