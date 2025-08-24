// lib/ai.ts
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY in environment variables");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getAIResponse(prompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-4o", depending on speed/cost tradeoff
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: prompt },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI API error:", error);
    throw new Error("Failed to fetch AI response");
  }
}