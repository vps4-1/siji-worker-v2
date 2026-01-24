// 批量删除垃圾文章脚本

async function loginAndDelete() {
  console.log('🔐 登录到Payload...');
  
  // 登录获取token
  const loginResponse = await fetch('https://payload-website-starter-blush-sigma.vercel.app/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@zhuji.gd',
      password: '61381185'
    })
  });
  
  const loginData = await loginResponse.json();
  const token = loginData.token;
  console.log('✅ 登录成功');
  
  // 要删除的垃圾文章ID列表（从分析结果中提取）
  const badArticleIds = [
    224, 223, 222, 221, 220, 219, 218, 217, 216, 215, 214, 213, 212, 211, 210,
    209, 208, 207, 206, 205, 204, 203, 202, 201, 200, 199, 198, 197, 196, 195,
    194, 193, 192, 191, 190, 189, 188, 187, 186, 185, 184, 183, 182, 181, 180,
    179, 178, 177, 176, 175, 174, 173, 172, 171, 170, 169, 168, 167, 166, 165,
    164, 163, 162, 161, 160, 159, 158, 157, 156, 155, 154, 153, 152, 151, 144,
    143, 142, 141, 140, 139, 138, 137
    // 保留136（测试文章）和135（测试文章），它们不是垃圾
  ];
  
  console.log(`🗑️ 开始删除 ${badArticleIds.length} 篇垃圾文章...`);
  
  let deleted = 0;
  let errors = 0;
  
  for (const id of badArticleIds) {
    try {
      console.log(`删除中: ID${id}...`);
      
      const deleteResponse = await fetch(`https://payload-website-starter-blush-sigma.vercel.app/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `JWT ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (deleteResponse.ok) {
        console.log(`✅ ID${id} 删除成功`);
        deleted++;
      } else {
        console.log(`❌ ID${id} 删除失败: ${deleteResponse.status}`);
        errors++;
      }
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.log(`❌ ID${id} 删除错误: ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n🏁 清理完成！`);
  console.log(`✅ 成功删除: ${deleted} 篇`);
  console.log(`❌ 删除失败: ${errors} 篇`);
  console.log(`📊 剩余文章: 约 ${134 - deleted} 篇`);
  
  // 验证清理结果
  console.log('\n🔍 验证清理结果...');
  const verifyResponse = await fetch('https://payload-website-starter-blush-sigma.vercel.app/api/posts?limit=1');
  const verifyData = await verifyResponse.json();
  console.log(`📝 当前网站总文章数: ${verifyData.totalDocs}`);
}

loginAndDelete().catch(console.error);