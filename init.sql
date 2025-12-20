-- TruthCircle Database Schema and Initial Data
-- 這個檔案可以手動匯入，但程式會自動執行這些 SQL
-- 建議：只需設定 DATABASE_URL 環境變數，程式會自動初始化

-- ==========================================
-- 1. CREATE TABLES
-- ==========================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    created_at BIGINT NOT NULL
);

-- Topics Table
CREATE TABLE IF NOT EXISTS topics (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    timestamp BIGINT NOT NULL,
    ai_analysis TEXT,
    is_analyzing BOOLEAN DEFAULT FALSE,
    credible_votes INTEGER DEFAULT 0,
    controversial_votes INTEGER DEFAULT 0,
    type VARCHAR(20) DEFAULT 'discussion'
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(255) PRIMARY KEY,
    topic_id VARCHAR(255) REFERENCES topics(id),
    author_id VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    timestamp BIGINT NOT NULL,
    parent_id VARCHAR(255),
    type VARCHAR(20) DEFAULT 'general',
    stance VARCHAR(20) DEFAULT 'neutral'
);

-- Votes Table (Comment Votes)
CREATE TABLE IF NOT EXISTS votes (
    user_id VARCHAR(255) NOT NULL,
    comment_id VARCHAR(255) REFERENCES comments(id),
    vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
    PRIMARY KEY (user_id, comment_id)
);

-- Topic Votes Table
CREATE TABLE IF NOT EXISTS topic_votes (
    user_id VARCHAR(255) NOT NULL,
    topic_id VARCHAR(255) REFERENCES topics(id),
    vote_type VARCHAR(20) CHECK (vote_type IN ('credible', 'controversial')),
    PRIMARY KEY (user_id, topic_id)
);

-- Poll Options Table
CREATE TABLE IF NOT EXISTS poll_options (
    id VARCHAR(255) PRIMARY KEY,
    topic_id VARCHAR(255) REFERENCES topics(id),
    text TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0
);

-- Poll Votes Table
CREATE TABLE IF NOT EXISTS poll_votes (
    user_id VARCHAR(255) NOT NULL,
    topic_id VARCHAR(255) REFERENCES topics(id),
    option_id VARCHAR(255) REFERENCES poll_options(id),
    PRIMARY KEY (user_id, topic_id)
);

-- Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    user_id VARCHAR(255) NOT NULL,
    topic_id VARCHAR(255) REFERENCES topics(id),
    PRIMARY KEY (user_id, topic_id)
);

-- ==========================================
-- 2. INSERT SAMPLE DATA
-- ==========================================

-- 1. Science Topic (Discussion)
INSERT INTO topics (id, title, description, category, author_name, timestamp, credible_votes, controversial_votes, type) VALUES
('t_sci_1', '人類大腦其實只使用了 10% 的潛能？', '這是一個流傳已久的說法，電影《露西》更是強化了這個概念。聲稱如果我們能開發剩餘的 90%，就能獲得超能力。但在神經科學掃描下，大腦是否真的有大部分區域處於休眠狀態？', 'Science', '腦科學愛好者', 1715400000000, 12, 85, 'discussion');

INSERT INTO comments (id, topic_id, author_id, author_name, author_avatar, content, upvotes, downvotes, timestamp, type, stance) VALUES
('c_sci_1_1', 't_sci_1', 'u2', 'Dr. Strange', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrStrange', '這完全是偽科學。fMRI 掃描顯示，即使在睡覺時，大腦的大部分區域也是活躍的。', 45, 2, 1715401000000, 'refutation', 'oppose');

-- 2. Health Topic (Poll Sample)
INSERT INTO topics (id, title, description, category, author_name, timestamp, type) VALUES
('t_health_poll', '哪種運動對心血管健康效益最高？', '大家覺得呢？', 'Health', '健身教練', 1715470000000, 'poll');

INSERT INTO poll_options (id, topic_id, text, vote_count) VALUES
('opt_1', 't_health_poll', '慢跑 / 跑步', 15),
('opt_2', 't_health_poll', '游泳', 28),
('opt_3', 't_health_poll', '高強度間歇 (HIIT)', 10),
('opt_4', 't_health_poll', '重量訓練', 5);

-- ==========================================
-- 注意事項
-- ==========================================
-- 1. 預設管理員帳號會由程式自動創建：
--    使用者名稱: admin
--    密碼: admin
--    
-- 2. 程式啟動時會自動執行以上所有 SQL
--    只需設定 DATABASE_URL 環境變數即可
--
-- 3. 如果要手動匯入，請使用：
--    psql -h 127.0.0.1 -U 使用者名稱 -d 資料庫名稱 -f init.sql
