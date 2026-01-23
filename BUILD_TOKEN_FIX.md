# 🔧 Cloudflare Worker构建令牌问题解决方案

## 问题诊断
```
22:55:17.108	Initializing build environment...
22:55:18.614	Success: Finished initializing build environment
22:55:18.848	Failed: The build token selected for this build has been deleted or rolled and cannot be used for this build. Please update your build token in the Worker Builds settings and retry the build.
```

**原因**: Worker的构建令牌（Build Token）已被删除或轮换，无法进行自动构建。

## 🚀 解决步骤

### 方法1: 更新构建令牌（推荐）
1. **登录Cloudflare Dashboard**
   - 访问: https://dash.cloudflare.com/
   
2. **进入Worker设置**
   - Workers & Pages → siji-worker-v2 → Settings → Builds

3. **更新构建令牌**
   - 找到 "Build Token" 或 "API Token" 设置
   - 点击 "Roll Token" 或 "Generate New Token"
   - 复制新生成的令牌

4. **保存并重新构建**
   - 保存新令牌配置
   - 手动触发重新部署

### 方法2: 手动部署代码
1. **进入Worker编辑器**
   - Workers & Pages → siji-worker-v2 → Edit Code

2. **上传新代码**
   - 复制GitHub上的最新 `src/index.js` 内容
   - 粘贴到Worker编辑器
   - 点击 "Save and Deploy"

### 方法3: 重新连接GitHub（如果方法1失败）
1. **断开GitHub连接**
   - Settings → Builds → Disconnect GitHub

2. **重新连接**
   - 重新授权GitHub集成
   - 选择 vps4-1/siji-worker-v2 仓库
   - 配置新的构建设置

## 📋 构建配置检查项
确保以下设置正确：
- ✅ **Repository**: vps4-1/siji-worker-v2
- ✅ **Branch**: main  
- ✅ **Build Command**: 空（Worker不需要构建命令）
- ✅ **Root Directory**: / 或留空
- ✅ **Entry Point**: src/index.js

## 🔍 验证部署成功
部署完成后测试：
```bash
curl -s "https://siji-worker-v2.chengqiangshang.workers.dev/health"
```
应该看到版本更新，并且测试RSS时会显示"强制收录"日志。

## ⚡ 快速验证
部署成功的标志：
1. **健康检查**: 版本号更新
2. **RSS测试**: 出现"🚨 强制收录"日志
3. **AI筛选**: PostgreSQL、Google、NVIDIA文章通过

---
**下一步**: 请按照方法1更新构建令牌，然后重新触发部署。如遇问题，可尝试方法2手动部署。