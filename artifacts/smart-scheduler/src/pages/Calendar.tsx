import { useState } from "react";
import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: events = [], isLoading } = useListEvents(
    { 
      start: format(monthStart, 'yyyy-MM-dd'),
      end: format(monthEnd, 'yyyy-MM-dd')
    },
    { query: { queryKey: getListEventsQueryKey({ start: format(monthStart, 'yyyy-MM-dd'), end: format(monthEnd, 'yyyy-MM-dd') }) } }
  );

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const selectedDateEvents = events.filter(e => isSameDay(new Date(e.date), selectedDate));

  return (
    <div className="flex-1 h-full flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Left side: Calendar Grid */}
      <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 border-r overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-sm w-32 text-center">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border shadow-sm">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
          
          {/* Padding for first day of month offset */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-card min-h-[100px] p-2" />
          ))}

          {monthDays.map(date => {
            const dayEvents = events.filter(e => isSameDay(new Date(e.date), date));
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <div 
                key={date.toString()} 
                onClick={() => setSelectedDate(date)}
                className={`bg-card min-h-[100px] p-2 cursor-pointer transition-colors hover:bg-accent/50 ${isSelected ? 'ring-2 ring-primary ring-inset relative z-10' : ''}`}
              >
                <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                  {format(date, 'd')}
                </div>
                <div className="space-y-1 mt-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div 
                      key={event.id} 
                      className="text-[10px] px-1.5 py-0.5 rounded truncate bg-primary/10 text-primary border border-primary/20"
                      style={event.color ? { backgroundColor: `${event.color}20`, color: event.color, borderColor: `${event.color}40` } : undefined}
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
          
          {/* Padding for end of month */}
          {Array.from({ length: (7 - (monthEnd.getDay() + 1)) % 7 }).map((_, i) => (
            <div key={`pad-end-${i}`} className="bg-card min-h-[100px] p-2" />
          ))}
        </div>
      </div>

      {/* Right side: Day Details */}
      <div className="w-full md:w-80 lg:w-96 bg-card flex flex-col h-full shrink-0">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold tracking-tight">{format(selectedDate, "EEEE")}</h2>
          <p className="text-muted-foreground text-sm">{format(selectedDate, "MMMM do, yyyy")}</p>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : selectedDateEvents.length > 0 ? (
              selectedDateEvents.map(event => (
                <EventCard key={event.id} event={event} variant="compact" />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm font-medium">No events scheduled</p>
                <p className="text-xs mt-1">Select another day or ask the AI to schedule something.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
