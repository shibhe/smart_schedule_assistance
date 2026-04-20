import { useState } from "react";
import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import type { Event } from "@workspace/api-client-react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Loader2, CalendarDays, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { EventModal } from "@/components/events/EventModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: events = [], isLoading } = useListEvents(
    {
      start: format(monthStart, "yyyy-MM-dd"),
      end: format(monthEnd, "yyyy-MM-dd"),
    },
    {
      query: {
        queryKey: getListEventsQueryKey({
          start: format(monthStart, "yyyy-MM-dd"),
          end: format(monthEnd, "yyyy-MM-dd"),
        }),
      },
    }
  );

  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const selectedDateEvents = events.filter((e) => isSameDay(parseISO(e.date), selectedDate));

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddEvent = () => {
    setShowCreateModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  return (
    <div className="flex-1 h-full flex flex-col xl:flex-row overflow-hidden bg-transparent">
      {/* Left side: Calendar Grid */}
      <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 border-r border-white/5 overflow-y-auto custom-scrollbar min-w-0 bg-background/50 backdrop-blur-sm">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Timeline Matrix</h1>
            <p className="text-xs font-mono uppercase tracking-widest text-primary mt-1 flex items-center gap-2">
              <Server className="w-3 h-3" /> Grid synchronized
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}
              className="text-xs font-bold uppercase tracking-widest text-primary border border-primary/30 hover:bg-primary/10 hover:text-primary h-9 px-4 rounded-xl"
            >
              Today
            </Button>
            <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 shadow-inner">
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="hover:bg-white/10 text-white rounded-lg h-9 w-9">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="font-bold text-sm uppercase tracking-widest w-40 text-center text-white font-mono">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="hover:bg-white/10 text-white rounded-lg h-9 w-9">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-7 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="bg-black/60 p-3 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/5">
              {day}
            </div>
          ))}

          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-card/30 min-h-[100px] p-2 opacity-50" />
          ))}

          {monthDays.map((date) => {
            const dayEvents = events.filter((e) => isSameDay(parseISO(e.date), date));
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <div
                key={date.toString()}
                onClick={() => handleDayClick(date)}
                className={`group bg-card/60 backdrop-blur-md min-h-[120px] p-3 cursor-pointer transition-all hover:bg-white/5 relative border-b border-r border-transparent ${
                  isSelected ? "bg-primary/5 before:absolute before:inset-0 before:border-2 before:border-primary before:rounded-lg before:z-20 before:pointer-events-none" : ""
                }`}
              >
                <div className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full mb-2 ${
                  isToday 
                    ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
                    : isSelected ? "text-primary bg-primary/20" : "text-muted-foreground group-hover:text-white"
                }`}>
                  {format(date, "d")}
                </div>
                
                <div className="space-y-1.5 mt-2 relative z-10">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`text-[10px] px-2 py-1 rounded-md font-bold truncate tracking-wide border shadow-sm ${event.completed ? 'opacity-50 grayscale' : ''}`}
                      style={{
                        backgroundColor: event.color ? `${event.color}15` : "hsl(var(--primary) / 0.1)",
                        color: event.color || "hsl(var(--primary))",
                        borderColor: event.color ? `${event.color}30` : "hsl(var(--primary) / 0.2)",
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] text-muted-foreground px-1 font-mono uppercase tracking-wider mt-2">
                      + {dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {Array.from({ length: (7 - ((monthEnd.getDay() + 1) % 7)) % 7 }).map((_, i) => (
            <div key={`pad-end-${i}`} className="bg-card/30 min-h-[100px] p-2 opacity-50" />
          ))}
        </div>
      </div>

      {/* Right side: Day Details + CRUD */}
      <div className="w-full xl:w-[450px] bg-black/40 backdrop-blur-xl flex flex-col h-full shrink-0 border-t xl:border-t-0 border-white/5 relative z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.3)]">
        <div className="p-6 md:p-8 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-1">{format(selectedDate, "EEEE")}</h2>
              <p className="text-primary font-mono text-xs uppercase tracking-widest">{format(selectedDate, "MMMM do, yyyy")}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-col shadow-inner">
              <span className="text-xs font-bold text-muted-foreground uppercase">{format(selectedDate, "MMM")}</span>
              <span className="text-xl font-bold text-white leading-none">{format(selectedDate, "d")}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="text-xs font-mono uppercase text-white/70">
                {selectedDateEvents.length} Operation{selectedDateEvents.length !== 1 ? "s" : ""}
              </span>
            </div>
            <Button size="sm" onClick={handleAddEvent} className="gap-2 shrink-0 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-lg">
              <Plus className="w-4 h-4" />
              Initialize
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 md:px-6 py-6 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </motion.div>
            ) : selectedDateEvents.length > 0 ? (
              <motion.div 
                initial="hidden" 
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                }}
                className="space-y-4 pb-8"
              >
                {selectedDateEvents.map((event) => (
                  <motion.div key={event.id} variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}>
                    <EventCard
                      event={event}
                      variant="default"
                      onClick={() => handleEditEvent(event)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 text-muted-foreground">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CalendarDays className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-base font-bold text-white tracking-wide">No operations logged</p>
                <p className="text-xs font-mono uppercase tracking-widest mt-2 mb-6 opacity-60">Timeline sector clear</p>
                <Button variant="outline" onClick={handleAddEvent} className="gap-2 bg-transparent border-primary/30 text-primary hover:bg-primary/10 hover:text-primary">
                  <Plus className="w-4 h-4" />
                  Create Entry
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </div>

      {showCreateModal && (
        <EventModal
          defaultDate={format(selectedDate, "yyyy-MM-dd")}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingEvent && (
        <EventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}
