import { useState, useEffect } from "react";
import { useCreateEvent, useUpdateEvent, getListEventsQueryKey, getGetTodayEventsQueryKey, getGetUpcomingEventsQueryKey, getGetEventStatsQueryKey } from "@workspace/api-client-react";
import type { Event } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface EventModalProps {
  event?: Event;
  defaultDate?: string;
  onClose: () => void;
}

const CATEGORIES = ["work", "personal", "health", "social", "learning", "other"];
const PRIORITIES = ["low", "medium", "high"];

export function EventModal({ event, defaultDate, onClose }: EventModalProps) {
  const queryClient = useQueryClient();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const isEditing = !!event;

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: defaultDate || format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "10:00",
    category: "work",
    priority: "medium",
    location: "",
    color: "#6366f1",
  });

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || "",
        description: event.description || "",
        date: event.date || format(new Date(), "yyyy-MM-dd"),
        startTime: event.startTime ? format(new Date(event.startTime), "HH:mm") : "09:00",
        endTime: event.endTime ? format(new Date(event.endTime), "HH:mm") : "10:00",
        category: event.category || "work",
        priority: event.priority || "medium",
        location: event.location || "",
        color: event.color || "#6366f1",
      });
    }
  }, [event]);

  const toISODateTime = (date: string, time: string) => {
    return `${date}T${time}:00`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      title: form.title,
      description: form.description || undefined,
      date: form.date,
      startTime: toISODateTime(form.date, form.startTime),
      endTime: form.endTime ? toISODateTime(form.date, form.endTime) : undefined,
      category: form.category,
      priority: form.priority as "low" | "medium" | "high",
      location: form.location || undefined,
      color: form.color,
    };

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTodayEventsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetUpcomingEventsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetEventStatsQueryKey() });
      onClose();
    };

    if (isEditing && event) {
      updateEvent.mutate({ id: event.id, data: payload }, { onSuccess: invalidate });
    } else {
      createEvent.mutate({ data: payload }, { onSuccess: invalidate });
    }
  };

  const isPending = createEvent.isPending || updateEvent.isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "New Event"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Event title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2 col-span-3 sm:col-span-1">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start</Label>
              <Input
                id="startTime"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End</Label>
              <Input
                id="endTime"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Optional location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="color"
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <div
                  className="flex-1 h-9 rounded-md border"
                  style={{ backgroundColor: form.color + "20", borderColor: form.color + "40" }}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending || !form.title}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEditing ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
