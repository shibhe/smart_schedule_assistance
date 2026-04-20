import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, Calendar as CalendarIcon, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { 
  useSendChatMessage, 
  useGetChatHistory, 
  getGetChatHistoryQueryKey,
  getListEventsQueryKey,
  getGetTodayEventsQueryKey,
  getGetUpcomingEventsQueryKey,
  getGetEventStatsQueryKey
} from "@workspace/api-client-react";
import type { ChatMessage, ChatResponse, Event } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "../events/EventCard";

export function Chatbot() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: history = [] } = useGetChatHistory({
    query: {
      queryKey: getGetChatHistoryQueryKey()
    }
  });

  const sendMutation = useSendChatMessage();

  const [optimisticMessages, setOptimisticMessages] = useState<Array<{ id: number, role: "user" | "assistant", content: string, isOptimistic?: boolean, response?: ChatResponse }>>([]);

  const messages = [...history, ...optimisticMessages.filter(om => !history.some(h => h.id === om.id))];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");

    const tempId = Date.now();
    setOptimisticMessages(prev => [...prev, { id: tempId, role: "user", content: userMsg, isOptimistic: true }]);

    sendMutation.mutate({ data: { message: userMsg } }, {
      onSuccess: (data) => {
        // Invalidate queries that might have been affected by an action
        if (data.action) {
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTodayEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetUpcomingEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEventStatsQueryKey() });
        }
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() });
        
        setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
      },
      onError: () => {
        setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Loader2 className="w-4 h-4 animate-[spin_3s_linear_infinite]" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">Always ready to schedule</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <CalendarIcon className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1">Try saying "Schedule a meeting tomorrow at 10am"</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            
            // Render basic message content
            return (
              <div key={msg.id || i} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
                {!isUser && (
                  <Avatar className="w-8 h-8 border bg-primary/5">
                    <AvatarFallback className="bg-transparent text-primary text-xs">AI</AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[80%] space-y-2 ${isUser ? "items-end flex flex-col" : "items-start flex flex-col"}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isUser 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-muted text-foreground rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                  
                  {/* If message has an associated event from the response or action */}
                  {((msg as any).response?.event || (msg as any).eventId) && (
                    <div className="w-full mt-2 max-w-xs">
                       {/* Render small inline event or fallback */}
                       <div className="bg-background border rounded-lg p-3 shadow-sm text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Action successful</span>
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sendMutation.isPending && (
            <div className="flex gap-3 justify-start animate-in fade-in duration-300">
              <Avatar className="w-8 h-8 border bg-primary/5">
                <AvatarFallback className="bg-transparent text-primary text-xs">AI</AvatarFallback>
              </Avatar>
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-card">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type to schedule or ask about your day..."
            className="flex-1 rounded-full px-4 border-muted-foreground/20 focus-visible:ring-primary/20"
            disabled={sendMutation.isPending}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full shrink-0 w-10 h-10"
            disabled={!input.trim() || sendMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
