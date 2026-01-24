const testData = {
  title: "测试中文标题",
  title_zh: "测试中文标题", 
  title_en: "Test English Title",
  slug: `test-title-zh-${Date.now()}`,
  publishedAt: new Date().toISOString(),
  source: {
    url: "https://example.com/test",
    name: "Test Source"
  },
  summary_zh: {
    content: "这是中文摘要内容",
    keywords: [{ keyword: "测试" }, { keyword: "中文" }]
  },
  summary_en: {
    content: "This is English summary content", 
    keywords: [{ keyword: "test" }, { keyword: "english" }]
  },
  original_language: "zh",
  _status: "published"
};

console.log("测试title_zh字段:");
console.log(JSON.stringify(testData, null, 2));

// 模拟发布
fetch("https://payload-website-starter-blush-sigma.vercel.app/api/users/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@zhuji.gd", 
    password: "61381185"
  })
})
.then(res => res.json())
.then(loginData => {
  const token = loginData.token;
  console.log("\n登录成功，测试发布...");
  
  return fetch("https://payload-website-starter-blush-sigma.vercel.app/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `JWT ${token}`
    },
    body: JSON.stringify(testData)
  });
})
.then(res => res.json())
.then(result => {
  console.log("\n发布结果:", result);
  if (result.doc) {
    console.log(`\n验证结果:`);
    console.log(`ID: ${result.doc.id}`);
    console.log(`title: ${result.doc.title}`); 
    console.log(`title_zh: ${result.doc.title_zh}`);
    console.log(`title_en: ${result.doc.title_en}`);
  }
})
.catch(err => console.error("错误:", err));