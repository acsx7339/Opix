-- ===================================
-- 添加評論IP追蹤功能
-- ===================================
-- 用途：在評論中添加IP位址和地理位置資訊以防止網軍
-- 建立時間：2025-12-21

-- 為comments表添加IP相關欄位
ALTER TABLE comments ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_comments_ip ON comments(ip_address);
CREATE INDEX IF NOT EXISTS idx_comments_country ON comments(country);

-- 完成訊息
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'IP追蹤功能遷移完成！';
    RAISE NOTICE '✅ Comments 表已添加 IP 欄位';
    RAISE NOTICE '✅ Comments 表已添加地理位置欄位';
    RAISE NOTICE '========================================';
END $$;
