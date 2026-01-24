#!/bin/bash

# 🔄 自动Git推送脚本
# 解决GitHub推送认证问题

set -e

echo "🔄 准备自动推送到GitHub..."

# 1. 检查工作区状态
if [[ $(git status --porcelain) ]]; then
    echo "📝 检测到未提交的更改，先提交..."
    git add .
    git commit -m "🔄 自动提交：$(date '+%Y-%m-%d %H:%M:%S')"
fi

# 2. 确保在开发分支
echo "🔀 切换到genspark_ai_developer分支..."
git checkout genspark_ai_developer || git checkout -b genspark_ai_developer

# 3. 合并main分支的最新更改
echo "🔄 合并main分支更改..."
git merge main --no-edit || echo "⚠️ 合并冲突需要手动解决"

# 4. 显示待推送的提交
echo "📋 待推送的提交："
git log --oneline origin/genspark_ai_developer..HEAD | head -10

# 5. 提供推送指令
echo ""
echo "🚀 手动推送指令："
echo "git push origin genspark_ai_developer"
echo ""
echo "🔗 创建PR链接："
echo "https://github.com/vps4-1/siji-worker-v2/compare/main...genspark_ai_developer"

# 6. 尝试自动推送（可能需要认证）
echo "🔄 尝试自动推送..."
if git push origin genspark_ai_developer 2>/dev/null; then
    echo "✅ 自动推送成功！"
else
    echo "❌ 自动推送失败，需要手动认证"
    echo "💡 解决方案："
    echo "1. 使用GitHub CLI: gh auth login"
    echo "2. 或访问上述链接手动创建PR"
fi