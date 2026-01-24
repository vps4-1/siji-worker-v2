// 测试手动翻译函数
function translateTitleManually(title) {
  // 基本翻译映射表
  const translations = {
    'How to': '如何',
    'Fine-Tune': '微调',
    'FLUX Model': 'FLUX模型',
    'PostgreSQL': 'PostgreSQL数据库',
    'ChatGPT': 'ChatGPT',
    'Personal Intelligence': '个人智能',
    'AI Mode': 'AI模式',
    'Search': '搜索',
    'Gated Sparse Attention': '门控稀疏注意力',
    'Computational Efficiency': '计算效率',
    'Training Stability': '训练稳定性',
    'Long-Context': '长上下文',
    'Language Models': '语言模型',
    'Deep Neural Nets': '深度神经网络',
    'Multimodal': '多模态',
    'Reinforcement Learning': '强化学习',
    'Isaac': 'Isaac模型',
    'Replicate': 'Replicate平台',
    'RL without TD learning': '无TD学习的强化学习',
    'The Download': '技术下载',
    'chatbots for health': '健康聊天机器人',
    'AI regulation': 'AI监管',
    'Google Photos': '谷歌相册',
    'meme': '表情包'
  };
  
  let translated = title;
  
  // 应用翻译映射
  for (const [en, zh] of Object.entries(translations)) {
    const regex = new RegExp(en, 'gi');
    translated = translated.replace(regex, zh);
  }
  
  // 如果没有翻译成功，生成通用中文标题
  if (translated === title || !/[\u4e00-\u9fa5]/.test(translated)) {
    if (title.includes('AI') || title.includes('ChatGPT') || title.includes('GPT')) {
      translated = `AI技术：${title}`;
    } else if (title.includes('Google') || title.includes('Microsoft') || title.includes('OpenAI')) {
      translated = `科技动态：${title}`;
    } else {
      translated = `技术文章：${title}`;
    }
  }
  
  return translated;
}

// 测试用例
const testTitles = [
  "Gated Sparse Attention: Combining Computational Efficiency with Training Stability for Long-Context Language Models",
  "Personal Intelligence in AI Mode in Search: Help t...",
  "The Download: chatbots for health, and US fights o...",
  "Google Photos can now turn you into a meme",
  "Deep Neural Nets: 33 years ago and 33 years from n..."
];

console.log('测试手动翻译结果:');
testTitles.forEach(title => {
  const result = translateTitleManually(title);
  console.log(`原标题: ${title}`);
  console.log(`翻译结果: ${result}`);
  console.log(`包含中文: ${/[\u4e00-\u9fa5]/.test(result)}`);
  console.log('---');
});