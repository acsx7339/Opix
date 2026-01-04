import 'dotenv/config'; // Load environment variables from .env file
import express from 'express';
import pg from 'pg';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os'; // Import OS module to get network interfaces
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Default to 3001 as requested by user
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

// --- DATABASE CONFIGURATION ---

// Helper to force 127.0.0.1 (IPv4) because cPanel whitelist usually only covers IPv4,
// but 'localhost' might resolve to ::1 (IPv6) causing "no pg_hba.conf entry" errors.
const getClientConfig = () => {
  let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/truthcircle';

  // Force replace 'localhost' with '127.0.0.1' to match cPanel whitelist
  if (connectionString.includes('@localhost')) {
    console.log("🔧 Converting 'localhost' to '127.0.0.1' to match cPanel whitelist...");
    connectionString = connectionString.replace('@localhost', '@127.0.0.1');
  }

  return {
    connectionString: connectionString,
    ssl: false // Explicitly disable SSL for localhost/cPanel connections
  };
};

const pool = new pg.Pool(getClientConfig());

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

app.use(cors());
app.use(express.json());

// Serve static files from the 'dist' directory (Built React App)
app.use(express.static(path.join(__dirname, 'dist')));

// --- DATABASE INITIALIZATION ---

const INIT_SQL = `
-- Create Tables
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

CREATE TABLE IF NOT EXISTS votes (
    user_id VARCHAR(255) NOT NULL,
    comment_id VARCHAR(255) REFERENCES comments(id),
    vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
    PRIMARY KEY (user_id, comment_id)
);

CREATE TABLE IF NOT EXISTS topic_votes (
    user_id VARCHAR(255) NOT NULL,
    topic_id VARCHAR(255) REFERENCES topics(id),
    vote_type VARCHAR(20) CHECK (vote_type IN ('credible', 'controversial')),
    PRIMARY KEY (user_id, topic_id)
);

-- Poll Specific Tables
CREATE TABLE IF NOT EXISTS poll_options (
    id VARCHAR(255) PRIMARY KEY,
    topic_id VARCHAR(255) REFERENCES topics(id),
    text TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0
);

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
`;

const SEED_DATA_SQL = `
-- 1. Science (Discussion)
INSERT INTO topics (id, title, description, category, author_name, timestamp, credible_votes, controversial_votes, type) VALUES
('t_sci_1', '人類大腦其實只使用了 10% 的潛能？', '這是一個流傳已久的說法，電影《露西》更是強化了這個概念。聲稱如果我們能開發剩餘的 90%，就能獲得超能力。但在神經科學掃描下，大腦是否真的有大部分區域處於休眠狀態？', 'Science', '腦科學愛好者', 1715400000000, 12, 85, 'discussion');

INSERT INTO comments (id, topic_id, author_id, author_name, author_avatar, content, upvotes, downvotes, timestamp, type, stance) VALUES
('c_sci_1_1', 't_sci_1', 'u2', 'Dr. Strange', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrStrange', '這完全是偽科學。fMRI 掃描顯示，即使在睡覺時，大腦的大部分區域也是活躍的。', 45, 2, 1715401000000, 'refutation', 'oppose');

-- 2. Health (Poll Sample)
INSERT INTO topics (id, title, description, category, author_name, timestamp, type) VALUES
('t_health_poll', '哪種運動對心血管健康效益最高？', '大家覺得呢？', 'Health', '健身教練', 1715470000000, 'poll');

INSERT INTO poll_options (id, topic_id, text, vote_count) VALUES
('opt_1', 't_health_poll', '慢跑 / 跑步', 15),
('opt_2', 't_health_poll', '游泳', 28),
('opt_3', 't_health_poll', '高強度間歇 (HIIT)', 10),
('opt_4', 't_health_poll', '重量訓練', 5);
`;

const initializeDatabase = async () => {
  try {
    console.log('⏳ Connecting to database...');
    await pool.query(INIT_SQL);

    // Migrations for new features (Idempotent checks)
    try { await pool.query(`ALTER TABLE topics ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'discussion'`); } catch (e) { }
    try { await pool.query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id VARCHAR(255)`); } catch (e) { }
    try { await pool.query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'general'`); } catch (e) { }
    try { await pool.query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS stance VARCHAR(20) DEFAULT 'neutral'`); } catch (e) { }

    // Seed Initial Topic Data if empty
    const res = await pool.query('SELECT count(*) FROM topics');
    const count = parseInt(res.rows[0].count);

    if (count === 0) {
      console.log('Database is empty. Seeding initial data...');
      await pool.query(SEED_DATA_SQL);
      console.log('Seeding complete.');
    }

    // --- CREATE DEFAULT ADMIN USER ---
    const adminCheck = await pool.query("SELECT * FROM users WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
      console.log('Creating default admin user (admin/admin)...');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin', salt);

      await pool.query(
        `INSERT INTO users (id, email, username, password_hash, avatar_url, is_verified, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'u_admin',
          'admin@truthcircle.com',
          'admin',
          hash,
          'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
          true,
          Date.now()
        ]
      );
    }
    console.log('✅ Database initialization successful');
  } catch (err) {
    console.error(`❌ Database init error: ${err.message}`);

    // SPECIFIC GUIDANCE FOR CPANEL USERS
    if (err.message.includes("no pg_hba.conf entry")) {
      console.error("\n==================================================================================");
      console.error("🔴 cPanel 資料庫連線被拒絕 (ACCESS DENIED)");
      console.error("👉 您的 127.0.0.1 已經在白名單內了！");
      console.error("👉 這表示您需要重啟應用程式 (Restart Node.js App) 讓設定生效。");
      console.error("👉 請回到 cPanel -> 'Setup Node.js App' -> 點擊您的專案 -> 點擊 'Restart'。");
      console.error("==================================================================================\n");
    }
  }
};

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API ROUTES ---

// === INVITATION CODE APIS ===

// Generate invitation code (requires reputation >= 5)
app.post('/api/invitations/generate', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT reputation FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    const user = userResult.rows[0];
    if (user.reputation < 5) {
      return res.status(403).json({
        error: '需要聲望 >= 5 才能生成邀請碼',
        currentReputation: user.reputation,
        requiredReputation: 5
      });
    }

    // Get user level and username
    const levelResult = await pool.query(
      'SELECT user_level, username FROM users WHERE id = $1',
      [req.user.id]
    );
    const userLevel = levelResult.rows[0]?.user_level || 'trainee';
    const username = levelResult.rows[0]?.username || '';

    // Define invitation code limits by level
    const CODE_LIMITS = {
      'trainee': 0,      // 見習生無法生成
      'member': 3,       // 正式會員最多3個
      'expert': 10,      // 專家最多10個
      'moderator': 20,   // 版主最多20個
      'admin': 999       // 管理員無限
    };


    // Check if user is system admin (unlimited codes)
    const isAdmin = username === 'admin' || userLevel === 'admin';
    const maxCodes = isAdmin ? 999 : (CODE_LIMITS[userLevel] || 0);

    // Check if trainee/novice
    if (userLevel === 'trainee' || userLevel === 'novice') {
      return res.status(403).json({
        error: '見習生無法生成邀請碼',
        message: '註冊滿3天後自動升級為正式會員即可生成邀請碼'
      });
    }

    // Count active codes (unused and not expired)
    const activeCodesResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM invitation_codes 
       WHERE created_by_user_id = $1 
       AND is_used = false 
       AND expires_at > $2`,
      [req.user.id, Date.now()]
    );

    const activeCodesCount = parseInt(activeCodesResult.rows[0].count);

    // Check if reached limit
    if (activeCodesCount >= maxCodes) {
      return res.status(403).json({
        error: `已達到邀請碼上限（${maxCodes}個）`,
        message: '請等待現有邀請碼被使用或過期後再生成',
        activeCodes: activeCodesCount,
        maxCodes: maxCodes
      });
    }


    // Generate unique invitation code
    const code = randomBytes(6).toString('hex').toUpperCase();
    const now = Date.now();
    const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 days

    await pool.query(
      'INSERT INTO invitation_codes (code, created_by_user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)',
      [code, req.user.id, now, expiresAt]
    );

    res.json({
      success: true,
      code,
      expiresAt,
      message: '邀請碼生成成功！',
      activeCodes: activeCodesCount + 1,
      maxCodes: maxCodes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '生成邀請碼失敗' });
  }
});

// Validate invitation code
app.post('/api/invitations/validate', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: '請提供邀請碼' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM invitation_codes WHERE code = $1',
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.json({ valid: false, error: '邀請碼不存在' });
    }

    const invite = result.rows[0];

    if (invite.is_used) {
      return res.json({ valid: false, error: '此邀請碼已被使用' });
    }

    if (Date.now() > invite.expires_at) {
      return res.json({ valid: false, error: '邀請碼已過期' });
    }

    res.json({ valid: true, message: '邀請碼有效' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '驗證邀請碼失敗' });
  }
});

// Get my invitation codes
app.get('/api/invitations/my-codes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        ic.code, 
        ic.created_at, 
        ic.used_at, 
        ic.is_used, 
        ic.expires_at,
        u.username as used_by_username
       FROM invitation_codes ic
       LEFT JOIN users u ON ic.used_by_user_id = u.id
       WHERE ic.created_by_user_id = $1 
       ORDER BY ic.created_at DESC`,
      [req.user.id]
    );

    // Transform to match frontend expectations
    const codes = result.rows.map(row => ({
      code: row.code,
      created_at: row.created_at,
      expires_at: row.expires_at,
      used: row.is_used,
      used_by_username: row.used_by_username
    }));

    res.json({ codes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '獲取邀請碼失敗' });
  }
});

// === AUTH ROUTES ===

// 1. REGISTER (Modified to require invitation code)
app.post('/api/auth/register', async (req, res) => {
  const { email, password, username, invitationCode } = req.body;

  if (!email || !password || !username || !invitationCode) {
    return res.status(400).json({ error: '所有欄位皆為必填（包含邀請碼）' });
  }

  try {
    // Check user count for Early Access (First 50 users free)
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(countResult.rows[0].count);
    const limit = 50;
    const isEarlyAccess = userCount < limit;

    let invite = null;

    if (invitationCode) {
      // Validate provided invitation code (even if optional)
      const inviteResult = await pool.query(
        'SELECT * FROM invitation_codes WHERE code = $1',
        [invitationCode.toUpperCase()]
      );

      if (inviteResult.rows.length === 0) {
        return res.status(400).json({ error: '邀請碼不存在' });
      }

      invite = inviteResult.rows[0];

      if (invite.is_used) {
        return res.status(400).json({ error: '此邀請碼已被使用' });
      }

      if (Date.now() > invite.expires_at) {
        return res.status(400).json({ error: '邀請碼已過期' });
      }
    } else if (!isEarlyAccess) {
      // Required if not early access
      return res.status(400).json({ error: '目前為邀請制，請輸入邀請碼' });
    }



    if (invite.is_used) {
      return res.status(400).json({ error: '此邀請碼已被使用' });
    }

    if (Date.now() > invite.expires_at) {
      return res.status(400).json({ error: '邀請碼已過期' });
    }

    // Check existing users
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: '此 Email 已被註冊' });
    }

    const usernameCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (usernameCheck.rows.length > 0) {
      return res.status(409).json({ error: '此使用者名稱已被使用' });
    }

    const id = `u_${Date.now()}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = randomBytes(32).toString('hex');
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    // Create user with invited_by_user_id (null if no invite)
    await pool.query(
      `INSERT INTO users (id, email, username, password_hash, avatar_url, verification_token, created_at, invited_by_user_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, email, username, hashedPassword, avatarUrl, verificationToken, Date.now(), invite ? invite.created_by_user_id : null]
    );

    // Mark invitation code as used if provided
    if (invite) {
      await pool.query(
        'UPDATE invitation_codes SET is_used = true, used_by_user_id = $1, used_at = $2 WHERE code = $3',
        [id, Date.now(), invitationCode.toUpperCase()]
      );
    }

    res.json({ success: true, message: '註冊成功！' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '註冊失敗' });
  }
});

// 3. REGISTRATION STATUS (Early Access)
app.get('/api/auth/registration-status', async (req, res) => {
  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const count = parseInt(countResult.rows[0].count);
    const limit = 50;

    res.json({
      invitationRequired: count >= limit,
      remainingSlots: Math.max(0, limit - count),
      isEarlyAccess: count < limit
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '無法取得註冊狀態' });
  }
});

// 4. LOGIN
app.post('/api/auth/verify', async (req, res) => {
  res.json({ success: true, message: 'Verification skipped for demo.' });
});

// 3. LOGIN (Modified to track login count)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: '使用者名稱或密碼錯誤' });
    }

    const user = result.rows[0];

    // Check if banned
    if (user.is_banned) {
      return res.status(403).json({
        error: '此帳號已被封鎖',
        reason: user.ban_reason
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: '使用者名稱或密碼錯誤' });
    }

    // Update login count (once per day)
    const today = new Date().toISOString().split('T')[0];
    const lastLoginDate = user.last_login_date ? new Date(user.last_login_date).toISOString().split('T')[0] : null;

    let newLoginCount = user.login_count;
    if (lastLoginDate !== today) {
      await pool.query(
        'UPDATE users SET login_count = login_count + 1, last_login_date = $1 WHERE id = $2',
        [today, user.id]
      );
      newLoginCount += 1;
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar_url,
        email: user.email,
        level: user.user_level,
        reputation: user.reputation,
        loginCount: newLoginCount
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '登入失敗' });
  }
});

// 4. ME
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, avatar_url, user_level, reputation, login_count FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.sendStatus(404);
    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar_url,
        email: user.email,
        level: user.user_level,
        reputation: user.reputation,
        loginCount: user.login_count
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Auth check failed' });
  }
});

// 5. FORGOT PASSWORD - Request password reset
app.post('/api/auth/forgot-password', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: '請輸入使用者名稱' });
  }

  try {
    // Check if user exists by username
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    // Always return success to prevent username enumeration (though less sensitive than email)
    if (userResult.rows.length === 0) {
      return res.json({ success: true, message: '如果該使用者存在，重置連結已發送至註冊信箱' });
    }

    const user = userResult.rows[0];

    if (!user.email) {
      // Should not happen if email is required, but good safety check
      return res.json({ success: true, message: '如果該使用者存在，重置連結已發送至註冊信箱' });
    }

    // Generate reset token (random 32-byte hex string)
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 3600000; // 1 hour from now

    // Save token to database
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetTokenExpires, user.id]
    );

    // Determine domain based on NODE_ENV if DOMAIN is not explicitly set
    let domain = process.env.DOMAIN;
    if (!domain) {
      if (process.env.NODE_ENV === 'production') {
        domain = 'https://open.pc-baby.com';
      } else {
        domain = 'http://localhost:8081';
      }
    }

    // Create reset URL
    const resetUrl = `${domain}/reset-password/${resetToken}`;

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'open.pc-baby.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true' || true,
      auth: {
        user: process.env.SMTP_USER || 'admin@open.pc-baby.com',
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'admin@open.pc-baby.com',
      to: user.email, // Send to the user's registered email
      subject: 'Opix 密碼重置請求',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Opix 密碼重置</h2>
          <p>您好 <strong>${user.username}</strong>，</p>
          <p>我們收到了您的密碼重置請求。請點擊以下連結重置您的密碼：</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              重置密碼
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            此連結將在<strong>1小時</strong>後失效。
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            如果您沒有提出密碼重置請求，請忽略此郵件。
          </p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px;">
            直接複製連結：<br>
            <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; display: block; margin-top: 8px; word-break: break-all;">${resetUrl}</code>
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✓ Password reset email sent to:', user.email);

    res.json({ success: true, message: '如果該使用者存在，重置連結已發送至註冊信箱' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: '發送重置郵件失敗，請稍後再試' });
  }
});

// 6. RESET PASSWORD - Verify token and reset password
app.post('/api/auth/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: '密碼至少需要6個字元' });
  }

  try {
    // 1. First, find user just by token (to distinguishing between invalid token vs expired)
    const tokenResult = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1',
      [token]
    );

    if (tokenResult.rows.length === 0) {
      console.log('❌ Password reset failed: Token not found:', token);
      return res.status(400).json({ error: '重置連結無效（可能已被使用或無效）' });
    }

    const user = tokenResult.rows[0];
    const now = Date.now();
    const expires = parseInt(user.reset_token_expires);

    console.log(`ℹ️ Verifying token for user ${user.username}`);
    console.log(`   Current time: ${now}`);
    console.log(`   Expires time: ${expires}`);
    console.log(`   Remaining: ${(expires - now) / 1000 / 60} minutes`);

    // 2. Check expiry
    if (now > expires) {
      console.log('❌ Password reset failed: Token expired');
      return res.status(400).json({ error: '重置連結已過期，請重新申請' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ success: true, message: '密碼重置成功！請使用新密碼登入' });
  } catch (err) {
    console.error('Password reset verification error:', err);
    res.status(500).json({ error: '密碼重置失敗，請稍後再試' });
  }
});

// Get user profile with full details
app.get('/api/users/me/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, avatar_url, user_level, reputation, login_count, 
                    invited_by_user_id, created_at 
             FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.sendStatus(404);
    }

    const user = result.rows[0];
    const daysRegistered = Math.floor((Date.now() - user.created_at) / (1000 * 60 * 60 * 24));

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar_url,
        level: user.user_level,
        reputation: user.reputation,
        loginCount: user.login_count,
        daysRegistered
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '獲取個人資料失敗' });
  }
});

// Check board access permission
app.post('/api/boards/check-access', authenticateToken, async (req, res) => {
  const { category } = req.body;

  try {
    // Get board requirements
    const reqResult = await pool.query(
      'SELECT min_level, min_reputation, min_login_count FROM board_requirements WHERE board_category = $1',
      [category]
    );

    if (reqResult.rows.length === 0) {
      // No requirements = free access
      return res.json({ canAccess: true });
    }

    const requirements = reqResult.rows[0];

    // Get user data
    const userResult = await pool.query(
      'SELECT user_level, reputation, login_count FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    const user = userResult.rows[0];

    // Admin always has access
    if (user.user_level === 'admin' || user.username === 'admin') {
      return res.json({ canAccess: true });
    }

    // Check requirements
    const checks = {
      canAccess: true,
      missingRequirements: []
    };

    if (requirements.min_login_count && user.login_count < requirements.min_login_count) {
      checks.canAccess = false;
      checks.missingRequirements.push({
        type: 'loginCount',
        required: requirements.min_login_count,
        current: user.login_count
      });
    }

    if (requirements.min_reputation && user.reputation < requirements.min_reputation) {
      checks.canAccess = false;
      checks.missingRequirements.push({
        type: 'reputation',
        required: requirements.min_reputation,
        current: user.reputation
      });
    }

    res.json(checks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '檢查權限失敗' });
  }
});


// --- TOPIC & CONTENT ROUTES ---

app.get('/api/topics', async (req, res) => {
  const currentUserId = req.query.userId;

  try {
    const topicsResult = await pool.query('SELECT * FROM topics ORDER BY timestamp DESC');
    const topics = topicsResult.rows;

    const commentsResult = await pool.query('SELECT * FROM comments ORDER BY timestamp ASC');
    const allComments = commentsResult.rows;

    const optionsResult = await pool.query('SELECT * FROM poll_options');
    const allOptions = optionsResult.rows;

    let userCommentVotes = [];
    let userTopicVotes = [];
    let userPollVotes = [];
    let userFavorites = [];

    if (currentUserId) {
      try {
        const cvResult = await pool.query('SELECT * FROM votes WHERE user_id = $1', [currentUserId]);
        userCommentVotes = cvResult.rows;
        const tvResult = await pool.query('SELECT * FROM topic_votes WHERE user_id = $1', [currentUserId]);
        userTopicVotes = tvResult.rows;
        const pvResult = await pool.query('SELECT * FROM poll_votes WHERE user_id = $1', [currentUserId]);
        userPollVotes = pvResult.rows;
        const favResult = await pool.query('SELECT * FROM favorites WHERE user_id = $1', [currentUserId]);
        userFavorites = favResult.rows.map(f => f.topic_id);
      } catch (e) {
        console.warn("Vote tables might not exist yet", e.message);
      }
    }

    const topicsWithDetails = topics.map(topic => {
      const topicComments = allComments
        .filter(c => c.topic_id === topic.id)
        .map(comment => {
          const vote = userCommentVotes.find(v => v.comment_id === comment.id);
          return {
            ...comment,
            authorId: comment.author_id,
            authorName: comment.author_name,
            authorAvatar: comment.author_avatar,
            timestamp: parseInt(comment.timestamp),
            userVote: vote ? vote.vote_type : undefined,
            parentId: comment.parent_id,
            type: comment.type || 'general',
            stance: comment.stance || 'neutral',
            ipAddress: comment.ip_address // Map snake_case DB field to camelCase API field
          };
        });

      const userTV = userTopicVotes.find(v => v.topic_id === topic.id);

      const topicOptions = allOptions
        .filter(o => o.topic_id === topic.id)
        .map(o => ({
          id: o.id,
          text: o.text,
          voteCount: o.vote_count
        }));
      const userPV = userPollVotes.find(v => v.topic_id === topic.id);
      const isFav = userFavorites.includes(topic.id);

      return {
        ...topic,
        timestamp: parseInt(topic.timestamp),
        category: topic.category,
        authorName: topic.author_name,
        aiAnalysis: topic.ai_analysis,
        isAnalyzing: topic.is_analyzing,
        credibleVotes: topic.credible_votes || 0,
        controversialVotes: topic.controversial_votes || 0,
        type: topic.type || 'discussion',
        userTopicVote: userTV ? userTV.vote_type : undefined,
        options: topicOptions,
        userPollVoteId: userPV ? userPV.option_id : undefined,
        comments: topicComments,
        isFavorite: isFav
      };
    });

    res.json(topicsWithDetails);
  } catch (err) {
    console.error('API Error:', err.message);
    res.status(500).json({ error: 'Database error or not ready' });
  }
});

app.post('/api/topics', authenticateToken, async (req, res) => {
  const { id, title, description, category, authorName, timestamp, type, options } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check board access permission
    const reqResult = await client.query(
      'SELECT min_level, min_reputation, min_login_count FROM board_requirements WHERE board_category = $1',
      [category]
    );

    if (reqResult.rows.length > 0) {
      const requirements = reqResult.rows[0];
      const userResult = await client.query(
        'SELECT user_level, reputation, login_count FROM users WHERE id = $1',
        [req.user.id]
      );

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: '用戶不存在' });
      }

      const user = userResult.rows[0];

      // Check login count requirement (for Politics board)
      if (requirements.min_login_count && user.login_count < requirements.min_login_count) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          error: '權限不足',
          message: `此看板需要登入 ${requirements.min_login_count} 次，您目前登入 ${user.login_count} 次`
        });
      }

      if (requirements.min_reputation && user.reputation < requirements.min_reputation) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          error: '權限不足',
          message: `此看板需要聲望 ${requirements.min_reputation}，您目前聲望 ${user.reputation}`
        });
      }
    }

    // Check daily topic limit (5 per day)
    const today = new Date().toISOString().split('T')[0];
    const topicCountResult = await client.query(
      'SELECT topic_count FROM daily_topic_tracking WHERE user_id = $1 AND topic_date = $2',
      [req.user.id, today]
    );

    let currentCount = 0;
    if (topicCountResult.rows.length > 0) {
      currentCount = topicCountResult.rows[0].topic_count;
    }

    if (currentCount >= 5) {
      await client.query('ROLLBACK');
      return res.status(429).json({
        error: '已達每日發文上限',
        message: '每天最多只能發表 5 篇主題'
      });
    }

    // Create topic
    await client.query(
      'INSERT INTO topics (id, title, description, category, author_name, timestamp, type) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, title, description, category, authorName, timestamp, type || 'discussion']
    );

    if (type === 'poll' && Array.isArray(options)) {
      for (const opt of options) {
        await client.query(
          'INSERT INTO poll_options (id, topic_id, text, vote_count) VALUES ($1, $2, $3, 0)',
          [opt.id, id, opt.text]
        );
      }
    }

    // Update daily topic count
    if (topicCountResult.rows.length > 0) {
      await client.query(
        'UPDATE daily_topic_tracking SET topic_count = topic_count + 1 WHERE user_id = $1 AND topic_date = $2',
        [req.user.id, today]
      );
    } else {
      await client.query(
        'INSERT INTO daily_topic_tracking (user_id, topic_date, topic_count) VALUES ($1, $2, 1)',
        [req.user.id, today]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create topic' });
  } finally {
    client.release();
  }
});

app.post('/api/comments', async (req, res) => {
  const { id, topicId, authorId, authorName, authorAvatar, content, timestamp, parentId, type, stance } = req.body;
  const client = await pool.connect();

  try {
    //Get user's IP address
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'Unknown';

    // Get geolocation data from IP
    let country = null;
    let city = null;
    let region = null;

    try {
      if (ip !== 'Unknown' && !ip.includes('127.0.0.1') && !ip.includes('::1') && !ip.includes('::ffff:127')) {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.status === 'success') {
            country = `${geoData.country} (${geoData.countryCode})`;
            city = geoData.city || null;
            region = geoData.region || null;
          }
        }
      }
    } catch (geoError) {
      console.error('Geolocation lookup failed for comment:', geoError);
      // Continue anyway
    }

    await client.query('BEGIN');
    await client.query(
      'INSERT INTO comments (id, topic_id, author_id, author_name, author_avatar, content, timestamp, parent_id, type, stance, ip_address, country, city, region) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
      [id, topicId, authorId, authorName, authorAvatar, content, timestamp, parentId || null, type || 'general', stance || 'neutral', ip, country, city, region]
    );

    if (stance === 'support') {
      await client.query('UPDATE topics SET credible_votes = credible_votes + 1 WHERE id = $1', [topicId]);
    } else if (stance === 'oppose') {
      await client.query('UPDATE topics SET controversial_votes = controversial_votes + 1 WHERE id = $1', [topicId]);
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create comment' });
  } finally {
    client.release();
  }
});

app.post('/api/topics/:id/analysis', async (req, res) => {
  const { id } = req.params;
  const { analysis } = req.body;
  try {
    await pool.query('UPDATE topics SET ai_analysis = $1, is_analyzing = FALSE WHERE id = $2', [analysis, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update analysis' });
  }
});

app.post('/api/vote', async (req, res) => {
  const { topicId, commentId, userId, type } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingVoteRes = await client.query('SELECT vote_type FROM votes WHERE user_id = $1 AND comment_id = $2', [userId, commentId]);
    const existingVote = existingVoteRes.rows[0];
    const commentRes = await client.query('SELECT upvotes, downvotes FROM comments WHERE id = $1', [commentId]);
    let { upvotes, downvotes } = commentRes.rows[0];

    if (existingVote) {
      if (existingVote.vote_type === 'up') upvotes--;
      if (existingVote.vote_type === 'down') downvotes--;
      await client.query('DELETE FROM votes WHERE user_id = $1 AND comment_id = $2', [userId, commentId]);

      if (existingVote.vote_type !== type) {
        await client.query('INSERT INTO votes (user_id, comment_id, vote_type) VALUES ($1, $2, $3)', [userId, commentId, type]);
        if (type === 'up') upvotes++;
        if (type === 'down') downvotes++;
      }
    } else {
      await client.query('INSERT INTO votes (user_id, comment_id, vote_type) VALUES ($1, $2, $3)', [userId, commentId, type]);
      if (type === 'up') upvotes++;
      if (type === 'down') downvotes++;
    }
    await client.query('UPDATE comments SET upvotes = $1, downvotes = $2 WHERE id = $3', [upvotes, downvotes, commentId]);
    await client.query('COMMIT');
    res.json({ success: true, upvotes, downvotes });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Vote failed' });
  } finally {
    client.release();
  }
});

app.post('/api/topics/vote', async (req, res) => {
  // Keep logic for backward compatibility
  res.json({ success: true });
});

app.post('/api/topics/poll/vote', async (req, res) => {
  const { topicId, optionId, userId } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingVoteRes = await client.query('SELECT option_id FROM poll_votes WHERE user_id = $1 AND topic_id = $2', [userId, topicId]);
    if (existingVoteRes.rows.length > 0) {
      const previousOptionId = existingVoteRes.rows[0].option_id;
      if (previousOptionId === optionId) { await client.query('COMMIT'); return res.json({ success: true }); }
      await client.query('UPDATE poll_options SET vote_count = vote_count - 1 WHERE id = $1', [previousOptionId]);
      await client.query('UPDATE poll_votes SET option_id = $1 WHERE user_id = $2 AND topic_id = $3', [optionId, userId, topicId]);
    } else {
      await client.query('INSERT INTO poll_votes (user_id, topic_id, option_id) VALUES ($1, $2, $3)', [userId, topicId, optionId]);
    }
    await client.query('UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = $1', [optionId]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Poll Vote failed' });
  } finally {
    client.release();
  }
});

app.post('/api/favorite', async (req, res) => {
  const { topicId, userId } = req.body;
  const client = await pool.connect();
  try {
    const resCheck = await client.query('SELECT * FROM favorites WHERE user_id = $1 AND topic_id = $2', [userId, topicId]);
    if (resCheck.rows.length > 0) {
      await client.query('DELETE FROM favorites WHERE user_id = $1 AND topic_id = $2', [userId, topicId]);
      res.json({ success: true, isFavorite: false });
    } else {
      await client.query('INSERT INTO favorites (user_id, topic_id) VALUES ($1, $2)', [userId, topicId]);
      res.json({ success: true, isFavorite: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Favorite toggle failed' });
  } finally {
    client.release();
  }
});

// CATCH-ALL ROUTE for React Router (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Handle 'EADDRINUSE' explicitly
// Contact form endpoint - receives feedback messages and sends emails
app.post('/api/contact', async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: '留言內容不能為空' });
    }

    // Get user's IP address
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'Unknown';

    // Get geolocation data from IP (using free ip-api.com service)
    let country = 'Unknown';
    let city = 'Unknown';
    let region = 'Unknown';

    try {
      if (ip !== 'Unknown' && !ip.includes('127.0.0.1') && !ip.includes('::1')) {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.status === 'success') {
            country = `${geoData.country} (${geoData.countryCode})`;
            city = geoData.city || 'Unknown';
            region = geoData.region || 'Unknown';
          }
        }
      }
    } catch (geoError) {
      console.error('Geolocation lookup failed:', geoError);
      // Continue anyway, just use Unknown for location
    }

    // Log the contact message with IP info
    console.log('===== 新的聯絡留言 =====');
    console.log('收件時間:', new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }));
    console.log('用戶Email:', email || '未提供');
    console.log('IP位址:', ip);
    console.log('國家:', country);
    console.log('城市:', city);
    console.log('留言內容:', message);
    console.log('========================');

    // Create nodemailer transporter with A2 Hosting SMTP settings
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'open.pc-baby.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true' || true, // Use SSL/TLS
      auth: {
        user: process.env.SMTP_USER || 'admin@open.pc-baby.com',
        pass: process.env.SMTP_PASS // Must be set in .env file
      }
    });

    // Email content with IP and country information
    const mailOptions = {
      from: process.env.SMTP_FROM || 'admin@open.pc-baby.com',
      to: process.env.SMTP_TO || 'acsx7339@gmail.com',
      subject: 'TruthCircle 用戶留言',
      text: `收到新的用戶留言：\n\n用戶Email: ${email || '未提供'}\nIP位址: ${ip}\n國家: ${country}\n城市: ${city}\n地區: ${region}\n\n留言內容:\n${message}\n\n時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">TruthCircle 用戶留言</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>用戶Email:</strong> ${email || '未提供'}</p>
            
            <div style="background-color: #fef3c7; padding: 12px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 5px 0;"><strong>🌍 IP位址:</strong> <code style="background-color: white; padding: 2px 6px; border-radius: 3px;">${ip}</code></p>
              <p style="margin: 5px 0;"><strong>🗺️ 國家:</strong> ${country}</p>
              <p style="margin: 5px 0;"><strong>📍 城市:</strong> ${city}</p>
              <p style="margin: 5px 0;"><strong>📌 地區:</strong> ${region}</p>
            </div>
            
            <p><strong>留言內容:</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p style="margin-top: 15px; color: #6b7280;"><strong>時間:</strong> ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
          </div>
          <p style="color: #9ca3af; font-size: 12px;">⚠️ 此資訊有助於識別可疑的網軍活動</p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log('✓ Email sent successfully to:', process.env.SMTP_TO || 'acsx7339@gmail.com');

    res.json({
      success: true,
      message: '留言已收到，我們會盡快回覆'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: '發送失敗，請稍後再試' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);

  // Find LAN IP
  const nets = os.networkInterfaces();
  const results = Object.create(null); // Or just use empty object {}

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  const localIp = results['en0']?.[0] || results['eth0']?.[0] || 'localhost';
  console.log(`👉 Local:   http://localhost:${port}`);
  console.log(`👉 Network: http://${localIp}:${port} (Access from other devices)`);

  console.log(`👉 If on cPanel, ensure your domain (${process.env.DOMAIN || 'your-domain.com'}) is set up correctly in 'Domains' section.`);
  initializeDatabase();
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`⚠️  ERROR: Port ${port} is already in use.`);
    console.error(`This likely means the server is ALREADY running in the background (cPanel/Passenger usually starts it automatically).`);
    process.exit(1);
  } else {
    throw e;
  }
});