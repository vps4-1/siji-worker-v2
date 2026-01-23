// 本地测试Payload CMS连接
async function testPayloadConnection() {
  const email = 'admin@zhuji.gd';
  const password = '61381185';
  const baseUrl = 'https://payload-website-starter-onbwoq68m-billboings-projects.vercel.app';
  
  console.log('🔑 测试Payload CMS连接...');
  console.log('URL:', baseUrl);
  console.log('Email:', email);
  
  try {
    // 1. 尝试登录
    console.log('\n📝 步骤1: 尝试登录...');
    const loginResponse = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SijiGPT-PayloadTest/1.0'
      },
      body: JSON.stringify({ email, password })
    });
    
    console.log('登录状态:', loginResponse.status);
    console.log('响应头:', Object.fromEntries(loginResponse.headers.entries()));
    
    const contentType = loginResponse.headers.get('content-type');
    let loginResult;
    
    if (contentType && contentType.includes('application/json')) {
      loginResult = await loginResponse.json();
      console.log('JSON 响应:', JSON.stringify(loginResult, null, 2));
    } else {
      loginResult = await loginResponse.text();
      console.log('文本响应预览:', loginResult.substring(0, 500));
    }
    
    // 2. 检查是否有token或cookie
    const authHeader = loginResponse.headers.get('authorization');
    const setCookie = loginResponse.headers.get('set-cookie');
    
    if (authHeader) {
      console.log('\n✅ 找到Authorization header:', authHeader);
    }
    
    if (setCookie) {
      console.log('\n🍪 找到Set-Cookie:', setCookie);
    }
    
    // 3. 如果登录成功，尝试获取Posts
    if (loginResponse.ok && (authHeader || setCookie)) {
      console.log('\n📝 步骤2: 尝试获取Posts...');
      
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'SijiGPT-PayloadTest/1.0'
      };
      
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }
      
      if (setCookie) {
        headers['Cookie'] = setCookie.split(';')[0]; // 取第一个cookie
      }
      
      const postsResponse = await fetch(`${baseUrl}/api/posts`, {
        method: 'GET',
        headers
      });
      
      console.log('Posts状态:', postsResponse.status);
      
      if (postsResponse.ok) {
        const posts = await postsResponse.json();
        console.log('Posts数据:', JSON.stringify(posts, null, 2));
      } else {
        const error = await postsResponse.text();
        console.log('Posts错误:', error.substring(0, 300));
      }
    }
    
  } catch (error) {
    console.error('❌ 连接错误:', error.message);
  }
}

// 运行测试
testPayloadConnection();