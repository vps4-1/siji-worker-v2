#!/bin/bash

# Payload网站状态监控脚本

echo "🔍 Payload网站状态检查..."
echo "时间: $(date)"
echo "目标: https://payload-website-starter-onbwoq68m-billboings-projects.vercel.app"
echo ""

# 1. 基础连接测试
echo "📡 1. 基础连接测试:"
status=$(curl -s -o /dev/null -w "%{http_code}" https://payload-website-starter-onbwoq68m-billboings-projects.vercel.app)
echo "   HTTP状态码: $status"

if [ "$status" = "200" ]; then
    echo "   ✅ 网站可访问!"
elif [ "$status" = "401" ]; then
    echo "   🔒 仍需要认证 (Vercel保护未移除)"
else
    echo "   ❌ 其他状态: $status"
fi

echo ""

# 2. API端点测试
echo "📡 2. API端点测试:"
api_status=$(curl -s -o /dev/null -w "%{http_code}" https://payload-website-starter-onbwoq68m-billboings-projects.vercel.app/api)
echo "   API状态码: $api_status"

if [ "$api_status" = "200" ]; then
    echo "   ✅ API可访问!"
elif [ "$api_status" = "401" ]; then
    echo "   🔒 API需要认证"
else
    echo "   ❌ API状态: $api_status"
fi

echo ""

# 3. 登录测试  
echo "📡 3. 登录API测试:"
login_response=$(curl -s -X POST "https://payload-website-starter-onbwoq68m-billboings-projects.vercel.app/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zhuji.gd", "password": "61381185"}')

if echo "$login_response" | grep -q "token"; then
    echo "   ✅ 登录成功! 获得Token"
    echo "   🎟️  可以配置真实Payload连接"
elif echo "$login_response" | grep -q "Authentication Required"; then
    echo "   🔒 仍需要Vercel认证"
    echo "   ⏳ 请继续等待或检查Vercel设置"
else
    echo "   ❓ 未知响应"
    echo "   响应预览: ${login_response:0:100}..."
fi

echo ""
echo "📊 总结:"

if [ "$status" = "200" ] && [ "$api_status" = "200" ]; then
    echo "   🎉 Payload网站完全可用! 可以立即配置"
    echo "   📝 下一步: 运行 node test-payload-full.js 获取Token"
elif [ "$status" = "401" ]; then
    echo "   ⏳ Vercel保护仍在生效"
    echo "   🔧 建议: 检查Vercel项目设置并重新部署"
    echo "   ⏰ 或等待5-10分钟让设置生效"
else
    echo "   ❌ 网站不可访问，请检查部署状态"
fi

echo ""
echo "🧪 当前替代方案: 模拟模式运行正常"
echo "   测试页面: https://siji-worker-v2.chengqiangshang.workers.dev/telegram-test"
echo "   所有功能可测试，等待Payload配置完成即可切换"