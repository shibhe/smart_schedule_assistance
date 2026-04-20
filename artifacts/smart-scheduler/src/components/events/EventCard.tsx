import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useUpdateEvent, useDeleteEvent, getListEventsQueryKey, getGetTodayEventsQueryKey, getGetUpcomingEventsQueryKey, getGetEventStatsQueryKey } from "@workspace/api-client-react";
import type { Event } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Clock,
  Tag,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  MoreVertical,
  MapPin,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EventModal } from "./EventModal";

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "compact";
}

const priorityColors = {
  low: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  high: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export function EventCard({ event, onClick, className = "", variant = "default" }: EventCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTodayEventsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetUpcomingEventsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetEventStatsQueryKey() });
  };

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateEvent.mutate(
      { id: event.id, data: { completed: !event.completed } },
      { onSuccess: invalidateAll }
    );
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${event.title}"?`)) return;
    deleteEvent.mutate({ id: event.id }, { onSuccess: invalidateAll });
  };

  const formatTime = (iso: string) => {
    try { return format(parseISO(iso), "h:mm a"); }
    catch { return iso; }
  };

  const timeFormatted = `${formatTime(event.startTime)}${event.endTime ? ` – ${formatTime(event.endTime)}` : ""}`;
  const dateObj = parseISO(event.date);

  if (variant === "compact") {
    return (
      <>
        <div
          onClick={onClick}
          className={`group relative overflow-hidden rounded-lg border bg-card p-3 transition-all hover:shadow-md cursor-pointer ${event.completed ? "opacity-60" : ""} ${className}`}
          style={{ borderLeftColor: event.color || "var(--primary)", borderLeftWidth: "4px" }}
        >
          <div className="flex items-start gap-3">
            <button onClick={handleToggleComplete} className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors">
              {event.completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4" />}
            </button>
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium truncate ${event.completed ? "line-through text-muted-foreground" : ""}`}>{event.title}</h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeFormatted}</span>
              </div>
            </div>
          </div>
        </div>
        {showEditModal && <EventModal event={event} onClose={() => setShowEditModal(false)} />}
      </>
    );
  }

  return (
    <>
      <Card
        onClick={onClick}
        className={`group relative overflow-hidden transition-all hover:shadow-md cursor-pointer border-l-4 ${event.completed ? "opacity-60 bg-muted/30" : ""} ${className}`}
        style={{ borderLeftColor: event.color || "var(--primary)" }}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <button onClick={handleToggleComplete} className="mt-1 shrink-0 text-muted-foreground hover:text-primary transition-colors">
              {event.completed ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
            </button>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`font-semibold truncate ${event.completed ? "line-through text-muted-foreground" : ""}`}>
                  {event.title}
                </h3>
                <div className="flex items-center shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="w-8 h-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleToggleComplete}>
                        {event.completed ? "Mark as incomplete" : "Mark as complete"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {event.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {format(dateObj, "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {timeFormatted}
                </span>
                {event.category && (
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    {event.category}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.location}
                  </span>
                )}
                <Badge variant="outline" className={`ml-auto capitalize ${priorityColors[event.priority as keyof typeof priorityColors] || ""}`}>
                  {event.priority}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>
      {showEditModal && <EventModal event={event} onClose={() => setShowEditModal(false)} />}
    </>
  );
}
