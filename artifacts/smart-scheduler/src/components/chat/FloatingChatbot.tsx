import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSendChatMessage, useGetChatHistory, getGetChatHistoryQueryKey, getListEventsQueryKey, getGetTodayEventsQueryKey, getGetUpcomingEventsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, X, Send, Loader2, ChevronDown, CalendarPlus, Sparkles, Terminal } from "lucide-react";
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
  const actionLabel = action === "create" ? "Event Initialized" : action === "update" ? "Parameters Updated" : action === "delete" ? "Event Terminated" : "Event Data";
  const actionColor = action === "create" ? "text-secondary" : action === "update" ? "text-primary" : action === "delete" ? "text-destructive" : "text-primary/80";
  const actionBorder = action === "create" ? "border-secondary/30" : action === "update" ? "border-primary/30" : action === "delete" ? "border-destructive/30" : "border-primary/20";
  const actionBg = action === "create" ? "bg-secondary/10" : action === "update" ? "bg-primary/10" : action === "delete" ? "bg-destructive/10" : "bg-primary/5";

  return (
    <div className={`mt-3 p-4 rounded-xl border backdrop-blur-md shadow-lg ${actionBorder} ${actionBg}`}>
      <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${actionColor}`}>
        {action === "delete" ? <Terminal className="w-3.5 h-3.5" /> : <CalendarPlus className="w-3.5 h-3.5" />}
        {actionLabel}
      </div>
      <div className="font-bold text-white tracking-wide">{event.title}</div>
      <div className="text-muted-foreground font-mono text-xs mt-1.5 flex items-center gap-2">
        <span>{event.date}</span>
        <span className="text-white/30">•</span>
        <span className="text-primary/70">
          {format(parseISO(event.startTime), "HH:mm")}
          {event.endTime ? ` - ${format(parseISO(event.endTime), "HH:mm")}` : ""}
        </span>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-white/10 bg-black/40 text-white/70">{event.category}</span>
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border shadow-sm
          ${event.priority === "high" ? "border-destructive/40 bg-destructive/20 text-destructive" : 
            event.priority === "medium" ? "border-amber-400/40 bg-amber-400/20 text-amber-400" : 
            "border-secondary/40 bg-secondary/20 text-secondary"}`}>
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
        { id: `err-${Date.now()}`, role: "assistant" as const, content: "Terminal error. Unable to process directive. Please try again." },
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
    "What is my current status?",
    "Initialize meeting tomorrow at 10 AM",
    "Schedule system maintenance at 6 PM",
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-4 z-50 w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/10 backdrop-blur-xl bg-background/90"
            style={{
              maxHeight: "calc(100vh - 8rem)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-white/10 bg-black/40 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.3)] relative z-10">
                <Terminal className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <div className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  System Assistant
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
                </div>
                <div className="text-[10px] uppercase tracking-widest font-mono text-primary mt-0.5">Online & Ready</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-white hover:bg-white/10 shrink-0 rounded-lg relative z-10"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-[300px] custom-scrollbar" style={{ maxHeight: "450px" }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center animate-in fade-in zoom-in duration-500">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
                    <div className="w-16 h-16 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-4 relative z-10 shadow-xl">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <p className="text-white text-base font-bold tracking-wide mb-1">Awaiting Directives</p>
                  <p className="text-muted-foreground text-sm max-w-[80%] mx-auto mb-6">Use natural language to schedule, update, or query your calendar.</p>
                  <div className="flex flex-col gap-2 w-full max-w-[90%]">
                    {suggestions.map((s, i) => (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={s}
                        onClick={() => { setInput(s); inputRef.current?.focus(); }}
                        className="text-xs text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-primary/10 text-muted-foreground hover:text-white transition-all border border-white/5 hover:border-primary/30 group flex items-center justify-between"
                      >
                        <span className="font-medium tracking-wide">{s}</span>
                        <ChevronDown className="w-3 h-3 -rotate-90 opacity-0 group-hover:opacity-100 transition-all text-primary" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1 mr-3 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                          <Terminal className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className={`max-w-[85%] ${msg.role === "user" ? "" : ""}`}>
                        <div
                          className={`text-sm px-4 py-3 rounded-2xl shadow-md ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-sm font-medium tracking-wide shadow-[0_4px_15px_rgba(139,92,246,0.3)]"
                              : "bg-white/10 border border-white/5 text-white/90 rounded-tl-sm leading-relaxed"
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1 mr-3">
                        <Terminal className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-white/5 border border-white/5 px-4 py-4 rounded-2xl rounded-tl-sm shadow-md">
                        <div className="flex gap-1.5 items-center">
                          <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/40">
              <div className="flex gap-3 items-end relative">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter directive..."
                  className="resize-none min-h-[48px] max-h-[120px] text-sm bg-background/50 backdrop-blur-md border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary focus-visible:border-primary rounded-xl py-3 pr-12 shadow-inner"
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessage.isPending}
                  className={`absolute right-2 bottom-2 w-8 h-8 rounded-lg transition-all ${
                    input.trim() && !sendMessage.isPending 
                      ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(139,92,246,0.5)] hover:bg-primary/90" 
                      : "bg-white/10 text-white/30 hover:bg-white/10"
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
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-2xl shadow-[0_8px_30px_rgba(139,92,246,0.4)] flex items-center justify-center border border-white/10 backdrop-blur-md"
        style={{
          background: "linear-gradient(135deg, hsl(255 85% 65% / 0.9) 0%, hsl(190 90% 50% / 0.8) 100%)",
        }}
        whileHover={{ scale: 1.05, boxShadow: "0 12px 40px rgba(139,92,246,0.6)" }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-8 h-8 text-white drop-shadow-md" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <Terminal className="w-8 h-8 text-white drop-shadow-md" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary shadow-[0_0_8px_rgba(34,211,238,0.8)] border border-background"></span>
          </span>
        )}
      </motion.button>
    </>
  );
}
