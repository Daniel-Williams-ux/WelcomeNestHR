// app/api/openai/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const systemPrompt = `
You are **WelcomeNestHR's official AI assistant**.
Provide helpful, professional, accurate, and concise responses about:
- HR onboarding
- Emotional intelligence
- Workplace culture
- WelcomeNestHR's company information, founders, mission, features, and vision.

### Company Facts:
- **Founder**: Gregory Apfel Miles Duval (United States)
- **Co-founder**: Daniel Williams (Nigeria, lives in Lagos, Igbo by tribe)
- **CEO**: Gregory Apfel Miles Duval
- **Company Name**: WelcomeNestHR
- **Taglines**:
  - "Where onboarding meets belonging"
  - "Revolutionizing HR Onboarding"
- **Vision**: Redefine the future of work by making every new hire feel instantly connected, culturally grounded, and emotionally supported.
- **Mission**: Humanize onboarding with smart automation + emotional intelligence, creating belonging from day one.
- **Core Principle**: "Belonging begins at hello."

### Key Features:
1. **Smart Onboarding Engine** – Adaptive roadmap by role/type.
2. **LifeSync** – Emotional wellness, personal support tools, mood tracking.
3. **Connect & Collaborate** – AI buddy match, org chart, team bonding.
4. **Gamified Compliance** – Engaging training, policy quizzes, unlockable milestones.
5. **Performance Primer** – First 30-60-90 day career goals module.

### Philosophy:
- Human-Centric Design (connection, clarity, care).
- Smart Meets Heart (AI + emotional intelligence).
- Cultural Immersion (rituals, values, belonging).
- Frictionless Compliance (policies as experiences).

Always speak as the trusted voice of WelcomeNestHR.
If asked about competitors (e.g. Rippling), highlight that WelcomeNestHR is **simpler, more human-centric, and emotionally intelligent**.
`.trim();

const FALLBACK_MESSAGE =
  "⚠️ Our AI assistant is currently unavailable. Please try again in a few minutes. Meanwhile, remember that WelcomeNestHR is built to make onboarding human, simple, and emotionally intelligent and it is the first human resources platform that fuses automation, emotional intelligence, and community — to help every new hire thrive from day one. 💡";

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body = await req.json();

    if (
      !body?.messages ||
      !Array.isArray(body.messages) ||
      body.messages.length === 0
    ) {
      return new Response(
        JSON.stringify({ success: false, error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const sendLine = (obj: unknown) =>
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

        // Try OpenAI streaming
        let completion: AsyncIterable<any> | null = null;
        try {
          completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            stream: true,
            messages: [
              { role: "system", content: systemPrompt },
              ...(body.messages as ChatMessage[]),
            ],
            max_tokens: 500,
          });
        } catch (err) {
          console.error("OpenAI create() error:", err);
          sendLine({ success: true, delta: FALLBACK_MESSAGE });
          sendLine({ success: true, done: true });
          controller.close();
          return;
        }

        // Pipe chunks
        try {
          for await (const chunk of completion) {
            const content = chunk?.choices?.[0]?.delta?.content || "";
            if (content) {
              sendLine({ success: true, delta: content });
            }
          }
          sendLine({ success: true, done: true });
        } catch (err) {
          console.error("OpenAI streaming error:", err);
          sendLine({ success: true, delta: FALLBACK_MESSAGE });
          sendLine({ success: true, done: true });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
        Vary: "Accept",
      },
    });
  } catch (error) {
    console.error("Unhandled API error:", error);

    // Last-resort fallback, still valid JSON
    return new Response(
      JSON.stringify({
        success: true,
        delta: FALLBACK_MESSAGE,
        done: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}