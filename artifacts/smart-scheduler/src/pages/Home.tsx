import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useGetTodayEvents, getGetTodayEventsQueryKey, useGetUpcomingEvents, getGetUpcomingEventsQueryKey } from "@workspace/api-client-react";
import { EventCard } from "@/components/events/EventCard";
import { EventModal } from "@/components/events/EventModal";
import { Calendar as CalendarIcon, Clock, ArrowRight, Loader2, Plus, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useUser } from "@clerk/react";

export default function Home() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useUser();
  const firstName = user?.firstName || user?.username || "";

  const localDate = format(new Date(), "yyyy-MM-dd");
  const { data: todayData, isLoading: isLoadingToday } = useGetTodayEvents(
    { date: localDate },
    { query: { queryKey: getGetTodayEventsQueryKey({ date: localDate }) } }
  );

  const { data: upcomingEvents, isLoading: isLoadingUpcoming } = useGetUpcomingEvents({
    query: { queryKey: getGetUpcomingEventsQueryKey() }
  });

  const todayEvents = todayData?.events || [];
  const nextEvent = todayData?.nextEvent;
  const progressPercent = todayData?.totalCount ? ((todayData.completedCount / todayData.totalCount) * 100) : 0;

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {greeting}{firstName ? `, ${firstName}` : ""}.
            </h1>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2 shrink-0 h-11 px-6 rounded-xl font-semibold"
          >
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </header>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Up Next
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingToday ? (
                <div className="h-12 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : nextEvent ? (
                <div className="space-y-2">
                  <p className="font-bold text-xl text-foreground truncate">{nextEvent.title}</p>
                  <div className="inline-flex items-center gap-2 bg-muted border border-border px-3 py-1.5 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-sm text-foreground font-mono font-medium">
                      {format(parseISO(nextEvent.startTime), "HH:mm")}
                      {nextEvent.endTime ? ` – ${format(parseISO(nextEvent.endTime), "HH:mm")}` : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-foreground font-semibold">All clear for today</p>
                  <p className="text-sm text-muted-foreground mt-0.5">No more events scheduled.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                Today's Progress
              </CardTitle>
              <Link href="/calendar" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingToday ? (
                <div className="h-12 flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-foreground leading-none">{todayData?.completedCount || 0}</span>
                    <span className="text-muted-foreground text-sm mb-0.5">/ {todayData?.totalCount || 0} done</span>
                  </div>
                  <div className="h-2 bg-muted border border-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Events */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">Today</h2>
            <div className="h-px bg-border flex-1" />
          </div>

          {isLoadingToday ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-xl border border-border" />
              ))}
            </div>
          ) : todayEvents.length > 0 ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
              }}
              className="grid gap-3"
            >
              {todayEvents.map((event) => (
                <motion.div key={event.id} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
                  <EventCard event={event} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-14 bg-card rounded-2xl border border-border border-dashed">
              <div className="w-14 h-14 bg-muted border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Nothing scheduled today</h3>
              <p className="text-sm text-muted-foreground mb-5">Add your first event to get started.</p>
              <Button variant="outline" onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add event
              </Button>
            </div>
          )}
        </section>

        {/* Upcoming Events */}
        {!isLoadingUpcoming && upcomingEvents && upcomingEvents.length > 0 && (
          <section className="space-y-4 pb-10">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">Upcoming</h2>
              <div className="h-px bg-border flex-1" />
              <Link href="/calendar" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                See all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcomingEvents.slice(0, 4).map((event) => (
                <EventCard key={event.id} event={event} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </div>

      {showCreateModal && <EventModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
