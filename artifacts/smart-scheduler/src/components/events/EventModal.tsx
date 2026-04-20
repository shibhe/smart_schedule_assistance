import { useState, useEffect, useMemo } from "react";
import {
  useCreateEvent, useUpdateEvent,
  useListEvents,
  getListEventsQueryKey,
  getGetTodayEventsQueryKey, getGetUpcomingEventsQueryKey, getGetEventStatsQueryKey,
} from "@workspace/api-client-react";
import type { Event } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
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
import { Loader2, Sparkles, AlertTriangle, Clock } from "lucide-react";

interface EventModalProps {
  event?: Event;
  defaultDate?: string;
  onClose: () => void;
}

const CATEGORIES = ["work", "personal", "health", "social", "learning", "other"];
const PRIORITIES = ["low", "medium", "high"];

function toMins(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMins(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function overlaps(s1: number, e1: number, s2: number, e2: number): boolean {
  return s1 < e2 && s2 < e1;
}

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
        startTime: event.startTime ? format(parseISO(event.startTime), "HH:mm") : "09:00",
        endTime: event.endTime ? format(parseISO(event.endTime), "HH:mm") : "10:00",
        category: event.category || "work",
        priority: event.priority || "medium",
        location: event.location || "",
        color: event.color || "#6366f1",
      });
    }
  }, [event]);

  const { data: dateEvents = [] } = useListEvents(
    { date: form.date },
    { query: { queryKey: getListEventsQueryKey({ date: form.date }), enabled: !!form.date } }
  );

  const conflictingEvents = useMemo(() => {
    const start = toMins(form.startTime);
    const end = form.endTime ? toMins(form.endTime) : start + 60;
    if (start >= end) return [];
    return dateEvents.filter((e) => {
      if (isEditing && event && e.id === event.id) return false;
      const eStart = toMins(format(parseISO(e.startTime), "HH:mm"));
      const eEnd = e.endTime ? toMins(format(parseISO(e.endTime), "HH:mm")) : eStart + 60;
      return overlaps(start, end, eStart, eEnd);
    });
  }, [dateEvents, form.startTime, form.endTime, event, isEditing]);

  const suggestedSlots = useMemo(() => {
    const busy = dateEvents
      .filter((e) => !(isEditing && event && e.id === event.id))
      .map((e) => {
        const s = toMins(format(parseISO(e.startTime), "HH:mm"));
        const en = e.endTime ? toMins(format(parseISO(e.endTime), "HH:mm")) : s + 60;
        return [s, en] as [number, number];
      });
    const slots: Array<{ start: string; end: string }> = [];
    for (let s = 480; s <= 1200 && slots.length < 3; s += 30) {
      const e = s + 60;
      if (!busy.some(([bs, be]) => overlaps(s, e, bs, be))) {
        slots.push({ start: fromMins(s), end: fromMins(e) });
      }
    }
    return slots;
  }, [dateEvents, event, isEditing]);

  const applySlot = (slot: { start: string; end: string }) => {
    setForm((f) => ({ ...f, startTime: slot.start, endTime: slot.end }));
  };

  const toISODateTime = (date: string, time: string) => `${date}T${time}:00`;

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
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-background border-border shadow-lg">
        <DialogHeader className="px-6 py-5 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            {isEditing ? "Edit Event" : (
              <>
                <Sparkles className="w-4 h-4 text-primary" />
                New Event
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Event title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              autoFocus
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional details"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-3 sm:col-span-1">
              <Label htmlFor="date" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
                className="h-10 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startTime" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Start</Label>
              <Input
                id="startTime"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                required
                className="h-10 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">End</Label>
              <Input
                id="endTime"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="h-10 font-mono text-sm"
              />
            </div>
          </div>

          {conflictingEvents.length > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
              <div className="text-xs leading-relaxed">
                <span className="font-semibold">Time conflict — </span>
                overlaps with{" "}
                {conflictingEvents.map((e, i) => (
                  <span key={e.id}>
                    {i > 0 && ", "}
                    <strong>{e.title}</strong>{" "}
                    ({format(parseISO(e.startTime), "h:mm a")}
                    {e.endTime ? `–${format(parseISO(e.endTime), "h:mm a")}` : ""})
                  </span>
                ))}
              </div>
            </div>
          )}

          {suggestedSlots.length > 0 && (
            <div className="space-y-2 pb-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Available slots for this day
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedSlots.map((slot) => {
                  const isSelected = form.startTime === slot.start && form.endTime === slot.end;
                  return (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => applySlot(slot)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted border-border text-foreground hover:bg-accent hover:border-border"
                      }`}
                    >
                      {slot.start} – {slot.end}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger className="h-10">
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
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</Label>
              <Input
                id="location"
                placeholder="Optional location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="color" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Color</Label>
              <div className="flex gap-2 items-center">
                <div className="relative overflow-hidden rounded-md border border-border w-10 h-10 shrink-0">
                  <Input
                    id="color"
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer p-0 border-0"
                  />
                </div>
                <div
                  className="flex-1 h-10 rounded-md border px-3 flex items-center"
                  style={{ backgroundColor: `${form.color}18`, borderColor: `${form.color}50` }}
                >
                  <span className="font-mono text-xs tracking-wider" style={{ color: form.color }}>
                    {form.color.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border gap-2 sm:gap-2 mt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending || !form.title} className="min-w-[110px]">
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isEditing ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
