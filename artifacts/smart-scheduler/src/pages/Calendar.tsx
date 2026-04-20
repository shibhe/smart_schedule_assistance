import { useState } from "react";
import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import type { Event } from "@workspace/api-client-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { EventModal } from "@/components/events/EventModal";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const selectedDateEvents = events.filter((e) => isSameDay(new Date(e.date), selectedDate));

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
    <div className="flex-1 h-full flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Left side: Calendar Grid */}
      <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 border-r overflow-y-auto min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-sm w-32 text-center">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border shadow-sm">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}

          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-card min-h-[90px] p-2" />
          ))}

          {monthDays.map((date) => {
            const dayEvents = events.filter((e) => isSameDay(new Date(e.date), date));
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <div
                key={date.toString()}
                onClick={() => handleDayClick(date)}
                className={`group bg-card min-h-[90px] p-2 cursor-pointer transition-colors hover:bg-accent/50 relative ${
                  isSelected ? "ring-2 ring-primary ring-inset z-10" : ""
                }`}
              >
                <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-primary text-primary-foreground" : ""}`}>
                  {format(date, "d")}
                </div>
                <div className="space-y-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="text-[10px] px-1.5 py-0.5 rounded truncate"
                      style={{
                        backgroundColor: event.color ? `${event.color}20` : "hsl(var(--primary) / 0.1)",
                        color: event.color || "hsl(var(--primary))",
                        border: `1px solid ${event.color ? `${event.color}40` : "hsl(var(--primary) / 0.2)"}`,
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1 font-medium">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {Array.from({ length: (7 - ((monthEnd.getDay() + 1) % 7)) % 7 }).map((_, i) => (
            <div key={`pad-end-${i}`} className="bg-card min-h-[90px] p-2" />
          ))}
        </div>
      </div>

      {/* Right side: Day Details + CRUD */}
      <div className="w-full md:w-80 lg:w-96 bg-card flex flex-col h-full shrink-0 border-t md:border-t-0">
        <div className="p-5 border-b flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{format(selectedDate, "EEEE")}</h2>
            <p className="text-muted-foreground text-sm">{format(selectedDate, "MMMM do, yyyy")}</p>
            {selectedDateEvents.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button size="sm" onClick={handleAddEvent} className="gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" />
            Add Event
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="default"
                  onClick={() => handleEditEvent(event)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <CalendarDays className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Nothing scheduled</p>
                <p className="text-xs mt-1 mb-4">Tap "Add Event" to create one for this day.</p>
                <Button variant="outline" size="sm" onClick={handleAddEvent} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add Event
                </Button>
              </div>
            )}
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
