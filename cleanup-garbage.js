// 彻底清理垃圾文章脚本
const PAYLOAD_API_ENDPOINT = 'https://payload-website-starter-blush-sigma.vercel.app';
const PAYLOAD_EMAIL = 'cheng@x.com';
const PAYLOAD_PASSWORD = 'chengqiang';

async function deleteGarbageArticles() {
  console.log('🧹 开始彻底清理垃圾文章...');

  // 1. 登录Payload
  const loginResponse = await fetch(`${PAYLOAD_API_ENDPOINT}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: PAYLOAD_EMAIL,
      password: PAYLOAD_PASSWORD
    })
  });

  const loginData = await loginResponse.json();
  const token = loginData.token;
  console.log('✅ Payload登录成功');

  // 2. 获取所有文章（分页处理）
  let page = 1;
  let totalDeleted = 0;
  let totalChecked = 0;

  while (true) {
    const response = await fetch(`${PAYLOAD_API_ENDPOINT}/api/posts?page=${page}&limit=50&sort=-publishedAt`);
    const data = await response.json();
    
    if (!data.docs || data.docs.length === 0) break;

    console.log(`\n📄 处理第${page}页，共${data.docs.length}篇文章`);

    for (const article of data.docs) {
      totalChecked++;
      const id = article.id;
      const title = article.title || '';
      const titleZh = article.title_zh;
      const publishedAt = article.publishedAt;

      // 识别垃圾文章
      let isGarbage = false;
      let reason = '';

      // 检查规则
      if (!titleZh) {
        isGarbage = true;
        reason = '缺少中文标题';
      } else if (title.includes('AI技术：') || title.includes('科技动态：') || title.includes('技术文章：')) {
        isGarbage = true;
        reason = '垃圾前缀标题';
      } else if (title.includes('can now turn you into a') || title.includes(' in AI模式 in ') || title.includes('AI模式ls')) {
        isGarbage = true;
        reason = '中英混合垃圾';
      } else if (title.length > 200) {
        isGarbage = true;
        reason = '异常长标题';
      } else if (publishedAt && new Date(publishedAt) > new Date('2026-01-23')) {
        // 删除1月23日以后的所有文章（都是垃圾）
        isGarbage = true;
        reason = '最近垃圾时期文章';
      }

      if (isGarbage) {
        console.log(`🗑️  删除 ID${id}: ${title.substring(0, 60)}... (${reason})`);
        
        try {
          const deleteResponse = await fetch(`${PAYLOAD_API_ENDPOINT}/api/posts/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `JWT ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (deleteResponse.ok) {
            totalDeleted++;
          } else {
            console.log(`❌ 删除失败 ID${id}: ${deleteResponse.status}`);
          }
        } catch (error) {
          console.log(`❌ 删除异常 ID${id}: ${error.message}`);
        }

        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        console.log(`✅ 保留 ID${id}: ${title.substring(0, 60)}...`);
      }
    }

    page++;
    if (page > 10) break; // 安全限制，最多处理10页
  }

  console.log(`\n🎉 清理完成！共检查 ${totalChecked} 篇，删除 ${totalDeleted} 篇垃圾文章`);
  
  // 3. 验证清理结果
  const finalCheck = await fetch(`${PAYLOAD_API_ENDPOINT}/api/posts?limit=10&sort=-publishedAt`);
  const finalData = await finalCheck.json();
  
  console.log('\n📊 清理后的最新文章:');
  finalData.docs?.forEach((doc, index) => {
    console.log(`${index + 1}. ID${doc.id}: ${doc.title}`);
  });
}

deleteGarbageArticles().catch(console.error);