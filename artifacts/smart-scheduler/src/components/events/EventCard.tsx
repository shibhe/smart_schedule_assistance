import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useUpdateEvent, useDeleteEvent, getListEventsQueryKey, getGetTodayEventsQueryKey, getGetUpcomingEventsQueryKey, getGetEventStatsQueryKey } from "@workspace/api-client-react";
import type { Event } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
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
  Check
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

const priorityConfig = {
  low: {
    color: "text-secondary border-secondary/30 bg-secondary/10",
    glow: "rgba(34, 211, 238, 0.2)", // cyan/teal
  },
  medium: {
    color: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    glow: "rgba(251, 191, 36, 0.2)", // amber
  },
  high: {
    color: "text-destructive border-destructive/30 bg-destructive/10",
    glow: "rgba(239, 68, 68, 0.2)", // red
  },
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
  
  const priorityInfo = priorityConfig[event.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const accentColor = event.color || "var(--primary)";

  if (variant === "compact") {
    return (
      <>
        <motion.div
          whileHover={{ y: -2 }}
          onClick={onClick}
          className={`group relative overflow-hidden rounded-xl border bg-card/60 backdrop-blur-sm p-3 transition-all cursor-pointer ${event.completed ? "opacity-50 grayscale-[0.5]" : "hover:border-primary/50 hover:shadow-[0_4px_20px_-10px_rgba(139,92,246,0.3)]"} ${className}`}
          style={{ borderLeftColor: accentColor, borderLeftWidth: "3px" }}
        >
          <div className="flex items-start gap-3">
            <button onClick={handleToggleComplete} className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-all hover:scale-110">
              {event.completed ? <CheckCircle2 className="w-5 h-5 text-primary shadow-[0_0_10px_rgba(139,92,246,0.5)] rounded-full" /> : <Circle className="w-5 h-5" />}
            </button>
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-semibold truncate text-white tracking-wide ${event.completed ? "line-through text-muted-foreground" : ""}`}>{event.title}</h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5 font-mono"><Clock className="w-3 h-3" />{timeFormatted}</span>
              </div>
            </div>
          </div>
        </motion.div>
        {showEditModal && <EventModal event={event} onClose={() => setShowEditModal(false)} />}
      </>
    );
  }

  return (
    <>
      <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }}>
        <Card
          onClick={onClick}
          className={`group relative overflow-hidden transition-all duration-300 cursor-pointer border bg-card/60 backdrop-blur-md ${event.completed ? "opacity-60 bg-muted/20 border-white/5" : "hover:border-primary/40 hover:shadow-[0_8px_30px_-12px_rgba(139,92,246,0.4)]"} ${className}`}
        >
          {/* Subtle top accent gradient instead of solid left border */}
          <div 
            className="absolute top-0 left-0 right-0 h-1 opacity-80" 
            style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} 
          />
          
          <div className="p-5">
            <div className="flex items-start gap-4">
              <button 
                onClick={handleToggleComplete} 
                className="mt-1 shrink-0 text-muted-foreground hover:text-primary transition-all hover:scale-110 relative"
              >
                {event.completed ? (
                  <>
                    <div className="absolute inset-0 bg-primary blur-md opacity-50 rounded-full" />
                    <CheckCircle2 className="w-6 h-6 text-primary relative z-10" />
                  </>
                ) : (
                  <Circle className="w-6 h-6 border-white/20" />
                )}
              </button>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className={`text-base font-bold tracking-wide truncate ${event.completed ? "line-through text-muted-foreground" : "text-white"}`}>
                    {event.title}
                  </h3>
                  <div className="flex items-center shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white hover:bg-white/10">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-white/10">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                          <Edit2 className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span>Modify</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleToggleComplete} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                          <Check className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span>{event.completed ? "Revert status" : "Mark complete"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          <span>Terminate</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{event.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-4 pt-4 border-t border-white/5 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                    <CalendarIcon className="w-3.5 h-3.5 text-primary/70" />
                    {format(dateObj, "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md font-mono">
                    <Clock className="w-3.5 h-3.5 text-primary/70" />
                    {timeFormatted}
                  </span>
                  {event.category && (
                    <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                      <Tag className="w-3.5 h-3.5 text-primary/70" />
                      <span className="uppercase tracking-wider text-[10px]">{event.category}</span>
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md max-w-[150px] truncate">
                      <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </span>
                  )}
                  <Badge 
                    variant="outline" 
                    className={`ml-auto uppercase tracking-wider text-[10px] font-bold px-2 py-0.5 shadow-sm ${priorityInfo.color}`}
                    style={{ boxShadow: `0 0 10px ${priorityInfo.glow}` }}
                  >
                    {event.priority}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
      {showEditModal && <EventModal event={event} onClose={() => setShowEditModal(false)} />}
    </>
  );
}
