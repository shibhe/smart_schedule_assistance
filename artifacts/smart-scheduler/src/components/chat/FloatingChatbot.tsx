import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSendChatMessage, useGetChatHistory, getGetChatHistoryQueryKey, getListEventsQueryKey, getGetTodayEventsQueryKey, getGetUpcomingEventsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, X, Send, Loader2, Minimize2, ChevronDown, CalendarPlus, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";

interface EventCardInlineProps {
  event: {
    id: number;
    title: string;
    startTime: string;
    endTime?: string | null;
    date: string;
    category: string;
    priority: string;
    completed: boolean;
  };
  action?: string | null;
}

function EventCardInline({ event, action }: EventCardInlineProps) {
  const actionLabel = action === "create" ? "Event created" : action === "update" ? "Event updated" : action === "delete" ? "Event deleted" : "Event";
  const actionColor = action === "create" ? "text-green-400" : action === "update" ? "text-blue-400" : action === "delete" ? "text-red-400" : "text-indigo-400";

  return (
    <div className="mt-2 p-3 rounded-xl bg-white/10 border border-white/10 text-sm">
      <div className={`text-xs font-medium mb-1.5 flex items-center gap-1.5 ${actionColor}`}>
        <CalendarPlus className="w-3 h-3" />
        {actionLabel}
      </div>
      <div className="font-semibold text-white">{event.title}</div>
      <div className="text-white/60 text-xs mt-1">
        {event.date} · {format(parseISO(event.startTime), "h:mm a")}
        {event.endTime ? ` – ${format(parseISO(event.endTime), "h:mm a")}` : ""}
      </div>
      <div className="flex gap-2 mt-1.5">
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">{event.category}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${event.priority === "high" ? "bg-red-500/20 text-red-300" : event.priority === "medium" ? "bg-amber-500/20 text-amber-300" : "bg-blue-500/20 text-blue-300"}`}>
          {event.priority}
        </span>
      </div>
    </div>
  );
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    event?: unknown;
    action?: string | null;
  }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const sendMessage = useSendChatMessage();
  const { data: history } = useGetChatHistory({ query: { queryKey: getGetChatHistoryQueryKey() } });

  useEffect(() => {
    if (history && messages.length === 0) {
      const loaded = (history as Array<{ id: number; role: string; content: string }>).map((m) => ({
        id: String(m.id),
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      setMessages(loaded);
    }
  }, [history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sendMessage.isPending) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user" as const, content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await sendMessage.mutateAsync({ data: { message: text } });
      const res = response as { message: string; action?: string | null; event?: unknown; events?: unknown[] };

      const assistantMsg = {
        id: `a-${Date.now()}`,
        role: "assistant" as const,
        content: res.message,
        event: res.event,
        action: res.action,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (res.action) {
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTodayEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUpcomingEventsQueryKey() });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant" as const, content: "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "What do I have today?",
    "Schedule a meeting tomorrow at 10 AM",
    "Add gym session at 6 PM tonight",
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              background: "linear-gradient(180deg, hsl(239 84% 12%) 0%, hsl(222 47% 8%) 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              maxHeight: "calc(100vh - 8rem)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">AI Assistant</div>
                <div className="text-xs text-white/50">Always ready to schedule</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-white/50 hover:text-white hover:bg-white/10 shrink-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]" style={{ maxHeight: "360px" }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-3">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                  </div>
                  <p className="text-white/70 text-sm font-medium mb-1">Your AI scheduler</p>
                  <p className="text-white/40 text-xs">Ask me to create, update or find events</p>
                  <div className="mt-4 flex flex-col gap-2 w-full">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); inputRef.current?.focus(); }}
                        className="text-xs text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors border border-white/5"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1 mr-2">
                          <Bot className="w-3 h-3 text-indigo-400" />
                        </div>
                      )}
                      <div className={`max-w-[85%] ${msg.role === "user" ? "" : ""}`}>
                        <div
                          className={`text-sm px-3 py-2 rounded-2xl ${
                            msg.role === "user"
                              ? "bg-indigo-600 text-white rounded-br-sm"
                              : "bg-white/10 text-white/90 rounded-bl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.role === "assistant" && msg.event && (
                          <EventCardInline
                            event={msg.event as EventCardInlineProps["event"]}
                            action={msg.action}
                          />
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1 mr-2">
                        <Bot className="w-3 h-3 text-indigo-400" />
                      </div>
                      <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-sm">
                        <div className="flex gap-1.5 items-center">
                          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type to schedule or ask about your day..."
                  className="resize-none min-h-[40px] max-h-[120px] text-sm bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500 rounded-xl py-2.5"
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessage.isPending}
                  className="w-10 h-10 shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-white/30 mt-1.5 text-center">Press Enter to send</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, hsl(239 84% 67%) 0%, hsl(258 90% 66%) 100%)",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Bot className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
