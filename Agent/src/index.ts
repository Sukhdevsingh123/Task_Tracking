

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AiSdkAgent, AIUISDKMessage } from '@nullshot/agent';
import { streamText, type LanguageModel, type Provider, tool } from 'ai';
import { z } from 'zod';
import { createAnthropic } from '@ai-sdk/anthropic';

// Instantiate application with Hono
const app = new Hono<{ Bindings: Env }>();

app.use(
    '*',
    cors({
        origin: '*', 
        allowMethods: ['POST', 'GET', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
        exposeHeaders: ['X-Session-Id'],
        maxAge: 86400,
    }),
);

// === 1. ROUTER ===
app.post('/agent/chat/:sessionId?', async (c) => {
    const { AGENT } = c.env;
    let sessionIdStr = c.req.param('sessionId');
    if (!sessionIdStr || sessionIdStr === '') sessionIdStr = crypto.randomUUID();

    const id = AGENT.idFromName(sessionIdStr);
    const stub = AGENT.get(id);
    return stub.fetch(c.req.raw);
});

// === 2. THE AI CATEGORIZER AGENT ===
export class SimplePromptAgent extends AiSdkAgent<Env> {
    constructor(state: DurableObjectState, env: Env) {
         let provider: Provider;
         let model: LanguageModel;
         
         switch (env.AI_PROVIDER) {
           case "anthropic":
             provider = createAnthropic({ apiKey: env.AI_PROVIDER_API_KEY });
             model = provider.languageModel("claude-sonnet-4-20250514");
             break;
           default:
             throw new Error(`Unsupported AI provider: ${env.AI_PROVIDER}`);
         }
     
         super(state, env, model, []);
    }

    // Manual Fetch Handler
    async fetch(request: Request): Promise<Response> {
        try {
            const url = new URL(request.url);
            const body = await request.json<AIUISDKMessage>();
            const sessionId = url.pathname.split('/').pop() || crypto.randomUUID();
            return await this.processMessage(sessionId, body);
        } catch (error: any) {
            return new Response(`Agent Error: ${error.message}`, { status: 500 });
        }
    }

    async processMessage(sessionId: string, messages: AIUISDKMessage): Promise<Response> {
        
        // 1. Force AI to output JSON so frontend can read it
        const systemPrompt = `
        You are an AI Smart Contract Middleware.
        Analyze the user's expense.
        
        RULES:
        1. You MUST return ONLY a JSON object. No markdown, no conversation.
        2. Format:
        {
            "amount": <integer_only_example_20>,
            "category": "<string_example_Food>",
            "description": "<string_short_summary>",
            "analysis": "<string_friendly_message_to_user>"
        }
        3. If no expense is detected, return { "error": "No expense detected" }
        `;

        // 2. We use generateText (non-streaming) for easier JSON handling in this step
        // (You might need to import generateText from 'ai' at the top)
        const result = await streamText({
            model: this.model,
            messages: messages.messages,
            system: systemPrompt,
        });

        return result.toTextStreamResponse();
    }
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        return app.fetch(request, env, ctx);
    },
};




