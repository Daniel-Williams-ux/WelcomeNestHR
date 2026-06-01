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

type AssistantContext = {
  assistantName?: string;
  audience?: "employee" | "hr";
  moduleName?: string;
  pathname?: string;
};

function buildSystemPrompt(context: AssistantContext) {
  const audience = context.audience === "hr" ? "HR user" : "employee";
  const moduleName = context.moduleName || "Dashboard";

  return `
You are **NestGuide AI**, WelcomeNestHR's role-aware onboarding and people-support assistant.
You are currently helping a ${audience} inside the ${moduleName} module.

Give practical, concise, dashboard-aware help about:
- onboarding next steps
- LifeSync emotional intelligence and support follow-up
- Primer 30-60-90 growth goals and gamification
- compliance and payroll/payslip guidance
- HR announcements, onboarding checklists, and employee support actions
- WelcomeNestHR's mission, culture, features, and vision.

Role behavior:
- If helping an employee, explain what they should do next and when to contact HR. Do not pretend to see private data unless the user provides it.
- If helping HR, help summarize people signals, draft content, suggest follow-ups, and identify what to review. Avoid exposing private journal content or making medical/legal claims.
- If asked for sensitive HR decisions, recommend human review and a compassionate, policy-aligned approach.
- Keep answers actionable and short unless the user asks for detail.

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
}

const FALLBACK_MESSAGE =
  "NestGuide AI is temporarily unavailable. You can still use the dashboard modules directly: onboarding for tasks, LifeSync for wellbeing, Primer for 30-60-90 goals, Compliance for training, and Messages to contact HR.";

function buildLocalGuidanceResponse(context: AssistantContext, messages: ChatMessage[]) {
  const lastQuestion = messages[messages.length - 1]?.content?.toLowerCase() ?? "";
  const audience = context.audience === "hr" ? "hr" : "employee";
  const moduleName = context.moduleName || "Dashboard";
  const includesAny = (words: string[]) =>
    words.some((word) => lastQuestion.includes(word));

  if (
    audience === "employee" &&
    includesAny(["overwhelmed", "stressed", "burned", "support", "help", "hr"])
  ) {
    return [
      "If you feel overwhelmed, keep it simple:",
      "",
      "1. Open LifeSync and submit a check-in with `Share with HR` if you want support.",
      "2. Mark whether you need HR follow-up or urgent support.",
      "3. In Messages, tell HR the specific blocker: workload, unclear task, confidence, or support.",
      "4. Focus on one onboarding or Primer task at a time.",
      "",
      "You do not need to handle everything alone. WelcomeNestHR is built so HR can notice support needs early.",
    ].join("\n");
  }

  if (
    audience === "employee" &&
    (moduleName === "Primer" ||
      includesAny(["primer", "30", "60", "90", "goal", "xp", "badge", "level"]))
  ) {
    return [
      "Here is a practical Primer plan for this week:",
      "",
      "1. Complete the next unlocked goal in your current phase before starting anything else.",
      "2. Update any goal you have already done so your XP, level, and badges reflect your real progress.",
      "3. If a 60-day or 90-day phase is locked, finish the earlier phase first.",
      "4. Use your Primer goals as talking points with HR or your manager if you need clarity.",
      "",
      "A good next step is to complete one pending 30-day goal today, then ask HR for feedback on anything unclear.",
    ].join("\n");
  }

  if (
    audience === "employee" &&
    (moduleName === "LifeSync" ||
      includesAny(["lifesync", "privacy", "private", "journal", "mood", "wellbeing"]))
  ) {
    return [
      "LifeSync helps you reflect and choose how much to share:",
      "",
      "- Private journal: only you can read it.",
      "- Share trend only: HR can use it for people insights without seeing your note.",
      "- Share with HR: HR can see the check-in and follow up.",
      "",
      "Use follow-up or urgent support when you need HR to act, not just observe a trend.",
    ].join("\n");
  }

  if (
    audience === "employee" &&
    includesAny(["onboarding", "task", "checklist", "what next", "next step"])
  ) {
    return [
      "For your next onboarding step:",
      "",
      "1. Open Smart Onboarding and complete the first pending required task.",
      "2. If a task is unclear, message HR with the task name and what you need clarified.",
      "3. Use Primer for your 30-60-90 growth goals, not just setup tasks.",
      "4. Use LifeSync if workload or confidence is becoming a blocker.",
      "",
      "A good daily rhythm is one onboarding task, one Primer action, and one short reflection if you need support.",
    ].join("\n");
  }

  if (
    audience === "employee" &&
    includesAny(["payslip", "salary", "payroll", "payment"])
  ) {
    return [
      "For payslips and payroll:",
      "",
      "1. Open Payslips to see documents HR has issued.",
      "2. If a payslip is missing, message HR and include the pay period.",
      "3. If an amount looks wrong, ask HR to review salary, deductions, and payroll status.",
      "",
      "NestGuide can explain what to check, but HR must confirm payroll records.",
    ].join("\n");
  }

  if (
    audience === "employee" &&
    includesAny(["compliance", "policy", "training"])
  ) {
    return [
      "For compliance:",
      "",
      "1. Open Compliance and complete pending modules first.",
      "2. Read the policy summary before marking anything complete.",
      "3. Ask HR in Messages if a policy is unclear.",
      "",
      "Completing compliance early helps HR know you are ready for the next onboarding stage.",
    ].join("\n");
  }

  if (
    audience === "hr" &&
    (moduleName === "LifeSync" ||
      includesAny(["lifesync", "support request", "sentiment", "wellbeing", "overloaded"]))
  ) {
    return [
      "For HR, review LifeSync in this order:",
      "",
      "1. Start with the Follow-up Queue.",
      "2. Prioritize urgent support, overloaded workload, and low sentiment.",
      "3. Send a supportive message, not a disciplinary one.",
      "4. Look for repeated team patterns before changing process.",
      "",
      "Private journal entries should stay private; use only shared or trend-only signals.",
    ].join("\n");
  }

  if (audience === "hr" && includesAny(["announcement", "announce"])) {
    return [
      "Draft announcement:",
      "",
      "Hi team,",
      "",
      "We are excited to welcome our new joiners. Please take a moment this week to introduce yourself, offer support, and help them feel connected from day one.",
      "",
      "A small welcome can make a big difference.",
      "",
      "Thank you,",
      "HR Team",
    ].join("\n");
  }

  if (
    audience === "hr" &&
    includesAny(["checklist", "onboarding", "new hire", "hire"])
  ) {
    return [
      "A strong onboarding checklist should include:",
      "",
      "1. Welcome message and first-day expectations.",
      "2. Account/tool access confirmation.",
      "3. Company policies and compliance modules.",
      "4. Role-specific training tasks.",
      "5. Buddy or HR contact assignment.",
      "6. Primer 30-day goals and first manager check-in.",
      "",
      "Keep it role-specific, measurable, and not overloaded for day one.",
    ].join("\n");
  }

  if (
    audience === "hr" &&
    (moduleName === "Primer" || includesAny(["primer", "goal", "xp", "badge", "level"]))
  ) {
    return [
      "For HR Primer review:",
      "",
      "1. Check employees with low progress or no recent completed goals.",
      "2. Use XP and level as motivation signals, not performance judgment.",
      "3. Celebrate phase completions and schedule manager check-ins.",
      "4. For stuck employees, ask what goal is blocked and what support they need.",
      "",
      "Primer gamification should encourage growth without creating unhealthy competition.",
    ].join("\n");
  }

  if (audience === "hr") {
    return [
      "Here is how HR can use NestGuide AI:",
      "",
      "1. Ask for employees who may need attention based on LifeSync, Primer, onboarding, or compliance signals.",
      "2. Draft announcements, onboarding checklists, and follow-up messages.",
      "3. Use Primer progress and LifeSync support requests to plan manager check-ins.",
      "4. Keep sensitive decisions human-reviewed and compassionate.",
      "",
      "Tell me the module or employee situation, and I can suggest the next HR action.",
    ].join("\n");
  }

  return FALLBACK_MESSAGE;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body = await req.json();
    const context = (body?.context ?? {}) as AssistantContext;

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
              { role: "system", content: buildSystemPrompt(context) },
              ...(body.messages as ChatMessage[]),
            ],
            max_tokens: 500,
          });
        } catch (err) {
          console.error("OpenAI create() error:", err);
          sendLine({
            success: true,
            delta: buildLocalGuidanceResponse(context, body.messages as ChatMessage[]),
          });
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
          sendLine({
            success: true,
            delta: buildLocalGuidanceResponse(context, body.messages as ChatMessage[]),
          });
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