"use client";

import { useState, useCallback } from "react";

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

export function useOpenAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fallback, setFallback] = useState(false);

  const sendPrompt = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) return;

      setLoading(true);
      setError(null);
      setFallback(false);

      // Optimistically add user message
      setMessages((prev) => [...prev, { role: "user", content: prompt }]);

      try {
        const res = await fetch("/api/openai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: prompt }],
            stream: true, // tell API to stream
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Request failed: ${res.status} ${res.statusText}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let aiText = "";

        // Add placeholder assistant message to update progressively
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          aiText += chunk;

          // Update the last assistant message live
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              last.content = aiText;
            }
            return updated;
          });
        }

        const isFallback =
          /sorry.*unavailable/i.test(aiText) || aiText.trim() === "";
        setFallback(isFallback);
      } catch (err: any) {
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    },
    [messages]
  );

  return {
    sendPrompt,
    loading,
    error,
    messages,
    fallback,
  };
}