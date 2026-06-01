"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bot, Send, Sparkles, X } from "lucide-react";

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  audience?: "employee" | "hr";
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const FALLBACK_MESSAGE =
  "NestGuide AI is temporarily unavailable. You can still use the dashboard modules directly: onboarding for tasks, LifeSync for wellbeing, Primer for 30-60-90 goals, Compliance for required training, and Messages to contact HR.";

const EMPLOYEE_PROMPTS = [
  "What should I focus on next in my onboarding?",
  "Help me improve my Primer progress this week.",
  "I feel overwhelmed. What should I ask HR for?",
  "Explain how LifeSync privacy works.",
];

const HR_PROMPTS = [
  "Which employees need attention this week?",
  "Draft a warm announcement for new hires.",
  "Create a checklist for a new customer support hire.",
  "How should HR respond to LifeSync support requests?",
];

function getModuleFromPath(pathname: string) {
  if (pathname.includes("lifesync")) return "LifeSync";
  if (pathname.includes("primer")) return "Primer";
  if (pathname.includes("onboarding")) return "Onboarding";
  if (pathname.includes("compliance")) return "Compliance";
  if (pathname.includes("payroll") || pathname.includes("payslips")) return "Payroll";
  if (pathname.includes("messages")) return "Messages";
  if (pathname.includes("collaborate")) return "Collaborate";
  return "Dashboard";
}

export default function AIAssistantPanel({
  isOpen,
  onClose,
  audience = "employee",
}: AIAssistantPanelProps) {
  const pathname = usePathname();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const moduleName = getModuleFromPath(pathname);
  const suggestions = audience === "hr" ? HR_PROMPTS : EMPLOYEE_PROMPTS;
  const intro =
    audience === "hr"
      ? "I help HR summarize risk, draft onboarding content, interpret LifeSync and Primer signals, and suggest humane follow-ups."
      : "I help employees understand onboarding, Primer goals, LifeSync support, compliance, payslips, and when to contact HR.";

  const sendMessage = async (prompt?: string) => {
    const messageText = (prompt ?? input).trim();
    if (!messageText) return;

    const newMessage: ChatMessage = { role: "user", content: messageText };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          context: {
            productName: "WelcomeNestHR",
            assistantName: "NestGuide AI",
            audience,
            moduleName,
            pathname,
          },
        }),
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
    } catch (err: unknown) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: FALLBACK_MESSAGE },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const panel = (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed right-0 top-0 z-[100] flex h-dvh w-full flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:w-96"
      role="dialog"
      aria-modal="true"
      aria-label="NestGuide AI chat panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-lg font-semibold">NestGuide AI</h2>
          </div>
          <p className="text-xs text-white/90">
            {audience === "hr" ? "HR copilot" : "Employee guide"} · {moduleName}
          </p>
        </div>
        <button type="button" aria-label="Close assistant" onClick={onClose}>
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm text-gray-800">
            <div className="flex items-center gap-2 font-semibold text-[#FB8C00]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              What I can help with
            </div>
            <p className="mt-2 text-gray-700">{intro}</p>
            <div className="mt-4 space-y-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  className="block w-full rounded-xl border border-orange-100 bg-white px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-orange-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

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
          placeholder={
            audience === "hr"
              ? "Ask about employees, onboarding, LifeSync..."
              : "Ask about your next step..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          aria-label="Type your question to NestGuide AI"
        />
        <Button
          onClick={() => sendMessage()}
          className="ml-2 rounded-xl bg-[#00ACC1] hover:bg-[#0097A7] text-white"
          disabled={loading}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </motion.div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(panel, document.body);
}