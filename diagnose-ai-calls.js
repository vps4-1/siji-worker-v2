#!/usr/bin/env node
/**
 * AI调用问题诊断工具
 * 检查callOpenRouterAI函数定义和调用
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 AI调用问题诊断');
console.log('==================');

// 读取源码
const indexPath = path.join(__dirname, 'src/index.js');
const code = fs.readFileSync(indexPath, 'utf8');

// 检查函数定义
const functionDefMatches = code.match(/async function callOpenRouterAI\([^)]*\)\s*{/g);
console.log(`✅ 函数定义检查: ${functionDefMatches ? 'FOUND' : 'NOT FOUND'}`);
if (functionDefMatches) {
  console.log(`   找到 ${functionDefMatches.length} 个定义`);
}

// 检查函数调用
const functionCallMatches = code.match(/callOpenRouterAI\([^)]*\)/g);
console.log(`✅ 函数调用检查: ${functionCallMatches ? 'FOUND' : 'NOT FOUND'}`);
if (functionCallMatches) {
  console.log(`   找到 ${functionCallMatches.length} 个调用`);
  functionCallMatches.forEach((call, index) => {
    console.log(`   调用${index + 1}: ${call.substring(0, 50)}...`);
  });
}

// 检查语法问题
const lines = code.split('\n');
let inFunction = false;
let braceCount = 0;
let functionStartLine = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('async function callOpenRouterAI')) {
    inFunction = true;
    functionStartLine = i + 1;
    braceCount = 0;
    console.log(`\n📍 函数开始于第 ${functionStartLine} 行`);
  }
  
  if (inFunction) {
    // 统计大括号
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    braceCount += openBraces - closeBraces;
    
    // 检查是否是函数结束
    if (braceCount === 0 && line.includes('}')) {
      console.log(`📍 函数结束于第 ${i + 1} 行`);
      console.log(`📏 函数总长度: ${i + 1 - functionStartLine + 1} 行`);
      inFunction = false;
      break;
    }
  }
}

// 检查可能的问题
console.log('\n🔍 潜在问题检查:');

// 检查是否有未闭合的字符串或注释
const unclosedStrings = code.match(/`[^`]*$/gm);
if (unclosedStrings) {
  console.log(`❌ 发现未闭合的模板字符串: ${unclosedStrings.length} 个`);
}

// 检查是否有语法错误的async/await
const asyncAwaitIssues = code.match(/await\s+[^(]/g);
if (asyncAwaitIssues) {
  console.log(`⚠️ 可能的async/await问题: ${asyncAwaitIssues.length} 个`);
}

// 检查环境变量配置
const envVarCheck = code.includes('env.OPENROUTER_API_KEY');
console.log(`✅ OpenRouter API Key检查: ${envVarCheck ? 'FOUND' : 'NOT FOUND'}`);

console.log('\n📊 诊断结果:');
if (functionDefMatches && functionCallMatches) {
  console.log('✅ 函数定义和调用都存在');
  console.log('⚠️ 问题可能在于:');
  console.log('   1. 函数作用域问题');
  console.log('   2. 运行时上下文问题');
  console.log('   3. Worker环境变量问题');
} else {
  console.log('❌ 函数定义或调用缺失');
}

console.log('\n🔧 建议修复方案:');
console.log('1. 检查函数是否在正确的作用域中');
console.log('2. 验证Worker环境变量配置');
console.log('3. 测试简化版本的AI调用');