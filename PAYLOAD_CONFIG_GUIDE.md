# Payload CMS 配置步骤

## 当前状况
您的Payload网站被Vercel SSO保护，需要特殊配置才能让API正常工作。

## 🎯 推荐方案: 取消Vercel保护 (最简单)

### 步骤1: 登录Vercel Dashboard
1. 访问: https://vercel.com/dashboard  
2. 找到项目: `payload-website-starter-onbwoq68m`

### 步骤2: 取消保护设置  
**方法A: 密码保护**
- Settings → General → Password Protection → 暂时禁用

**方法B: 访问控制** 
- Settings → Functions → Authorization → 设为Public或允许所有来源

**方法C: 环境变量**
- Settings → Environment Variables → 检查是否有VERCEL_AUTHENTICATION相关设置

### 步骤3: 重新部署
- Deployments → 触发新的部署，确保设置生效

### 步骤4: 验证API可访问
测试链接: https://payload-website-starter-onbwoq68m-billboings-projects.vercel.app/api/users/login

应该返回JSON而不是认证页面。

## 🔧 配置API Key

### 取消保护后:
1. **访问后台**: https://payload-website-starter-onbwoq68m-billboings-projects.vercel.app/admin
2. **登录账号**: admin@zhuji.gd / 61381185  
3. **找到API Keys**: 通常在 Settings → API Keys 或 Users → API Keys
4. **创建Key**: 权限设为 Posts: Create, Update, Delete, Read
5. **复制Key值**: 类似 `payload_abc123...` 或 `eyJhbGc...`

### 更新Worker配置:
```toml
PAYLOAD_API_ENDPOINT = "https://payload-website-starter-onbwoq68m-billboings-projects.vercel.app"  
PAYLOAD_API_KEY = "your_api_key_here"
```

## 🧪 测试连接

配置完成后，访问: https://siji-worker-v2.chengqiangshang.workers.dev/test-payload

发送POST请求测试登录:
```json
{
  "email": "admin@zhuji.gd",
  "password": "61381185" 
}
```

## ⚡ 立即激活

一旦Payload API可访问:
1. 更新wrangler.toml配置 
2. 部署: `wrangler deploy`
3. 在@sijigpt频道发布 → 自动同步到网站！

## 🆘 替代方案

如果Vercel设置太复杂:
1. **使用其他域名**: 绑定自己的域名到这个项目
2. **重新部署**: 部署Payload到其他平台 (Railway, Render等)
3. **继续模拟模式**: 功能测试正常，等待合适时机配置

---

**当前状态**: 模拟模式运行正常，所有功能就绪，只差最后一步配置！