# 📱 Telegram → Payload 发布系统配置指南

## 🎯 功能概述

实现从Telegram频道消息自动发布到Payload CMS的完整工作流：
- **Telegram频道** → **Webhook** → **AI处理** → **Payload CMS** → **可选回复**

## 🔧 配置步骤

### 1. 创建Telegram Bot

```bash
# 1. 联系 @BotFather 创建新Bot
/newbot

# 2. 获得Bot Token (格式: 123456789:ABCdefGHI...)
# 3. 记录Token，用于环境变量配置
```

### 2. 设置Webhook

```bash
# 设置Webhook URL指向Worker
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://siji-worker-v2.chengqiangshang.workers.dev/telegram-webhook",
    "allowed_updates": ["message", "channel_post", "edited_message", "edited_channel_post"]
  }'

# 验证Webhook状态
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### 3. 配置环境变量

在 `wrangler.toml` 或 Cloudflare Dashboard 中设置：

```toml
[vars]
# 必需配置
TELEGRAM_BOT_TOKEN = "123456789:ABCdefGHI..."
PAYLOAD_API_ENDPOINT = "https://your-payload-cms.com"  
PAYLOAD_API_KEY = "your-payload-api-key"

# 可选配置
AI_ENHANCE_TG_CONTENT = "true"    # 使用AI增强内容
TG_REPLY_ON_SUCCESS = "true"      # 发布成功后回复确认
```

### 4. Payload CMS 配置

确保Payload CMS有以下字段的posts集合：

```javascript
// payload.config.js - posts collection
{
  slug: 'posts',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true },
    { name: 'content', type: 'richText' },
    { name: 'excerpt', type: 'textarea' },
    { name: 'status', type: 'select', options: ['draft', 'published'] },
    { name: 'publishedAt', type: 'date' },
    { name: 'source', type: 'text' },
    { name: 'sourceUrl', type: 'text' },
    { name: 'sourceData', type: 'json' },
    { name: 'tags', type: 'array', of: { type: 'text' } },
    { name: 'category', type: 'text' }
  ]
}
```

## 🚀 使用方法

### 1. 基本消息发布

在Telegram频道发送消息：
```
🚀 新AI模型发布：GPT-5来了！

OpenAI今天发布了备受期待的GPT-5模型，在多个基准测试中表现出色。

主要特性：
- 更强的推理能力
- 支持多模态输入
- 更快的响应速度

#AI #GPT5 #OpenAI #人工智能

https://openai.com/gpt-5
```

### 2. 自动处理结果

系统会自动：
1. **解析消息**：提取标题、描述、链接、标签
2. **AI增强**（可选）：优化标题、生成摘要、添加SEO标签  
3. **发布到Payload**：创建新的blog文章
4. **回复确认**（可选）：在Telegram中回复发布状态

### 3. 消息格式建议

```
[标题行 - 将成为文章标题]

[正文内容 - 将成为文章描述]

[hashtag标签]

[相关链接]
```

## 🤖 AI增强功能

当启用 `AI_ENHANCE_TG_CONTENT=true` 时，系统会：

1. **标题优化**：生成更吸引人的标题
2. **内容结构化**：重新组织内容结构
3. **SEO优化**：生成SEO友好的摘要
4. **智能标签**：自动生成相关标签
5. **分类识别**：自动识别内容类别

## 📊 监控和日志

### 查看处理日志
```bash
# 查看Worker日志
wrangler tail siji-worker-v2

# 或查看Cloudflare Dashboard的实时日志
```

### 测试Webhook
```bash
# 手动测试Webhook
curl -X POST "https://siji-worker-v2.chengqiangshang.workers.dev/telegram-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "message_id": 123,
      "chat": {"id": -100123456789, "type": "channel"},
      "date": 1640995200,
      "text": "测试消息 #test https://example.com"
    }
  }'
```

## 🛡️ 安全注意事项

1. **Token保护**：永远不要在代码中硬编码Bot Token
2. **权限限制**：Bot只需要接收消息的权限
3. **验证来源**：系统会验证消息来源的合法性
4. **API限制**：注意Telegram API的频率限制

## 🔧 故障排除

### 常见问题

**Q: Webhook没有收到消息？**
A: 检查Bot Token和Webhook URL设置，确保Bot被添加到频道

**Q: 发布到Payload失败？**  
A: 验证PAYLOAD_API_ENDPOINT和PAYLOAD_API_KEY配置

**Q: AI增强不工作？**
A: 检查OPENROUTER_API_KEY配置和模型可用性

### 调试命令

```bash
# 检查Webhook状态
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# 检查Worker健康状态
curl "https://siji-worker-v2.chengqiangshang.workers.dev/health"

# 查看详细错误日志
wrangler tail siji-worker-v2 --format=pretty
```

## 📈 扩展功能

### 支持的消息类型
- ✅ 文本消息
- ✅ 图片 + 说明文字
- ✅ 文档 + 说明文字
- ✅ 视频 + 说明文字
- ✅ 编辑后的消息
- ✅ 频道转发消息

### 计划中的功能
- 📅 定时发布
- 🖼️ 图片自动上传到CDN
- 🔗 链接预览生成
- 📊 发布统计和分析
- 🎯 智能内容分类
- 🌐 多语言支持

## 💡 最佳实践

1. **消息格式统一**：保持频道消息格式的一致性
2. **标签规范**：使用统一的hashtag命名规范
3. **内容质量**：AI增强不能替代高质量的原始内容
4. **定期检查**：监控发布状态和错误日志
5. **备份机制**：建议同时保留原始Telegram消息

---

🎉 **配置完成后，您就可以享受从Telegram到Payload的无缝内容发布体验了！**