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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EventModal } from "./EventModal";

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "compact";
}

const priorityConfig = {
  low: { color: "text-green-700 border-green-200 bg-green-50" },
  medium: { color: "text-amber-700 border-amber-200 bg-amber-50" },
  high: { color: "text-red-700 border-red-200 bg-red-50" },
};

export function EventCard({ event, onClick, className = "", variant = "default" }: EventCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteEvent.mutate({ id: event.id }, { onSuccess: invalidateAll });
  };

  const formatTime = (iso: string) => {
    try { return format(parseISO(iso), "h:mm a"); }
    catch { return iso; }
  };

  const timeFormatted = `${formatTime(event.startTime)}${event.endTime ? ` – ${formatTime(event.endTime)}` : ""}`;
  const dateObj = parseISO(event.date);
  const priorityInfo = priorityConfig[event.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const accentColor = event.color || "hsl(var(--primary))";

  if (variant === "compact") {
    return (
      <>
        <motion.div
          whileHover={{ y: -1 }}
          onClick={onClick}
          className={`group relative overflow-hidden rounded-xl border bg-card p-3 transition-all cursor-pointer shadow-sm ${
            event.completed ? "opacity-50" : "hover:shadow-md"
          } ${className}`}
          style={{ borderLeftColor: accentColor, borderLeftWidth: "3px" }}
        >
          <div className="flex items-start gap-3">
            <button onClick={handleToggleComplete} className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors">
              {event.completed
                ? <CheckCircle2 className="w-5 h-5 text-primary" />
                : <Circle className="w-5 h-5" />}
            </button>
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-semibold truncate text-foreground ${event.completed ? "line-through text-muted-foreground" : ""}`}>
                {event.title}
              </h4>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="font-mono">{timeFormatted}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {showEditModal && <EventModal event={event} onClose={() => setShowEditModal(false)} />}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this event?</AlertDialogTitle>
              <AlertDialogDescription>
                "{event.title}" will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <motion.div whileHover={{ y: -1, transition: { duration: 0.15 } }}>
        <Card
          onClick={onClick}
          className={`group relative overflow-hidden transition-all duration-200 cursor-pointer border bg-card shadow-sm ${
            event.completed ? "opacity-60" : "hover:shadow-md"
          } ${className}`}
        >
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: accentColor }}
          />

          <div className="p-4 pt-5">
            <div className="flex items-start gap-3">
              <button
                onClick={handleToggleComplete}
                className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
              >
                {event.completed
                  ? <CheckCircle2 className="w-5 h-5 text-primary" />
                  : <Circle className="w-5 h-5" />}
              </button>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`text-sm font-bold truncate ${event.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {event.title}
                  </h3>
                  <div className="flex items-center shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }} className="cursor-pointer">
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleToggleComplete} className="cursor-pointer">
                          <Check className="w-4 h-4 mr-2" />
                          {event.completed ? "Mark incomplete" : "Mark complete"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {event.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{event.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {format(dateObj, "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {timeFormatted}
                  </span>
                  {event.category && (
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span className="capitalize">{event.category}</span>
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1 max-w-[120px] truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={`ml-auto capitalize text-[10px] font-semibold px-2 py-0.5 ${priorityInfo.color}`}
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
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              "{event.title}" will be permanently removed from your calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
