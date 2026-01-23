# 📱 Telegram → Payload 直接发布系统配置指南

## 🎯 功能概述

实现从Telegram频道**手动消息**直接发布到Payload CMS的简洁工作流：
- **手动TG内容** → **直接发布** → **Payload CMS** → **可选回复**
- **🚫 防循环发布**: 智能识别并阻止RSS自动内容回流
- **🗑️ 同步删除**: TG删除消息时，自动删除Payload对应文章

## 🎯 设计理念

### 简洁直接
- **不使用AI处理**: 保持内容的原始性和真实性
- **不生成标题**: 让Payload根据内容自动处理
- **直接用#标签**: 作为文章关键词和分类
- **原文发布**: 完整保留用户的想法和表达

### 智能同步
- **双向同步**: 发布和删除都能同步
- **防循环机制**: 只发布手动内容，不发布RSS聚合内容
- **实时响应**: Webhook即时处理消息变化

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
TG_REPLY_ON_SUCCESS = "true"      # 发布成功后回复确认
```

注意：移除了 `AI_ENHANCE_TG_CONTENT` 配置，因为现在直接发布，不使用AI处理。

### 4. Payload CMS 配置

确保Payload CMS有以下字段的posts集合：

```javascript
// payload.config.js - posts collection
{
  slug: 'posts',
  fields: [
    { name: 'content', type: 'richText', required: true },  // 原始TG内容
    { name: 'excerpt', type: 'textarea' },                  // 自动截取的摘要
    { name: 'status', type: 'select', options: ['draft', 'published'] },
    { name: 'publishedAt', type: 'date' },
    { name: 'source', type: 'text' },                       // 'telegram_manual'
    { name: 'sourceUrl', type: 'text' },                    // TG消息中的链接
    { name: 'sourceData', type: 'json' },                   // TG元数据
    { name: 'tags', type: 'array', of: { type: 'text' } },  // #标签（不含#号）
    // 注意：不再需要title字段，让Payload自动处理
  ]
}
```

## 🚀 使用方法

### 1. 发布个人内容

在Telegram频道发送消息：
```
💡 我对AI发展的思考

最近看到GPT-5的发布，让我思考了几个问题：

1. AI模型的能力边界在哪里？
2. 我们如何确保AI发展的安全性？
3. 个人隐私在AI时代如何保护？

作为技术从业者，我认为我们需要更加主动地参与AI伦理的讨论。

#AI思考 #技术伦理 #个人观点

相关阅读：https://example.com/ai-ethics
```

### 2. 自动处理结果

系统会自动：
1. **检测内容类型**：确认是手动内容（非RSS）
2. **直接发布**：原文发布到Payload CMS，不进行AI修改
3. **提取标签**：#标签自动成为文章关键词（移除#号）
4. **回复确认**（可选）：在Telegram中回复发布状态

### 3. 同步删除功能

如果您在Telegram中删除了消息：
1. **自动检测**：系统检测到消息删除事件
2. **查找对应文章**：通过telegram_message_id查找Payload中的文章
3. **自动删除**：删除对应的Payload文章
4. **确认回复**（可选）：回复删除成功状态

### 4. 内容格式建议

#### ✅ 推荐格式
```
[个人想法/观点的开头]

[详细阐述，可以包含：]
- 个人经历分享
- 技术见解
- 学习心得  
- 项目总结

[#标签1 #标签2 #标签3]

[相关链接（可选）]
```

#### 🚫 会被过滤的格式
- 包含"📰 摘要："、"🔗 来源："等RSS特征
- 包含RSS源域名链接
- Bot自动发送的消息
- 系统推送时间段的技术长文

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