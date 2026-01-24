// 测试AI翻译功能
const testTitle = "How to Fine-Tune a FLUX Model in under an hour with AI Toolkit and a DigitalOcean H100 GPU";
const testDescription = "Learn step-by-step process to fine-tune FLUX models using AI Toolkit on DigitalOcean's H100 GPUs for optimal performance.";

async function testAITranslation() {
  console.log('🧪 测试AI强制翻译功能');
  console.log('输入标题:', testTitle);
  console.log('输入描述:', testDescription);
  
  try {
    const response = await fetch('https://siji-worker-v2.chengqiangshang.workers.dev/api/test-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: testTitle,
        description: testDescription,
        mode: 'forced_translation'
      })
    });
    
    const result = await response.json();
    console.log('\nAI翻译结果:');
    console.log('中文标题:', result.title_zh);
    console.log('英文标题:', result.title_en);
    console.log('相关性:', result.relevant);
    console.log('原始语言:', result.original_language);
    console.log('中文摘要长度:', result.summary_zh?.length || 0);
    console.log('英文摘要长度:', result.summary_en?.length || 0);
    
    if (result.title_zh && result.title_zh !== testTitle) {
      console.log('✅ 翻译成功');
    } else {
      console.log('❌ 翻译失败');
    }
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testAITranslation();