import { useState } from "react";
import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import type { Event } from "@workspace/api-client-react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isBefore, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Loader2, CalendarDays } from "lucide-react";
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
  const today = startOfDay(new Date());

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

  const startPad = monthStart.getDay();
  const endPad = 42 - startPad - monthDays.length;

  const handleDayClick = (date: Date) => {
    if (isBefore(date, today)) return;
    setSelectedDate(date);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  return (
    <div className="flex-1 h-full flex flex-col xl:flex-row overflow-hidden bg-background">
      {/* Left side: Calendar Grid */}
      <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 border-r border-border overflow-y-auto custom-scrollbar min-w-0">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-1">
              {format(currentDate, "MMMM yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}
              className="text-xs font-semibold h-9 px-4 rounded-xl border-border hover:bg-muted"
            >
              Today
            </Button>
            <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm">
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="hover:bg-muted rounded-lg h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-sm w-36 text-center text-foreground">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="hover:bg-muted rounded-lg h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border shadow-sm">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="bg-muted p-2 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {day}
              </div>
            ))}

            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} className="bg-card min-h-[90px] p-2 opacity-40" />
            ))}

            {monthDays.map((date) => {
              const dayEvents = events.filter((e) => isSameDay(parseISO(e.date), date));
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              const isPast = isBefore(date, today);

              return (
                <div
                  key={date.toString()}
                  onClick={() => handleDayClick(date)}
                  className={`group bg-card min-h-[90px] p-2 relative transition-all ${
                    isPast
                      ? "opacity-40 cursor-not-allowed"
                      : "cursor-pointer hover:bg-muted/50"
                  } ${isSelected && !isPast ? "ring-2 ring-inset ring-primary" : ""}`}
                >
                  <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1.5 ${
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : isSelected && !isPast
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground"
                  }`}>
                    {format(date, "d")}
                  </div>

                  <div className="space-y-1 relative z-10">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold truncate border ${event.completed ? 'opacity-40 line-through' : ''}`}
                        style={{
                          backgroundColor: event.color ? `${event.color}18` : "hsl(var(--muted))",
                          color: event.color || "hsl(var(--foreground))",
                          borderColor: event.color ? `${event.color}30` : "hsl(var(--border))",
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-muted-foreground px-1 font-mono uppercase tracking-wider">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {Array.from({ length: endPad }).map((_, i) => (
              <div key={`pad-end-${i}`} className="bg-card min-h-[90px] p-2 opacity-40" />
            ))}
          </div>
        )}
      </div>

      {/* Right side: Selected Day Panel */}
      <div className="w-full xl:w-96 flex flex-col border-t xl:border-t-0 xl:border-l border-border bg-card">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-foreground text-lg">
              {format(selectedDate, "EEEE, MMM d")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono uppercase tracking-widest">
              {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="gap-2 h-9 px-4 rounded-xl font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <EventCard event={event} onClick={() => handleEditEvent(event)} variant="compact" />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border">
                    <CalendarDays className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">No events</p>
                  <p className="text-xs text-muted-foreground mb-4">Nothing scheduled for this day.</p>
                  {!isBefore(selectedDate, today) && (
                    <Button variant="outline" size="sm" onClick={() => setShowCreateModal(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add event
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
