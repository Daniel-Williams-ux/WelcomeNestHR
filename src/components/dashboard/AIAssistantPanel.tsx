"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Send } from "lucide-react";

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const FALLBACK_MESSAGE =
  "⚠️ Our AI assistant is currently unavailable. Please try again in a few minutes. Meanwhile, remember that WelcomeNestHR is built to make onboarding human, simple, and emotionally intelligent and it is the first human resources platform that fuses automation, emotional intelligence, and community — to help every new hire thrive from day one. 💡";

export default function AIAssistantPanel({
  isOpen,
  onClose,
}: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const newMessage: ChatMessage = { role: "user", content: input };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.ok || !res.body) throw new Error("No response body");

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();

      let assistantReply = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      // Read stream progressively
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const lines = value
          .split("\n")
          .filter((line) => line.trim().length > 0);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);

            // Ensure it follows our JSON structure
            if (parsed.success && parsed.delta) {
              assistantReply += parsed.delta;

              // Progressive safe update
              requestAnimationFrame(() => {
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = {
                    role: "assistant",
                    content: assistantReply,
                  };
                  return newMsgs;
                });
              });
            }
          } catch (err) {
            console.error("JSON parse error:", err, line);
          }
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: FALLBACK_MESSAGE },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700"
      role="dialog"
      aria-label="AI Assistant chat panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <button aria-label="Close assistant" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-2xl max-w-full sm:max-w-[80%] ${
              msg.role === "user"
                ? "ml-auto bg-[#00ACC1] text-white"
                : "mr-auto bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            }`}
          >
            {msg.content || (
              <span className="animate-pulse text-gray-400 dark:text-gray-500">
                Typing…
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center p-3 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <input
          type="text"
          className="flex-1 p-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:bg-gray-900 dark:text-white dark:border-gray-600"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          aria-label="Type your question to the AI assistant"
        />
        <Button
          onClick={sendMessage}
          className="ml-2 rounded-xl bg-[#00ACC1] hover:bg-[#0097A7] text-white"
          disabled={loading}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}