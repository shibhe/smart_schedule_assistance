import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useGetTodayEvents, getGetTodayEventsQueryKey, useGetUpcomingEvents, getGetUpcomingEventsQueryKey } from "@workspace/api-client-react";
import { EventCard } from "@/components/events/EventCard";
import { EventModal } from "@/components/events/EventModal";
import { Calendar as CalendarIcon, Clock, ArrowRight, Loader2, Plus, TerminalSquare, Activity } from "lucide-react";
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

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-transparent">
      <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-mono text-sm tracking-widest uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
              System Online
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white font-sans">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}{firstName ? `, ${firstName}` : ""}.
            </h1>
            <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
              {format(new Date(), "EEEE, MMMM do, yyyy")} // Local Time
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)} 
            className="gap-2 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wide shadow-[0_0_20px_rgba(139,92,246,0.3)] h-12 px-6 rounded-xl"
          >
            <Plus className="w-5 h-5" />
            Initialize Event
          </Button>
        </header>

        {/* Telemetry Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card/40 backdrop-blur-md border-white/5 shadow-xl relative overflow-hidden group hover:border-primary/30 transition-colors duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full pointer-events-none group-hover:bg-primary/30 transition-colors" />
            
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-xs font-bold font-mono tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                <TerminalSquare className="w-4 h-4 text-primary" />
                Next Up
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 pt-2">
              {isLoadingToday ? (
                <div className="h-16 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm font-mono text-muted-foreground animate-pulse">Scanning schedule...</span>
                </div>
              ) : nextEvent ? (
                <div className="space-y-3">
                  <p className="font-bold text-2xl text-white tracking-wide truncate">{nextEvent.title}</p>
                  <div className="inline-flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
                    <Clock className="w-4 h-4 text-secondary" />
                    <p className="text-sm text-secondary font-mono font-medium tracking-wider">
                      {format(parseISO(nextEvent.startTime), "HH:mm")}
                      {nextEvent.endTime ? ` - ${format(parseISO(nextEvent.endTime), "HH:mm")}` : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-3">
                  <p className="text-white text-lg font-bold tracking-wide">Objectives complete</p>
                  <p className="text-sm font-mono text-muted-foreground mt-1">Awaiting new directives.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-md border-white/5 shadow-xl relative overflow-hidden group hover:border-secondary/30 transition-colors duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-transparent opacity-50" />
            
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
              <CardTitle className="text-xs font-bold font-mono tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-secondary" />
                Today's Progress
              </CardTitle>
              <Link href="/calendar" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-white flex items-center gap-1 transition-colors">
                View Log <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="relative z-10 pt-2">
              {isLoadingToday ? (
                <div className="h-16 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold text-white leading-none">{todayData?.completedCount || 0}</span>
                    <span className="text-muted-foreground font-mono text-sm mb-1">/ {todayData?.totalCount || 0}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1.5 ml-1">Done</span>
                  </div>
                  
                  <div className="h-3 bg-black/50 border border-white/10 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMGwyMCA0MEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-50" />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                      className="h-full bg-secondary relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] -translate-x-full animate-[shimmer_2s_infinite]" />
                    </motion.div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Directives */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-wide text-white">Active Directives</h2>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {isLoadingToday ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl border border-white/5" />
              ))}
            </div>
          ) : todayEvents.length > 0 ? (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              className="grid gap-4"
            >
              {todayEvents.map((event) => (
                <motion.div key={event.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <EventCard event={event} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 bg-card/20 backdrop-blur-sm rounded-2xl border border-white/5 border-dashed">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CalendarIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 tracking-wide">Timeline clear</h3>
              <p className="text-sm font-mono text-muted-foreground mb-6 max-w-sm mx-auto">No operations scheduled for current cycle.</p>
              <Button variant="outline" onClick={() => setShowCreateModal(true)} className="gap-2 bg-transparent border-white/20 hover:bg-white/10 hover:text-white">
                <Plus className="w-4 h-4" />
                Initialize
              </Button>
            </div>
          )}
        </section>

        {/* Future Pipeline */}
        {!isLoadingUpcoming && upcomingEvents && upcomingEvents.length > 0 && (
          <section className="space-y-6 pt-4 pb-12">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold tracking-wide text-white">Pending Operations</h2>
              <div className="h-px bg-white/10 flex-1" />
              <Link href="/calendar" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white flex items-center gap-1 transition-colors">
                Full Scope <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
