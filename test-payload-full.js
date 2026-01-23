// 完整的Payload连接测试工具
async function testPayloadConnection() {
  const email = 'admin@zhuji.gd';
  const password = '61381185';
  const baseUrl = 'https://payload-website-starter-onbwoq68m-billboings-projects.vercel.app';
  
  console.log('🔗 测试Payload CMS连接状态...\n');
  
  // 1. 测试基础连接
  console.log('📡 步骤1: 检查网站基础访问...');
  try {
    const homeResponse = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SijiGPT-PayloadTest/1.0'
      }
    });
    
    console.log('网站状态:', homeResponse.status);
    console.log('响应头:', Object.fromEntries(homeResponse.headers.entries()));
    
    if (homeResponse.status === 200) {
      console.log('✅ 网站可以正常访问');
    } else if (homeResponse.status === 401) {
      console.log('🔒 仍然需要认证 - Vercel保护可能未完全移除');
    }
    
  } catch (error) {
    console.log('❌ 基础连接失败:', error.message);
  }
  
  console.log('\n📡 步骤2: 检查API端点...');
  try {
    // 2. 测试API端点
    const apiResponse = await fetch(`${baseUrl}/api`, {
      method: 'GET',
      headers: {
        'User-Agent': 'SijiGPT-PayloadTest/1.0'
      }
    });
    
    console.log('API状态:', apiResponse.status);
    console.log('Content-Type:', apiResponse.headers.get('content-type'));
    
    if (apiResponse.ok) {
      const apiResult = await apiResponse.text();
      console.log('API响应预览:', apiResult.substring(0, 200));
    }
    
  } catch (error) {
    console.log('❌ API连接失败:', error.message);
  }
  
  console.log('\n📡 步骤3: 尝试用户登录...');
  try {
    // 3. 测试登录
    const loginResponse = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SijiGPT-PayloadTest/1.0'
      },
      body: JSON.stringify({ email, password })
    });
    
    console.log('登录状态:', loginResponse.status);
    
    const contentType = loginResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const loginData = await loginResponse.json();
      console.log('✅ 收到JSON响应 - 登录API正常工作!');
      console.log('登录结果:', JSON.stringify(loginData, null, 2));
      
      // 检查是否有token
      if (loginData.token) {
        console.log('🎟️ 获得认证Token:', loginData.token.substring(0, 50) + '...');
        
        // 4. 使用token测试Posts API
        console.log('\n📡 步骤4: 使用Token测试Posts API...');
        const postsResponse = await fetch(`${baseUrl}/api/posts`, {
          method: 'GET',
          headers: {
            'Authorization': `JWT ${loginData.token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'SijiGPT-PayloadTest/1.0'
          }
        });
        
        console.log('Posts API状态:', postsResponse.status);
        
        if (postsResponse.ok) {
          const posts = await postsResponse.json();
          console.log('✅ Posts API正常工作!');
          console.log('现有文章数量:', posts.totalDocs || posts.docs?.length || 0);
          console.log('Posts数据结构:', Object.keys(posts));
          
          return {
            success: true,
            token: loginData.token,
            apiEndpoint: baseUrl,
            postsCount: posts.totalDocs || posts.docs?.length || 0
          };
        } else {
          console.log('❌ Posts API访问失败');
          const error = await postsResponse.text();
          console.log('错误信息:', error.substring(0, 300));
        }
      }
      
    } else {
      const loginText = await loginResponse.text();
      console.log('❌ 仍然收到HTML认证页面');
      console.log('页面预览:', loginText.substring(0, 300));
    }
    
  } catch (error) {
    console.log('❌ 登录测试失败:', error.message);
  }
  
  return { success: false, error: 'Payload连接失败' };
}

// 执行测试
testPayloadConnection().then(result => {
  console.log('\n🎯 最终结果:');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log('\n🎉 Payload连接成功！可以开始配置真实API Key');
    console.log('📝 配置信息:');
    console.log(`PAYLOAD_API_ENDPOINT = "${result.apiEndpoint}"`);
    console.log(`PAYLOAD_API_KEY = "${result.token.substring(0, 20)}..."`);
  } else {
    console.log('\n⏳ Payload还需要进一步配置，建议:');
    console.log('1. 确认Vercel保护完全移除');
    console.log('2. 等待部署生效 (可能需要几分钟)');
    console.log('3. 或者尝试使用自定义域名');
  }
});