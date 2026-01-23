# 🧪 防循环发布机制测试案例

## 测试目标
验证系统能够正确识别并阻止RSS自动内容，同时允许手动内容发布到Payload CMS。

## 测试案例

### ✅ Case 1: 手动内容 (会发布到Payload)

```json
{
  "message": {
    "message_id": 12345,
    "chat": {
      "id": -1001234567890,
      "type": "channel",
      "title": "斯基GPT频道"
    },
    "date": 1708776000,
    "text": "💡 我的想法：关于AI发展的思考\n\n今天看到GPT-5的消息，让我想到了AI发展的几个关键点：\n\n1. 模型能力的指数级增长\n2. 计算资源需求的挑战  \n3. AI安全和对齐的重要性\n\n我认为未来的AI发展需要更加注重可控性和透明度。\n\n#AI思考 #未来科技 #个人观点"
  }
}
```

**预期结果**: ✅ 发布到Payload
- 检测结果: 非RSS内容
- 标记: `is_manual_post: true`
- 分类: `Personal`

### 🚫 Case 2: RSS自动内容 (被拦截)

```json
{
  "message": {
    "message_id": 12346,
    "chat": {
      "id": -1001234567890,
      "type": "channel"
    },
    "date": 1708776300,
    "text": "📰 AI新闻摘要：OpenAI发布GPT-5\n\n🔗 来源：https://openai.com/blog/gpt-5\n\n📊 发布时间：2024-01-23\n\nEnglish Summary: OpenAI announces GPT-5 with revolutionary capabilities in reasoning, creativity, and multimodal understanding...\n\n中文摘要：OpenAI今天宣布发布GPT-5模型，在推理、创造性和多模态理解方面实现重大突破...\n\n🏷️ 标签：#GPT5 #OpenAI #人工智能\n\n由SijiGPT系统自动推送整理"
  }
}
```

**预期结果**: 🚫 被拦截
- 检测结果: RSS自动内容
- 触发规则: 
  - ✅ RSS格式特征 (`📰摘要：`, `🔗来源：`, `📊发布时间：`)
  - ✅ RSS域名 (`openai.com/blog`)
  - ✅ 双语摘要格式
  - ✅ 自动推送标识 (`由SijiGPT系统自动推送整理`)

### 🤖 Case 3: Bot消息 (被拦截)

```json
{
  "message": {
    "message_id": 12347,
    "chat": {"id": -1001234567890, "type": "channel"},
    "from": {"id": 123456789, "is_bot": true, "first_name": "SijiBot"},
    "via_bot": {"id": 123456789, "username": "sijigpt_bot"},
    "date": 1708776600,
    "text": "🚀 新AI模型发布通知\n\n这是Bot自动发送的消息..."
  }
}
```

**预期结果**: 🚫 被拦截
- 检测结果: Bot发送的消息
- 触发规则: `via_bot` 或 `from.is_bot: true`

### ⏰ Case 4: 时间匹配RSS内容 (被拦截)

```json
{
  "message": {
    "message_id": 12348,
    "chat": {"id": -1001234567890, "type": "channel"},
    "date": 1708776000,
    "text": "AI技术突破：深度学习新进展\n\n研究人员在机器学习领域取得重大进展，新算法在多个基准测试中表现出色...\n\n这项技术有望革命性地改变人工智能的发展方向。\n\n#AI #机器学习 #深度学习 #技术突破"
  }
}
```

**条件**: 消息时间为00:05 UTC (系统推送时间+5分钟内)

**预期结果**: 🚫 被拦截
- 检测结果: 时间和内容特征匹配RSS推送
- 触发规则: 
  - ✅ 接近推送时间 (00:00 UTC ±10分钟)
  - ✅ 包含技术关键词
  - ✅ 内容长度>300字符

## 验证方法

### 1. 使用测试页面
访问 `/telegram-test` 页面，使用预设模板进行测试：

- **✏️ 手动内容模板**: 应该成功发布
- **🤖 RSS内容模板**: 应该被拦截

### 2. 查看日志输出
在Webhook处理过程中，系统会输出详细的检测日志：

```
[TG Parser] 🔄 检测到RSS自动内容，跳过发布到Payload
[RSS Detection] 📋 匹配RSS格式模式: /📰.*摘要：/i
[RSS Detection] 🔗 包含RSS源域名链接
[RSS Detection] 🌐 检测到双语摘要格式
```

### 3. API响应验证
- **手动内容**: `{"success": true, "payload_id": "...", "logs": [...]}`
- **RSS内容**: `{"success": false, "error": "无效的Telegram消息格式"}`

## 配置建议

### 环境变量设置
```bash
# 严格模式 - 只允许明确的手动内容
TG_STRICT_MODE="true"

# 白名单用户 - 信任的发送者ID
TG_TRUSTED_USERS="123456789,987654321"

# 调试模式 - 输出详细检测日志  
TG_DEBUG_DETECTION="true"
```

### Payload CMS字段映射
确保Payload支持以下字段区分内容来源：

```javascript
{
  source: 'telegram_manual',      // vs 'rss_auto'
  content_type: 'user_generated', // vs 'aggregated'
  is_manual_post: true,           // vs false
  rss_filtered: false             // vs true
}
```

## 预期效果

实施防循环发布机制后：

- ✅ **用户体验**: 只有真正的个人想法会同步到网站
- ✅ **内容质量**: 避免重复的RSS聚合内容
- ✅ **系统稳定**: 防止无限循环和内容冗余
- ✅ **智能识别**: 多层检测确保准确性

---

**测试完成后，系统将完美实现"TG个人想法 → Payload，RSS内容留在TG"的需求！** 🎯