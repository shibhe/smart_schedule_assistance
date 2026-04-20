import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSendChatMessage, useGetChatHistory, getGetChatHistoryQueryKey, getListEventsQueryKey, getGetTodayEventsQueryKey, getGetUpcomingEventsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, X, Send, Loader2, ChevronDown, CalendarPlus, Sparkles, MessageCircle } from "lucide-react";
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
  const actionLabel = action === "create" ? "Created" : action === "update" ? "Updated" : action === "delete" ? "Deleted" : "Event";
  const actionColor = action === "create" ? "text-green-600" : action === "update" ? "text-blue-600" : action === "delete" ? "text-destructive" : "text-muted-foreground";
  const actionBg = action === "create" ? "bg-green-50 border-green-200" : action === "update" ? "bg-blue-50 border-blue-200" : action === "delete" ? "bg-red-50 border-red-200" : "bg-muted border-border";

  return (
    <div className={`mt-2 p-3 rounded-xl border ${actionBg}`}>
      <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${actionColor}`}>
        <CalendarPlus className="w-3 h-3" />
        {actionLabel}
      </div>
      <div className="font-semibold text-foreground text-sm">{event.title}</div>
      <div className="text-muted-foreground text-xs mt-1 font-mono">
        {event.date} · {format(parseISO(event.startTime), "HH:mm")}
        {event.endTime ? ` – ${format(parseISO(event.endTime), "HH:mm")}` : ""}
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
        { id: `err-${Date.now()}`, role: "assistant" as const, content: "Sorry, something went wrong. Please try again." },
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
    "What's on my schedule today?",
    "Schedule a meeting tomorrow at 10 AM",
    "Add a dentist appointment next Monday at 2 PM",
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-4 z-50 w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-xl overflow-hidden flex flex-col border border-border bg-card"
            style={{ maxHeight: "calc(100vh - 8rem)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-muted/50">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  AI Assistant
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div className="text-[10px] text-muted-foreground">Ask me to schedule anything</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg shrink-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[280px] custom-scrollbar" style={{ maxHeight: "420px" }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4">
                    <Bot className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-foreground text-sm font-semibold mb-1">How can I help?</p>
                  <p className="text-muted-foreground text-xs max-w-[80%] mx-auto mb-5">
                    Use natural language to schedule, update, or query your calendar.
                  </p>
                  <div className="flex flex-col gap-2 w-full max-w-[90%]">
                    {suggestions.map((s, i) => (
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        key={s}
                        onClick={() => { setInput(s); inputRef.current?.focus(); }}
                        className="text-xs text-left px-3 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all border border-border group flex items-center justify-between"
                      >
                        <span className="font-medium">{s}</span>
                        <ChevronDown className="w-3 h-3 -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
                      </motion.button>
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
                      transition={{ duration: 0.2 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-1 mr-2">
                          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      )}
                      <div className={`max-w-[85%]`}>
                        <div
                          className={`text-sm px-3.5 py-2.5 rounded-2xl shadow-sm ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-sm font-medium"
                              : "bg-muted border border-border text-foreground rounded-tl-sm leading-relaxed"
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
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-1 mr-2">
                        <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                      <div className="bg-muted border border-border px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                        <div className="flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-muted/30">
              <div className="flex gap-2 items-end relative">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me to schedule something..."
                  className="resize-none min-h-[44px] max-h-[120px] text-sm bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30 rounded-xl py-3 pr-12"
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessage.isPending}
                  className={`absolute right-2 bottom-2 w-8 h-8 rounded-lg transition-all ${
                    input.trim() && !sendMessage.isPending
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center border border-primary/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white"></span>
          </span>
        )}
      </motion.button>
    </>
  );
}
