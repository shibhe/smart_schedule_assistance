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
            title: "Suggestion accepted",
            description: `"${suggestion.title}" has been added to your calendar.`,
          });
          setAcceptingId(null);
        },
        onError: () => {
          toast({
            title: "Failed to accept suggestion",
            description: "An error occurred while adding the event.",
            variant: "destructive"
          });
          setAcceptingId(null);
        }
      }
    );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              AI Suggestions
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">Beta</Badge>
            </h1>
            <p className="text-muted-foreground mt-1">Smart recommendations to optimize your schedule</p>
          </div>
          <div className="hidden sm:flex w-12 h-12 bg-primary/10 rounded-full items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted/40 rounded-t-xl" />
                <CardContent className="p-6 h-32" />
              </Card>
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map(suggestion => (
              <Card key={suggestion.id} className="overflow-hidden border-primary/10 hover:border-primary/30 transition-colors group">
                <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                      <CardDescription className="text-xs font-medium flex items-center gap-1.5 text-primary/80">
                        <Lightbulb className="w-3.5 h-3.5" />
                        Confidence: {Math.round(suggestion.confidence * 100)}%
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 pb-2 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {suggestion.reason}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <Badge variant="outline" className="bg-background flex gap-1.5 py-1 px-2.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {format(parseISO(suggestion.suggestedDate), "MMM d, yyyy")}
                    </Badge>
                    <Badge variant="outline" className="bg-background flex gap-1.5 py-1 px-2.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {suggestion.suggestedTime}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    className="w-full gap-2 group-hover:bg-primary/90 transition-colors"
                    onClick={() => handleAccept(suggestion)}
                    disabled={acceptingId === suggestion.id}
                  >
                    {acceptingId === suggestion.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Accept & Schedule
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border shadow-sm">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your schedule looks perfect</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              The AI doesn't have any suggestions for you right now. Check back later as your schedule changes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
