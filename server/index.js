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
      try { await pool.query(`ALTER TABLE topics ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'discussion'`); } catch (e) {}
      try { await pool.query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id VARCHAR(255)`); } catch (e) {}
      try { await pool.query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'general'`); } catch (e) {}
      try { await pool.query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS stance VARCHAR(20) DEFAULT 'neutral'`); } catch (e) {}

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

// 1. REGISTER
app.post('/api/auth/register', async (req, res) => {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
        return res.status(400).json({ error: '所有欄位皆為必填' });
    }

    try {
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

        await pool.query(
            'INSERT INTO users (id, email, username, password_hash, avatar_url, verification_token, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, email, username, hashedPassword, avatarUrl, verificationToken, Date.now()]
        );

        res.json({ success: true, message: '註冊成功！' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '註冊失敗' });
    }
});

// 2. VERIFY EMAIL
app.post('/api/auth/verify', async (req, res) => {
    res.json({ success: true, message: 'Verification skipped for demo.' });
});

// 3. LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: '使用者名稱或密碼錯誤' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: '使用者名稱或密碼錯誤' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: { id: user.id, username: user.username, avatar: user.avatar_url, email: user.email }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '登入失敗' });
    }
});

// 4. ME
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, avatar_url FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.sendStatus(404);
        const user = result.rows[0];
        res.json({ user: { id: user.id, username: user.username, avatar: user.avatar_url, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: 'Auth check failed' });
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
            stance: comment.stance || 'neutral'
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

app.post('/api/topics', async (req, res) => {
  const { id, title, description, category, authorName, timestamp, type, options } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
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
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO comments (id, topic_id, author_id, author_name, author_avatar, content, timestamp, parent_id, type, stance) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [id, topicId, authorId, authorName, authorAvatar, content, timestamp, parentId || null, type || 'general', stance || 'neutral']
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