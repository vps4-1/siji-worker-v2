-- D1数据库初始化脚本
-- 文章主表
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_hash TEXT NOT NULL,
  content TEXT,
  summary_zh TEXT,
  summary_en TEXT,
  keywords_zh TEXT,
  keywords_en TEXT,
  source_feed TEXT,
  ai_processed BOOLEAN DEFAULT FALSE,
  published_to_payload BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- URL索引（去重用）
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_url ON articles(url);

-- 标题哈希索引（相似度去重）
CREATE INDEX IF NOT EXISTS idx_articles_title_hash ON articles(title_hash);

-- 源索引（按RSS源查询）
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_feed);

-- AI处理状态索引
CREATE INDEX IF NOT EXISTS idx_articles_ai_processed ON articles(ai_processed);