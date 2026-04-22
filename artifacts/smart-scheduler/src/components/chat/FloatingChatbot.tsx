import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSendChatMessage, useGetChatHistory,
  getGetChatHistoryQueryKey, getListEventsQueryKey,
  getGetTodayEventsQueryKey, getGetUpcomingEventsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot, X, Send, Loader2, ChevronDown,
  CalendarPlus, Sparkles, MessageCircle, Pencil, Trash2, RefreshCw
} from "lucide-react";
import { format, parseISO, isToday, isYesterday, isSameDay } from "date-fns";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  event?: unknown;
  action?: string | null;
  timestamp: Date;
}

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
  const configs = {
    create: { label: "Scheduled", icon: CalendarPlus, bg: "bg-green-50 border-green-200", text: "text-green-700" },
    update: { label: "Updated", icon: Pencil, bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
    delete: { label: "Removed", icon: Trash2, bg: "bg-red-50 border-red-200", text: "text-red-700" },
  };
  const cfg = configs[action as keyof typeof configs] ?? { label: "Event", icon: CalendarPlus, bg: "bg-muted border-border", text: "text-muted-foreground" };
  const Icon = cfg.icon;

  return (
    <div className={`mt-2 p-3 rounded-xl border ${cfg.bg}`}>
      <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${cfg.text}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </div>
      <p className="font-semibold text-foreground text-sm leading-snug">{event.title}</p>
      <p className="text-muted-foreground text-xs mt-1 font-mono">
        {format(parseISO(event.date), "MMM d, yyyy")} · {format(parseISO(event.startTime), "h:mm a")}
        {event.endTime ? ` – ${format(parseISO(event.endTime), "h:mm a")}` : ""}
      </p>
    </div>
  );
}

function DateSeparator({ date }: { date: Date }) {
  const label = isToday(date)
    ? "Today"
    : isYesterday(date)
    ? "Yesterday"
    : format(date, "MMMM d, yyyy");
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 shrink-0">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function MessageTimestamp({ date }: { date: Date }) {
  const label = isToday(date) ? format(date, "h:mm a") : format(date, "MMM d · h:mm a");
  return <span className="text-[10px] text-muted-foreground mt-1 px-1">{label}</span>;
}

const SUGGESTIONS = [
  "What's on my schedule this week?",
  "Schedule a team meeting tomorrow at 10 AM",
  "Add a dentist appointment next Monday at 2 PM",
];

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const sendMessage = useSendChatMessage();
  const { data: history } = useGetChatHistory({ query: { queryKey: getGetChatHistoryQueryKey() } });

  useEffect(() => {
    if (history && !loaded) {
      const loaded = (history as Array<{ id: number; role: string; content: string; createdAt?: string }>).map((m) => ({
        id: String(m.id),
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: m.createdAt ? new Date(m.createdAt) : new Date(),
      }));
      setMessages(loaded);
      setLoaded(true);
    }
  }, [history, loaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sendMessage.isPending) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await sendMessage.mutateAsync({ data: { message: text } });
      const res = response as { message: string; action?: string | null; event?: unknown };
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: res.message, event: res.event, action: res.action, timestamp: new Date() },
      ]);
      if (res.action) {
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTodayEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUpcomingEventsQueryKey() });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: "Sorry, something went wrong. Please try again.", timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClear = () => { setMessages([]); setLoaded(false); };

  const groupedMessages = useMemo(() => {
    const groups: Array<{ date: Date; messages: ChatMessage[] }> = [];
    for (const msg of messages) {
      const last = groups[groups.length - 1];
      if (!last || !isSameDay(last.date, msg.timestamp)) {
        groups.push({ date: msg.timestamp, messages: [msg] });
      } else {
        last.messages.push(msg);
      }
    }
    return groups;
  }, [messages]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed bottom-24 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-background border border-border"
            style={{ maxHeight: "calc(100vh - 8rem)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-tight flex items-center gap-1.5">
                  AI Assistant
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                </p>
                <p className="text-[10px] text-muted-foreground">Upcoming schedule only</p>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={handleClear}
                    title="Clear chat"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-muted-foreground hover:text-foreground rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 custom-scrollbar" style={{ minHeight: 260, maxHeight: 400 }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center mb-3">
                    <Bot className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">How can I help?</p>
                  <p className="text-xs text-muted-foreground max-w-[75%] mb-5 leading-relaxed">
                    Ask me to schedule, reschedule, or look up upcoming events.
                  </p>
                  <div className="flex flex-col gap-2 w-full">
                    {SUGGESTIONS.map((s, i) => (
                      <motion.button
                        key={s}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        onClick={() => { setInput(s); inputRef.current?.focus(); }}
                        className="text-xs text-left px-3.5 py-2.5 rounded-xl bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-border transition-colors flex items-center justify-between group gap-2"
                      >
                        <span>{s}</span>
                        <ChevronDown className="w-3 h-3 -rotate-90 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {groupedMessages.map((group) => (
                    <div key={group.date.toISOString()}>
                      <DateSeparator date={group.date} />
                      {group.messages.map((msg, msgIdx) => {
                        const isUser = msg.role === "user";
                        const prevMsg = group.messages[msgIdx - 1];
                        const nextMsg = group.messages[msgIdx + 1];
                        const isFirstInRun = !prevMsg || prevMsg.role !== msg.role;
                        const isLastInRun = !nextMsg || nextMsg.role !== msg.role;

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18 }}
                            className={`flex ${isUser ? "justify-end" : "justify-start"} ${isLastInRun ? "mb-3" : "mb-0.5"}`}
                          >
                            {!isUser && (
                              <div className={`w-6 h-6 rounded-lg bg-primary flex items-center justify-center shrink-0 mr-2 mt-1 ${isFirstInRun ? "opacity-100" : "opacity-0"}`}>
                                <Sparkles className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}
                            <div className={`max-w-[80%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                              <div
                                className={`text-sm px-3.5 py-2.5 leading-relaxed break-words ${
                                  isUser
                                    ? `bg-primary text-primary-foreground font-medium shadow-sm
                                       ${isFirstInRun ? "rounded-2xl rounded-br-sm" : "rounded-xl rounded-r-sm"}`
                                    : `bg-card border border-border text-foreground shadow-sm
                                       ${isFirstInRun ? "rounded-2xl rounded-tl-sm" : "rounded-xl rounded-l-sm"}`
                                }`}
                              >
                                {msg.content}
                              </div>
                              {msg.role === "assistant" && !!msg.event && (
                                <EventCardInline
                                  event={msg.event as EventCardInlineProps["event"]}
                                  action={msg.action}
                                />
                              )}
                              {isLastInRun && <MessageTimestamp date={msg.timestamp} />}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start mb-3"
                    >
                      <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shrink-0 mr-2 mt-1">
                        <Sparkles className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                        <div className="flex gap-1 items-center h-3">
                          {[0, 150, 300].map((delay) => (
                            <span
                              key={delay}
                              className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce"
                              style={{ animationDelay: `${delay}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-border bg-card/50 shrink-0">
              <div className="relative flex items-end gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me to schedule something..."
                  className="resize-none min-h-[42px] max-h-[120px] text-sm bg-background border-border rounded-xl py-2.5 pr-11 leading-snug focus-visible:ring-1"
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessage.isPending}
                  className={`absolute right-2 bottom-2 w-7 h-7 rounded-lg transition-colors ${
                    input.trim() && !sendMessage.isPending
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {sendMessage.isPending
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Send className="w-3 h-3 ml-px" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center border border-primary/20"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.14 }}>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.14 }}>
              <MessageCircle className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white" />
          </span>
        )}
      </motion.button>
    </>
  );
}
