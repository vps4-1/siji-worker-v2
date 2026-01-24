// 直接测试AI调用
async function testAICall() {
  const testTitle = "Personal Intelligence in AI Mode in Search: Help that's uniquely yours";
  const testDescription = "Google introduces Personal Intelligence in AI Mode, a new feature that provides personalized search assistance.";
  
  console.log('🧪 测试AI调用...');
  console.log(`标题: ${testTitle}`);
  console.log(`描述: ${testDescription}`);
  
  try {
    // 测试正常screening模式
    console.log('\n1. 测试正常screening模式:');
    const normalResult = await fetch('https://siji-worker-v2.chengqiangshang.workers.dev/test-ai-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: testTitle,
        description: testDescription,
        purpose: 'screening'
      })
    }).then(r => r.text());
    console.log('结果:', normalResult.substring(0, 200));
    
    // 测试强制screening模式
    console.log('\n2. 测试强制screening模式:');
    const forcedResult = await fetch('https://siji-worker-v2.chengqiangshang.workers.dev/test-ai-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: testTitle,
        description: testDescription,  
        purpose: 'forced_screening'
      })
    }).then(r => r.text());
    console.log('结果:', forcedResult.substring(0, 200));
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testAICall();