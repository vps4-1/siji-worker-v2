// 测试模拟模式的Telegram → Payload功能
async function testMockPayload() {
  console.log('🧪 测试模拟Payload功能...\n');
  
  // 模拟环境变量
  const mockEnv = {
    PAYLOAD_API_ENDPOINT: 'mock://test-mode',
    PAYLOAD_API_KEY: 'mock_test_key'
  };
  
  // 模拟Telegram消息内容
  const mockContent = {
    message_id: 12345,
    chat_id: -1003648041127,
    text: '今天学习了Cloudflare Workers的部署流程，发现它真的很强大！ #学习笔记 #技术分享',
    date: new Date().toISOString(),
    hashtags: ['学习笔记', '技术分享'],
    title: '今天学习了Cloudflare Workers的部署流程，发现它真的很强大！',
    description: '',
    link: null,
    is_manual_post: true
  };
  
  console.log('📝 模拟内容:');
  console.log('  文本:', mockContent.text);
  console.log('  标签:', mockContent.hashtags.join(', '));
  console.log('  时间:', mockContent.date);
  console.log('');
  
  // 引入generateSlugFromContent函数 (简化版)
  function generateSlugFromContent(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s\u4e00-\u9fa5]/g, '') 
      .replace(/\s+/g, '-')
      .substring(0, 60)
      .replace(/^-+|-+$/g, '') || `article-${Date.now().toString(36)}`;
  }
  
  // 模拟publishToPayloadCMS函数
  async function mockPublishToPayloadCMS(env, content) {
    try {
      const payloadEndpoint = env.PAYLOAD_API_ENDPOINT;
      const payloadApiKey = env.PAYLOAD_API_KEY;
      
      if (!payloadEndpoint || !payloadApiKey) {
        return { 
          success: false, 
          error: '未配置Payload CMS连接信息 (PAYLOAD_API_ENDPOINT, PAYLOAD_API_KEY)' 
        };
      }

      // 🧪 模拟模式检测
      if (payloadEndpoint.startsWith('mock://')) {
        console.log('[Payload] 🧪 模拟模式激活');
        
        // 模拟成功响应
        const mockId = `mock_${Date.now()}`;
        const mockSlug = generateSlugFromContent(content.text);
        
        console.log(`[Payload] 📄 模拟发布: ${content.text.substring(0, 50)}...`);
        console.log(`[Payload] 🏷️  标签: ${content.hashtags.join(', ')}`);
        console.log(`[Payload] 📅 时间: ${content.date}`);
        
        return {
          success: true,
          id: mockId,
          slug: mockSlug,
          mockMode: true,
          previewData: {
            title: content.title || 'Telegram频道消息',
            content: content.text,
            tags: content.hashtags,
            source: 'telegram_manual',
            publishedAt: content.date,
            link: content.link,
            chat_id: content.chat_id,
            message_id: content.message_id
          }
        };
      }
      
      // 真实模式 (这里不会执行)
      return { success: false, error: '非模拟模式' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // 执行测试
  const result = await mockPublishToPayloadCMS(mockEnv, mockContent);
  
  console.log('\n✅ 测试结果:');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.success && result.mockMode) {
    console.log('\n🎉 模拟模式工作正常!');
    console.log('📄 文章ID:', result.id);
    console.log('🔗 SEO Slug:', result.slug);
    console.log('📋 预览数据:', JSON.stringify(result.previewData, null, 2));
  } else {
    console.log('\n❌ 模拟模式测试失败');
  }
}

// 运行测试
testMockPayload();