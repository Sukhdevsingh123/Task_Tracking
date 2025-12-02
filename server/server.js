
require('dotenv').config();

const http = require('http');
const { Anthropic } = require('@anthropic-ai/sdk');

const PORT = 8787;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;


if (!ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY is missing in .env file");
    process.exit(1);
}

const anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `
You are an AI Smart Contract Middleware.
Analyze the user's expense.

RULES:
1. You MUST return ONLY a JSON object. No markdown, no conversation.
2. The "analysis" field MUST follow this strict pattern: 
   "Expense recorded! <Brief context>. <Give a specific money-saving tip or advice for this category>."

3. Format:
{
    "amount": <integer_only>,
    "category": "<category_name>",
    "description": "<short_summary>",
    "analysis": "<friendly_message_with_advice>"
}
4. If no expense is detected, return { "error": "No expense detected" }
`;

const server = http.createServer(async (req, res) => {
    // CORS Setup
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const urlParts = req.url.split('/');
    
    if (req.method === 'POST' && urlParts[1] === 'agent' && urlParts[2] === 'chat') {
        let body = '';

        req.on('data', chunk => { body += chunk.toString(); });

        req.on('end', async () => {
            try {
                const parsedBody = JSON.parse(body);
                const messages = parsedBody.messages || [];

                const response = await anthropic.messages.create({
                    model: "claude-sonnet-4-20250514", 
                    max_tokens: 1024,
                    temperature: 0,
                    system: SYSTEM_PROMPT,
                    messages: messages.map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                });

                const aiText = response.content[0].text;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(aiText);

            } catch (error) {
                console.error("Error processing request:", error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: error.message,
                    type: error.type 
                }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});