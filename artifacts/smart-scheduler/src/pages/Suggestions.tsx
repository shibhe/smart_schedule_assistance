import { useState } from "react";
import { useGetAiSuggestions, getGetAiSuggestionsQueryKey, useCreateEvent, getListEventsQueryKey, getGetTodayEventsQueryKey, getGetUpcomingEventsQueryKey, getGetEventStatsQueryKey } from "@workspace/api-client-react";
import type { SchedulingSuggestion } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Loader2, Sparkles, Check, Clock, Calendar, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function Suggestions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const { data: suggestions = [], isLoading } = useGetAiSuggestions({
    query: { queryKey: getGetAiSuggestionsQueryKey() }
  });

  const createEvent = useCreateEvent();

  const handleAccept = (suggestion: SchedulingSuggestion) => {
    setAcceptingId(suggestion.id);
    createEvent.mutate(
      {
        data: {
          title: suggestion.title,
          description: suggestion.description,
          date: suggestion.suggestedDate,
          startTime: suggestion.suggestedTime,
          category: suggestion.category,
          priority: suggestion.priority as any
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTodayEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetUpcomingEventsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEventStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAiSuggestionsQueryKey() });
          
          toast({
            title: "Directive Executed",
            description: `"${suggestion.title}" added to active timeline.`,
            className: "bg-background border-primary text-foreground font-sans",
          });
          setAcceptingId(null);
        },
        onError: () => {
          toast({
            title: "Execution Failed",
            description: "System error during scheduling attempt.",
            variant: "destructive"
          });
          setAcceptingId(null);
        }
      }
    );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-6 md:p-8 lg:p-10 bg-transparent">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-mono text-sm tracking-widest uppercase mb-2">
              <Zap className="w-4 h-4 text-primary" />
              Machine Intelligence
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white font-sans flex items-center gap-4">
              AI Directives
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 uppercase tracking-widest text-[10px] font-mono px-2 py-0.5">Beta</Badge>
            </h1>
            <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
              Algorithmic schedule optimization
            </p>
          </div>
          <div className="hidden md:flex w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </header>

        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="bg-card/40 border-white/5 overflow-hidden">
                  <div className="h-1 bg-white/5 w-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary/50 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                  </div>
                  <CardHeader className="h-28 bg-white/5 border-b border-white/5 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  </CardHeader>
                  <CardContent className="p-6 h-36">
                    <div className="space-y-3">
                      <div className="h-2 w-full bg-white/5 rounded" />
                      <div className="h-2 w-3/4 bg-white/5 rounded" />
                      <div className="h-2 w-1/2 bg-white/5 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : suggestions.length > 0 ? (
            <motion.div 
              initial="hidden" animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {suggestions.map(suggestion => {
                const confPercent = Math.round(suggestion.confidence * 100);
                const confColor = confPercent > 85 ? 'text-green-400 border-green-500/30' : confPercent > 70 ? 'text-amber-400 border-amber-500/30' : 'text-blue-400 border-blue-500/30';
                
                return (
                  <motion.div key={suggestion.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                    <Card className="h-full flex flex-col overflow-hidden bg-card/60 backdrop-blur-md border-white/10 hover:border-primary/40 hover:shadow-[0_10px_40px_-15px_rgba(139,92,246,0.3)] transition-all duration-300 group">
                      <CardHeader className="bg-gradient-to-br from-primary/10 via-transparent to-transparent pb-5 border-b border-white/5 relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Lightbulb className="w-16 h-16 text-primary" />
                        </div>
                        <div className="space-y-2 relative z-10 pr-12">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`uppercase tracking-widest text-[9px] font-bold px-2 py-0.5 bg-black/40 ${confColor}`}>
                              Confidence: {confPercent}%
                            </Badge>
                          </div>
                          <CardTitle className="text-xl font-bold tracking-wide text-white leading-tight">{suggestion.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 pt-5 pb-4 space-y-5">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {suggestion.reason}
                        </p>
                        
                        <div className="flex flex-wrap gap-3 mt-auto pt-2">
                          <div className="flex items-center gap-2 bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg shadow-inner">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-mono text-xs font-bold text-white tracking-wider">
                              {format(parseISO(suggestion.suggestedDate), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg shadow-inner">
                            <Clock className="w-4 h-4 text-secondary" />
                            <span className="font-mono text-xs font-bold text-white tracking-wider">
                              {suggestion.suggestedTime}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 pb-5 px-6">
                        <Button 
                          className="w-full gap-2 bg-white/5 hover:bg-primary hover:text-primary-foreground border border-white/10 hover:border-primary transition-all font-bold tracking-widest uppercase text-xs h-12 rounded-xl group/btn"
                          onClick={() => handleAccept(suggestion)}
                          disabled={acceptingId === suggestion.id}
                        >
                          {acceptingId === suggestion.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 text-primary group-hover/btn:text-primary-foreground transition-colors" /> 
                              Initialize Operation
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24 bg-card/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
              <div className="w-20 h-20 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(139,92,246,0.3)] relative z-10">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white tracking-wide relative z-10">System Optimized</h2>
              <p className="text-muted-foreground font-mono text-sm max-w-md mx-auto uppercase tracking-widest relative z-10">
                No active directives. Timeline is operating at peak efficiency.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
