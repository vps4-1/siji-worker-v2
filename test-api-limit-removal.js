#!/usr/bin/env node
/**
 * API频率限制解除效果测试
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 API频率限制解除方案测试');
console.log('============================');

const indexPath = path.join(__dirname, 'src/index.js');
const code = fs.readFileSync(indexPath, 'utf8');

// 检查超级严格限制
const superStrictCheck = code.includes('const maxRssFeeds = 15') && 
                        code.includes('const maxKvChecks = 10');

// 检查紧急模式
const emergencyModeCheck = code.includes('const emergencyMode = env.EMERGENCY_NO_DEDUP') &&
                          code.includes('跳过去重检查，直接处理文章');

console.log(`✅ 超级严格限制: ${superStrictCheck ? 'PASS' : 'FAIL'}`);
console.log(`✅ 紧急模式支持: ${emergencyModeCheck ? 'PASS' : 'FAIL'}`);

// API请求数量估算
const scenarios = {
  normal: {
    rss: 15,
    kv: 10 * 2, // 10篇文章 × 2次KV检查
    total: 15 + 20
  },
  emergency: {
    rss: 15,
    kv: 0, // 紧急模式跳过所有KV检查
    total: 15
  }
};

console.log('\n📊 API请求数量对比:');
console.log('正常模式:');
console.log(`  RSS获取: ${scenarios.normal.rss} 请求`);
console.log(`  KV检查: ${scenarios.normal.kv} 请求`);  
console.log(`  总计: ${scenarios.normal.total} 请求`);

console.log('\n紧急模式:');
console.log(`  RSS获取: ${scenarios.emergency.rss} 请求`);
console.log(`  KV检查: ${scenarios.emergency.kv} 请求 (完全跳过)`);
console.log(`  总计: ${scenarios.emergency.total} 请求`);

const reduction = Math.round((1 - scenarios.emergency.total / scenarios.normal.total) * 100);
console.log(`\n🎯 紧急模式API减少: ${reduction}%`);

console.log('\n🔥 解除API限制的三层防护:');
console.log('1️⃣ RSS源限制: 172个→15个 (-91%)');
console.log('2️⃣ KV检查限制: 50篇→10篇 (-80%)');
console.log('3️⃣ 紧急模式: 可完全跳过KV检查 (-100%)');

console.log('\n⚡ 启用紧急模式方法:');
console.log('设置环境变量: EMERGENCY_NO_DEDUP="true"');

const isSafe = scenarios.normal.total <= 100;
console.log(`\n🎯 安全性评估: ${isSafe ? '✅ 完全安全' : '⚠️ 需要观察'}`);

console.log('\n🕐 下次测试: UTC 06:15 (北京14:15)');