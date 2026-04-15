-- 智游金旅 - 用户画像数据模型
-- 创建时间: 2025-01-26
-- 版本: v1.0

-- 用户主表（不放PII到画像链路）
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  icbc_uid_hash TEXT UNIQUE,
  username TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  seg_consent BOOLEAN DEFAULT 1,  -- 画像同意（可关闭）
  user_type TEXT DEFAULT 'user',  -- user/admin
  last_login DATETIME,
  is_active BOOLEAN DEFAULT 1
);

-- 事件埋点（最小必要字段）
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event TEXT NOT NULL, -- page_view / search_city / book_click / rights_activate / finance_buy
  amount DECIMAL(12,2),
  city TEXT,
  item_id TEXT,        -- 商品/酒店/门票ID
  product_id TEXT,      -- 金融产品ID
  page_id TEXT,         -- 页面ID
  rights_id TEXT,       -- 权益ID
  term TEXT,            -- 分期期限
  is_installment BOOLEAN DEFAULT 0, -- 是否分期
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 特征快照（日更）
CREATE TABLE IF NOT EXISTS user_features (
  user_id INTEGER PRIMARY KEY,
  spend_30d DECIMAL(12,2) DEFAULT 0,
  trips_365d INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 50,  -- 0-100
  activity_30d INTEGER DEFAULT 0,  -- 活跃计数
  city TEXT,
  age_bucket TEXT, -- '18-24','25-34','35-44','45-54','55-64','65+'
  installment_count INTEGER DEFAULT 0, -- 分期次数
  education_orders INTEGER DEFAULT 0,  -- 教育类订单
  health_orders INTEGER DEFAULT 0,     -- 康养类订单
  destination_diversity INTEGER DEFAULT 0, -- 目的地多样性
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 画像输出表（日更）
CREATE TABLE IF NOT EXISTS user_segment (
  user_id INTEGER PRIMARY KEY,
  label TEXT,        -- 轻旅行打工人/理财型游客/家庭度假型/康养型用户/探索型年轻人
  spend_pct INTEGER,  -- 0-100 分位
  activity_pct INTEGER, -- 0-100 分位
  risk_pct INTEGER,   -- 0-100 分位
  version TEXT DEFAULT 'v1.0',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 聚合概览（供用户端&管理端）
CREATE TABLE IF NOT EXISTS segment_overview_daily (
  as_of DATE,
  label TEXT,
  share DECIMAL(5,4), -- 0~1
  total_users INTEGER,
  PRIMARY KEY (as_of, label)
);

-- 近30天词云聚合
CREATE TABLE IF NOT EXISTS wordcloud_30d (
  text TEXT,
  weight INTEGER,
  as_of DATE,
  PRIMARY KEY (as_of, text)
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_events_user_ts ON events(user_id, ts);
CREATE INDEX IF NOT EXISTS idx_events_event ON events(event);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_user_features_city ON user_features(city);
CREATE INDEX IF NOT EXISTS idx_user_features_age ON user_features(age_bucket);
CREATE INDEX IF NOT EXISTS idx_user_segment_label ON user_segment(label);
CREATE INDEX IF NOT EXISTS idx_segment_overview_as_of ON segment_overview_daily(as_of);
CREATE INDEX IF NOT EXISTS idx_wordcloud_as_of ON wordcloud_30d(as_of);

-- 插入默认管理员用户（如果不存在）
INSERT OR IGNORE INTO users (id, icbc_uid_hash, username, user_type, seg_consent) 
VALUES (1, 'admin_hash_12345', 'admin', 'admin', 1);

-- 插入示例普通用户（用于测试）
INSERT OR IGNORE INTO users (id, icbc_uid_hash, username, user_type, seg_consent) 
VALUES (2, 'user_hash_67890', 'testuser', 'user', 1);

-- 插入示例事件数据（用于测试画像生成）
INSERT OR IGNORE INTO events (user_id, event, amount, city, item_id, ts) VALUES
(2, 'page_view', NULL, '北京', 'main_page', '2025-01-20 10:00:00'),
(2, 'search_city', NULL, '上海', NULL, '2025-01-21 14:30:00'),
(2, 'book_click', 2999.00, '北京', 'hotel_001', '2025-01-22 09:15:00'),
(2, 'rights_activate', NULL, '北京', NULL, '2025-01-23 16:45:00'),
(2, 'finance_buy', 50000.00, '北京', 'product_001', '2025-01-24 11:20:00');

-- 插入示例特征数据
INSERT OR IGNORE INTO user_features (user_id, spend_30d, trips_365d, risk_score, activity_30d, city, age_bucket, installment_count, education_orders, health_orders, destination_diversity) VALUES
(2, 3500.00, 4, 35, 12, '北京', '25-34', 2, 0, 0, 3);

-- 插入示例画像数据
INSERT OR IGNORE INTO user_segment (user_id, label, spend_pct, activity_pct, risk_pct, version) VALUES
(2, '轻旅行打工人', 62, 74, 45, 'v1.0');

-- 插入示例聚合数据
INSERT OR IGNORE INTO segment_overview_daily (as_of, label, share, total_users) VALUES
('2025-01-26', '理财型游客', 0.26, 1250),
('2025-01-26', '轻旅行打工人', 0.32, 1540),
('2025-01-26', '家庭度假型', 0.18, 870),
('2025-01-26', '康养型用户', 0.15, 720),
('2025-01-26', '探索型年轻人', 0.09, 430);

-- 插入示例词云数据
INSERT OR IGNORE INTO wordcloud_30d (text, weight, as_of) VALUES
('亲子', 41, '2025-01-26'),
('北京', 38, '2025-01-26'),
('上海', 35, '2025-01-26'),
('理财', 32, '2025-01-26'),
('酒店', 29, '2025-01-26'),
('分期', 26, '2025-01-26'),
('杭州', 23, '2025-01-26'),
('三亚', 20, '2025-01-26'),
('成都', 18, '2025-01-26'),
('西安', 15, '2025-01-26');








