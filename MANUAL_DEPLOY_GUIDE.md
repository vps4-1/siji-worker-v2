# 🚀 手动部署代码片段

由于Cloudflare构建令牌问题，您可以手动复制最新代码进行部署：

## 📋 操作步骤
1. 登录Cloudflare Dashboard: https://dash.cloudflare.com/
2. 进入 Workers & Pages → siji-worker-v2 → Edit Code
3. 将下面的完整代码复制粘贴到编辑器中
4. 点击 "Save and Deploy"

## 📂 完整代码文件
- **源文件**: `/home/user/webapp/src/index.js`
- **大小**: 约60KB（包含所有AI筛选优化）
- **关键功能**: 强制收录AI产品发布

## 🔍 关键修改内容
1. **强制收录关键词列表**:
   ```javascript
   const forceIncludeKeywords = [
     'PostgreSQL', 'ChatGPT', 'Google', 'Microsoft', 'NVIDIA', 'OpenAI', 
     'Isaac', 'Replicate', 'Attention', 'Sparse', 'AI Mode', 'DRIVE AV',
     'Personal Intelligence', 'Gated Sparse'
   ];
   ```

2. **优化的AI筛选Prompt**:
   - 🚨 特别强调：AI产品发布必须推送！
   - 📋 扩展强制相关关键词
   - 🔑 原则：宁可多收录100篇，不可漏掉1个AI产品发布

## ⚡ 验证部署成功
部署后运行测试：
```bash
curl -s -X POST "https://siji-worker-v2.chengqiangshang.workers.dev/test" | grep "强制收录"
```

看到 `[AI] 🚨 强制收录: ...` 即表示新版本生效！

---
**GitHub完整代码**: https://github.com/vps4-1/siji-worker-v2/blob/main/src/index.js