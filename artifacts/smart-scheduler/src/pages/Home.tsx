import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useGetTodayEvents, getGetTodayEventsQueryKey, useGetUpcomingEvents, getGetUpcomingEventsQueryKey } from "@workspace/api-client-react";
import { EventCard } from "@/components/events/EventCard";
import { EventModal } from "@/components/events/EventModal";
import { Calendar as CalendarIcon, Clock, ArrowRight, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: todayData, isLoading: isLoadingToday } = useGetTodayEvents({
    query: { queryKey: getGetTodayEventsQueryKey() }
  });

  const { data: upcomingEvents, isLoading: isLoadingUpcoming } = useGetUpcomingEvents({
    query: { queryKey: getGetUpcomingEventsQueryKey() }
  });

  const todayEvents = todayData?.events || [];
  const nextEvent = todayData?.nextEvent;

  return (
    <div className="flex-1 h-full overflow-y-auto bg-muted/10">
      <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}
            </h1>
            <p className="text-muted-foreground">{format(new Date(), "EEEE, MMMM do, yyyy")}</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </header>

        {/* Quick Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Clock className="w-24 h-24 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Next Up
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingToday ? (
                <div className="h-12 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : nextEvent ? (
                <div>
                  <p className="font-semibold text-lg truncate">{nextEvent.title}</p>
                  <p className="text-sm text-primary font-medium mt-1">
                    {format(parseISO(nextEvent.startTime), "h:mm a")}
                    {nextEvent.endTime ? ` - ${format(parseISO(nextEvent.endTime), "h:mm a")}` : ""}
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  <p className="text-muted-foreground text-sm font-medium">No more events today</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">You have some free time!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-foreground" />
                Today's Progress
              </CardTitle>
              <Link href="/calendar" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                Calendar <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {isLoadingToday ? (
                <div className="h-12 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-bold">{todayData?.completedCount || 0}</span>
                    <span className="text-muted-foreground mb-1 text-sm">/ {todayData?.totalCount || 0}</span>
                    <span className="text-xs text-muted-foreground mb-1 ml-1">completed</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${todayData?.totalCount ? ((todayData.completedCount / todayData.totalCount) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Events */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Today's Schedule</h2>
          </div>

          {isLoadingToday ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/40 animate-pulse rounded-xl border border-border/50" />
              ))}
            </div>
          ) : todayEvents.length > 0 ? (
            <div className="space-y-3">
              {todayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">Your day is clear</h3>
              <p className="text-sm text-muted-foreground mb-4">Add an event to get started.</p>
              <Button variant="outline" size="sm" onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Event
              </Button>
            </div>
          )}
        </section>

        {/* Upcoming Events */}
        {!isLoadingUpcoming && upcomingEvents && upcomingEvents.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Upcoming</h2>
              <Link href="/calendar" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 4).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </div>

      {showCreateModal && <EventModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
