import { useState } from "react";
import { useGetAiSuggestions, getGetAiSuggestionsQueryKey, useCreateEvent, getListEventsQueryKey, getGetTodayEventsQueryKey, getGetUpcomingEventsQueryKey, getGetEventStatsQueryKey } from "@workspace/api-client-react";
import type { SchedulingSuggestion } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Loader2, Sparkles, Check, Clock, Calendar } from "lucide-react";
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
          startTime: `${suggestion.suggestedDate}T${suggestion.suggestedTime}:00`,
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
            title: "Event scheduled",
            description: `"${suggestion.title}" has been added to your calendar.`,
          });
          setAcceptingId(null);
        },
        onError: () => {
          toast({
            title: "Failed to add event",
            description: "Please try again.",
            variant: "destructive"
          });
          setAcceptingId(null);
        }
      }
    );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-6 md:p-8 lg:p-10 bg-background">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              Suggestions
              <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5">Beta</Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              AI-generated scheduling recommendations based on your patterns
            </p>
          </div>
          <div className="hidden md:flex w-14 h-14 bg-muted border border-border rounded-2xl items-center justify-center">
            <Lightbulb className="w-7 h-7 text-muted-foreground" />
          </div>
        </header>

        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="border-border overflow-hidden">
                  <CardHeader className="h-24 bg-muted border-b border-border">
                    <div className="h-4 w-2/3 bg-border rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-border rounded animate-pulse mt-2" />
                  </CardHeader>
                  <CardContent className="p-5 h-32">
                    <div className="space-y-2">
                      <div className="h-2.5 w-full bg-muted rounded animate-pulse" />
                      <div className="h-2.5 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-2.5 w-1/2 bg-muted rounded animate-pulse" />
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
                visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {suggestions.map(suggestion => {
                const confPercent = Math.round(suggestion.confidence * 100);
                const confColor = confPercent > 85
                  ? 'text-green-700 border-green-200 bg-green-50'
                  : confPercent > 70
                    ? 'text-amber-700 border-amber-200 bg-amber-50'
                    : 'text-blue-700 border-blue-200 bg-blue-50';

                return (
                  <motion.div key={suggestion.id} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
                    <Card className="h-full flex flex-col overflow-hidden border-border hover:shadow-md transition-shadow">
                      <CardHeader className="bg-muted/50 pb-4 border-b border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={`uppercase tracking-wider text-[9px] font-bold px-2 py-0.5 border ${confColor}`}>
                            {confPercent}% confidence
                          </Badge>
                        </div>
                        <CardTitle className="text-base font-bold text-foreground leading-snug">{suggestion.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 pt-4 pb-3 space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {suggestion.reason}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 bg-muted border border-border px-2.5 py-1.5 rounded-lg">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {format(parseISO(suggestion.suggestedDate), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-muted border border-border px-2.5 py-1.5 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {suggestion.suggestedTime}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 pb-4 px-5">
                        <Button
                          className="w-full gap-2 h-10 rounded-xl font-semibold text-sm"
                          onClick={() => handleAccept(suggestion)}
                          disabled={acceptingId === suggestion.id}
                        >
                          {acceptingId === suggestion.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Add to Calendar
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
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-card rounded-2xl border border-border"
            >
              <div className="w-16 h-16 bg-muted border border-border rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-foreground">All caught up</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                No suggestions right now. Check back after adding more events to your calendar.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
