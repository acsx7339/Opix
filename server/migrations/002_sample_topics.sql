-- 插入測試主題到各個分類
-- 為了測試會員成長系統，我們使用admin用戶作為作者

-- 健康與醫療分類 (Health)
INSERT INTO topics (id, title, description, category, author_name, timestamp, type) VALUES
('t_health_1', '每天應該喝多少水才足夠？', '最近看到很多說法，有人說8杯水，有人說看體重計算，到底哪個才對？', 'Health', 'admin', EXTRACT(EPOCH FROM NOW() - INTERVAL '2 days') * 1000, 'discussion'),
('t_health_2', '間歇性斷食真的健康嗎？', '168斷食法最近很紅，已經實行一個月了，想聽聽大家的經驗和看法', 'Health', 'admin', EXTRACT(EPOCH FROM NOW() - INTERVAL '5 days') * 1000, 'discussion'),
('t_health_3', '你認為最有效的運動方式是？', '想開始運動但不知道選哪種', 'Health', 'admin', EXTRACT(EPOCH FROM NOW() - INTERVAL '1 day') * 1000, 'poll');

-- 為投票主題添加選項
INSERT INTO poll_options (id, topic_id, text, vote_count) VALUES
('t_health_3_opt_1', 't_health_3', '跑步', 0),
('t_health_3_opt_2', 't_health_3', '重訓', 0),
('t_health_3_opt_3', 't_health_3', '游泳', 0),
('t_health_3_opt_4', 't_health_3', '瑜珈/皮拉提斯', 0);

-- 科技與3C分類 (Technology)
INSERT INTO topics (id, title, description, category, author_name, timestamp, type) VALUES
('t_tech_1', 'AI會取代程式設計師嗎？', 'ChatGPT和Copilot越來越強大，未來工程師還有價值嗎？', 'Technology', 'admin', EXTRACT(EPOCH FROM NOW() - INTERVAL '3 days') * 1000, 'discussion'),
('t_tech_2', '2024年該買哪款旗艦手機？', 'iPhone 15 Pro vs Samsung S24 Ultra，該選哪個？', 'Technology', 'admin', EXTRACT(EPOCH FROM NOW() - INTERVAL '6 hours') * 1000, 'discussion'),
('t_tech_3', '你最常使用的作業系統是？', '想統計一下大家的使用習慣', 'Technology', 'admin', EXTRACT(EPOCH FROM NOW() - INTERVAL '4 days') * 1000, 'poll'),
('t_tech_4', 'MacBook vs Windows筆電選擇困難', '工作需要買新筆電，預算10萬內，求推薦', 'Technology', 'admin', EXTRACT(EPOCH FROM NOW() - INTERVAL '12 hours') * 1000, 'discussion');

INSERT INTO poll_options (id, topic_id, text, vote_count) VALUES
('t_tech_3_opt_1', 't_tech_3', 'Windows', 0),
('t_tech_3_opt_2', 't_tech_3', 'macOS', 0),
('t_tech_3_opt_3', 't_tech_3', 'Linux', 0),
('t_tech_3_opt_4', 't_tech_3', '都用/雙系統', 0);

-- 經濟與理財分類 (Economics)
INSERT INTO topics (id, title, description, category, author_name, timestamp, type) VALUES
('t_econ_1', '2024年該投資什麼？', '台股、美股、ETF還是定存？請大家分享看法', 'Economics', 'admin', EXTRACT(EPOCH FROM NOW() - INTERVAL '1 day') * 1000, 'discussion'),
('t_econ_2', '年輕人應該先買房還是先投資？', '30歲存了200萬，該拿去買房頭期款還是繼續投資？', 'Economics', 'admin', EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days') * 1000, 'discussion'),
('t_econ_3', '你的每月儲蓄率多少？', '想了解大家的理財習慣', 'Economics', 'admin', EXTRACT(EPOCH FROM NOW() - INTERVAL '2 days') * 1000, 'poll');

INSERT INTO poll_options (id, topic_id, text, vote_count) VALUES
('t_econ_3_opt_1', 't_econ_3', '10%以下', 0),
('t_econ_3_opt_2', 't_econ_3', '10-30%', 0),
('t_econ_3_opt_3', 't_econ_3', '30-50%', 0),
('t_econ_3_opt_4', 't_econ_3', '50%以上', 0);

-- 政治與社會分類 (Politics)
INSERT INTO topics (id, title, description, category, author_name, timestamp, type) VALUES
('t_pol_1', '台灣的教育制度需要改革嗎？', '108課綱實施後，學生壓力似乎更大了？', 'Politics', 'admin', EXTRACT(EPOCH FROM NOW() - INTERVAL '8 days') * 1000, 'discussion'),
('t_pol_2', '如何解決台灣的少子化問題？', '生育率持續下降，政府補助真的有用嗎？', 'Politics', 'admin', EXTRACT(EPOCH FROM NOW() - INTERVAL '10 days') * 1000, 'discussion'),
('t_pol_3', '你支持週休三日嗎？', '有些國家開始試行週休三日制度', 'Politics', 'admin', EXTRACT(EPOCH FROM NOW() - INTERVAL '15 days') * 1000, 'poll'),
('t_pol_4', '台灣應該發展核能嗎？', '綠能 vs 核能的爭議一直存在，大家怎麼看？', 'Politics', 'admin', EXTRACT(EPOCH FROM NOW() - INTERVAL '20 days') * 1000, 'discussion');

INSERT INTO poll_options (id, topic_id, text, vote_count) VALUES
('t_pol_3_opt_1', 't_pol_3', '非常支持', 0),
('t_pol_3_opt_2', 't_pol_3', '有條件支持', 0),
('t_pol_3_opt_3', 't_pol_3', '不支持', 0);

-- 添加一些留言讓主題看起來更活躍
INSERT INTO comments (id, topic_id, author_id, author_name, author_avatar, content, timestamp, type, stance, upvotes, downvotes) VALUES
('c_health_1_1', 't_health_1', 'admin', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', '我覺得要看個人體重和活動量，不能一概而論', EXTRACT(EPOCH FROM NOW() - INTERVAL '1 day') * 1000, 'general', 'neutral', 0, 0),
('c_tech_1_1', 't_tech_1', 'admin', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 'AI是輔助工具，不會完全取代，但會改變工作方式', EXTRACT(EPOCH FROM NOW() - INTERVAL '2 days') * 1000, 'general', 'support', 0, 0),
('c_econ_1_1', 't_econ_1', 'admin', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', '分散投資比較保險，不要all in單一標的', EXTRACT(EPOCH FROM NOW() - INTERVAL '1 day') * 1000, 'supplement', 'neutral', 0, 0);
