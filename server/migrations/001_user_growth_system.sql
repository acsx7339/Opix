-- ===================================
-- TruthCircle 用戶成長系統 - 資料庫遷移
-- ===================================
-- 用途：添加邀請碼、等級、聲望、登入追蹤等欄位
-- 建立時間：2025-12-21
-- 設計：4等級系統，聲望僅來自upvote，政治看板需登入30次

-- -----------------------------------
-- 1. 擴充 users 表
-- -----------------------------------

ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by_user_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_level VARCHAR(20) DEFAULT 'trainee';
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_topic_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_topic_date DATE;

-- 為新欄位建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_users_level ON users(user_level);
CREATE INDEX IF NOT EXISTS idx_users_reputation ON users(reputation);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by_user_id);

-- 添加約束：等級只能是指定值
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_level_check;
ALTER TABLE users ADD CONSTRAINT users_level_check 
    CHECK (user_level IN ('trainee', 'member', 'expert', 'moderator'));

-- -----------------------------------
-- 2. 建立 invitation_codes 表
-- -----------------------------------

CREATE TABLE IF NOT EXISTS invitation_codes (
    code VARCHAR(50) PRIMARY KEY,
    created_by_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at BIGINT NOT NULL,
    used_by_user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    used_at BIGINT,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at BIGINT NOT NULL
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_invitation_codes_creator ON invitation_codes(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_user ON invitation_codes(used_by_user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_used ON invitation_codes(is_used);

-- -----------------------------------
-- 3. 建立 board_requirements 表
-- -----------------------------------

CREATE TABLE IF NOT EXISTS board_requirements (
    board_category VARCHAR(50) PRIMARY KEY,
    min_level VARCHAR(20),
    min_reputation INTEGER DEFAULT 0,
    min_login_count INTEGER DEFAULT 0,
    description TEXT
);

-- 插入初始看板門檻設定
INSERT INTO board_requirements (board_category, min_level, min_reputation, min_login_count, description) VALUES
    ('Health', NULL, 0, 0, '健康與醫療討論'),
    ('Technology', NULL, 0, 0, '科技與3C討論'),
    ('Economics', NULL, 0, 0, '經濟與理財討論'),
    ('Politics', NULL, 0, 30, '政治與社會討論，需登入30次')
ON CONFLICT (board_category) DO UPDATE SET
    min_level = EXCLUDED.min_level,
    min_reputation = EXCLUDED.min_reputation,
    min_login_count = EXCLUDED.min_login_count,
    description = EXCLUDED.description;

-- -----------------------------------
-- 4. 建立 daily_topic_tracking 表
-- -----------------------------------
-- 用於追蹤每日發文數量（避免超過5篇限制）

CREATE TABLE IF NOT EXISTS daily_topic_tracking (
    user_id VARCHAR(255) NOT NULL,
    topic_date DATE NOT NULL,
    topic_count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, topic_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_daily_topic_date ON daily_topic_tracking(topic_date);

-- -----------------------------------
-- 5. 建立觸發函數：自動更新聲望
-- -----------------------------------
-- 當留言獲得upvote時，自動增加作者聲望

CREATE OR REPLACE FUNCTION update_reputation_on_vote()
RETURNS TRIGGER AS $$
BEGIN
    -- 只有upvote影響聲望
    IF NEW.upvotes > OLD.upvotes THEN
        UPDATE users 
        SET reputation = reputation + (NEW.upvotes - OLD.upvotes)
        WHERE id = NEW.author_id;
    END IF;
    
    -- downvote不影響聲望（僅用於排序）
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器
DROP TRIGGER IF EXISTS trg_update_reputation ON comments;
CREATE TRIGGER trg_update_reputation
    AFTER UPDATE OF upvotes ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_reputation_on_vote();

-- -----------------------------------
-- 6. 建立觸發函數：自動晉升等級
-- -----------------------------------

CREATE OR REPLACE FUNCTION check_and_upgrade_level()
RETURNS TRIGGER AS $$
DECLARE
    days_since_registration INTEGER;
BEGIN
    -- 計算註冊天數
    days_since_registration := FLOOR((EXTRACT(EPOCH FROM NOW()) - NEW.created_at) / 86400);
    
    -- trainee -> member: 註冊滿3天
    IF NEW.user_level = 'trainee' AND days_since_registration >= 3 THEN
        NEW.user_level := 'member';
    END IF;
    
    -- member -> expert: 聲望達100
    IF NEW.user_level = 'member' AND NEW.reputation >= 100 THEN
        NEW.user_level := 'expert';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器（在reputation或login時檢查）
DROP TRIGGER IF EXISTS trg_check_level_upgrade ON users;
CREATE TRIGGER trg_check_level_upgrade
    BEFORE UPDATE OF reputation ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_and_upgrade_level();

-- -----------------------------------
-- 7. 遷移現有用戶資料
-- -----------------------------------
-- 為現有用戶設定預設值

UPDATE users 
SET 
    user_level = 'trainee',
    reputation = 0,
    login_count = 0,
    is_banned = FALSE
WHERE user_level IS NULL OR user_level = '';

-- 為 admin 帳號設定為 moderator
UPDATE users
SET user_level = 'moderator'
WHERE username = 'admin';

-- -----------------------------------
-- 完成訊息
-- -----------------------------------

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '資料庫遷移完成！';
    RAISE NOTICE '✅ Users 表已擴充';
    RAISE NOTICE '✅ Invitation Codes 表已建立';
    RAISE NOTICE '✅ Board Requirements 表已建立';
    RAISE NOTICE '✅ Daily Topic Tracking 表已建立';
    RAISE NOTICE '✅ 聲望自動更新觸發器已建立';
    RAISE NOTICE '✅ 等級自動晉升觸發器已建立';
    RAISE NOTICE '========================================';
END $$;
