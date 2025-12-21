// Helper functions and APIs for user growth system

// === INVITATION CODE APIS ===

// Generate invitation code (requires reputation >= 5)
export const generateInvitationCode = async (req, res) => {
    const authenticateToken = req.authenticateToken;
    const pool = req.pool;
    const randomBytes = req.randomBytes;

    try {
        const userResult = await pool.query(
            'SELECT reputation FROM users WHERE id = $ 1',
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

        // Generate unique invitation code
        const code = randomBytes(6).toString('hex').toUpperCase();
        const now = Date.now();
        const expiresAt = now + (30 * 24 * 60 * 60 * 1000); //  30 days

        await pool.query(
            'INSERT INTO invitation_codes (code, created_by_user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)',
            [code, req.user.id, now, expiresAt]
        );

        res.json({
            success: true,
            code,
            expiresAt,
            message: '邀請碼生成成功！'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '生成邀請碼失敗' });
    }
};

// Validate invitation code
export const validateInvitationCode = async (req, res) => {
    const pool = req.pool;
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
};
