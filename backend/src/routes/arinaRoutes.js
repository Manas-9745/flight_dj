
const express = require('express');
const router = express.Router();

const MODELS = [
    'gpt-5-mini',
    'gpt-5.6-luna',
    'deepseek-v4-pro'
];

router.post('/chat', async (req, res) => {
    try {
        const { message, model = 'gpt-5-mini' } = req.body;

        if (typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                error: 'Please enter a message.'
            });
        }

        if (Buffer.byteLength(message, 'utf8') > 40000) {
            return res.status(413).json({
                error: 'Message is too long.'
            });
        }

        if (!MODELS.includes(model)) {
            return res.status(400).json({
                error: 'Invalid AI model.'
            });
        }

        const apiKey = process.env.ELEVATE_TEAM_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: 'ARINA AI API key is not configured.'
            });
        }

        const tokenParameter =
            model === 'deepseek-v4-pro'
                ? 'max_tokens'
                : 'max_completion_tokens';

        const payload = {
            model,
            messages: [
                {
                    role: 'system',
                    content: 'You are AeroMate AI, a helpful aviation assistant.'
                },
                {
                    role: 'user',
                    content: message.trim()
                }
            ],
            [tokenParameter]: 3000,
            stream: false
        };

        const response = await fetch(
            'https://elevate1-0.vercel.app/api/ai',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(60000)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('ARINA gateway status:', response.status);

            return res.status(
                response.status === 429 ? 429 :
                    response.status === 403 ? 403 : 502
            ).json({
                error: data.error?.message ||
                    data.message ||
                    'ARINA AI request failed.'
            });
        }

        return res.json({
            reply: data.choices?.[0]?.message?.content || '',
            model,
            usage: data.usage || null
        });

    } catch (error) {
        console.error('ARINA AI error:', error.message);

        return res.status(502).json({
            error: 'Unable to reach ARINA AI. Please try again.'
        });
    }
});

module.exports = router;
