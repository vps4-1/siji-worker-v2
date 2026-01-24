# 数据库替代方案详细分析

## 🗄️ **数据库选择对比**

### **方案1: Cloudflare D1 (推荐)**
```sql
-- 优势：
-- ✅ 原生集成Cloudflare Workers
-- ✅ 无服务器，自动扩展
-- ✅ 批量操作支持
-- ✅ 无连接限制

CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_hash TEXT,
  content TEXT,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_feed TEXT,
  ai_processed BOOLEAN DEFAULT FALSE
);

-- 批量插入示例
INSERT OR IGNORE INTO articles (url, title, title_hash, content, source_feed)
VALUES 
  ('url1', 'title1', 'hash1', 'content1', 'feed1'),
  ('url2', 'title2', 'hash2', 'content2', 'feed2'),
  -- ... 批量插入100篇
  ('url100', 'title100', 'hash100', 'content100', 'feed100');

-- 批量去重检查
SELECT url FROM articles WHERE url IN ('url1', 'url2', ..., 'url100');
```

### **方案2: PostgreSQL (高性能)**
```javascript
// Neon.tech/Supabase等服务
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20 // 连接池
});

// 批量upsert
await pool.query(`
  INSERT INTO articles (url, title, content, source_feed)
  SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[])
  ON CONFLICT (url) DO NOTHING
`, [urls, titles, contents, feeds]);
```

### **方案3: Redis + PostgreSQL 混合**
```javascript
// Redis缓存 + PostgreSQL持久化
const redis = new Redis(env.REDIS_URL);
const pg = new Pool({ connectionString: env.DATABASE_URL });

// 1. Redis快速去重
const existingUrls = await redis.sismember('processed_urls', urlsToCheck);

// 2. PostgreSQL批量写入
await pg.query('INSERT INTO articles ... ON CONFLICT DO NOTHING');

// 3. Redis更新缓存
await redis.sadd('processed_urls', newUrls);
```

## 📊 **性能对比**

| 方案 | 去重速度 | 批量写入 | 成本 | 复杂度 |
|------|----------|----------|------|--------|
| Cloudflare KV | 50ms/篇 | 不支持 | 低 | 简单 |
| D1 SQLite | 1ms/批次 | ✅ 支持 | 低 | 简单 |
| PostgreSQL | 0.5ms/批次 | ✅ 优秀 | 中 | 中等 |
| Redis+PG | 0.1ms/批次 | ✅ 最优 | 高 | 复杂 |

## 🚀 **实施建议**

### **立即方案：启用D1数据库**
```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "siji-articles"
database_id = "your-d1-id"
```

### **代码改造示例**
```javascript
// 替换KV的批量去重
async function batchCheckDuplicatesDB(env, articles) {
  const urls = articles.map(a => `'${normalizeUrl(a.link)}'`).join(',');
  
  const result = await env.DB.prepare(`
    SELECT url FROM articles WHERE url IN (${urls})
  `).all();
  
  const existingUrls = new Set(result.results.map(r => r.url));
  return articles.filter(a => !existingUrls.has(normalizeUrl(a.link)));
}

// 批量插入新文章
async function batchInsertArticles(env, articles) {
  const values = articles.map(a => `(
    '${normalizeUrl(a.link)}',
    '${a.title.replace(/'/g, "''")}',
    '${generateTitleHash(a.title)}',
    '${a.description?.replace(/'/g, "''")}',
    '${a.feedUrl}'
  )`).join(',');
  
  await env.DB.prepare(`
    INSERT OR IGNORE INTO articles (url, title, title_hash, content, source_feed)
    VALUES ${values}
  `).run();
}
```

## 🎯 **迁移计划**

### **阶段1: D1准备** (1小时)
1. 创建D1数据库
2. 运行建表SQL
3. 配置wrangler.toml

### **阶段2: 代码迁移** (2小时)  
1. 替换checkDuplicates函数
2. 实现批量操作
3. 测试验证

### **阶段3: 数据迁移** (可选)
1. 从KV导出现有数据
2. 导入到D1
3. 验证数据完整性

## 💰 **成本分析**

- **D1**: $0.001/1M reads, $1/1M writes
- **当前KV**: $0.50/1M reads, $5/1M writes  
- **预期节省**: 80-90% 数据库成本

## ⚡ **立即行动**

您希望我立即实施哪个方案？
1. **D1数据库迁移** (推荐，彻底解决)
2. **Cloudflare Queues** (架构优化)
3. **增量抓取** (减少无效请求)
4. **继续当前紧急模式** (临时方案)