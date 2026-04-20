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
import { Loader2, Sparkles } from "lucide-react";

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
    color: "#8b5cf6", // Primary violet
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
        color: event.color || "#8b5cf6",
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
      <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl p-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <DialogHeader className="p-6 border-b border-white/5 relative z-10 bg-black/20">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-wide">
            {isEditing ? (
              "Modify Directive"
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-primary" />
                New Directive
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 relative z-10">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Identifier *</Label>
            <Input
              id="title"
              placeholder="Event designation"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              autoFocus
              className="bg-black/40 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-base py-6"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Parameters</Label>
            <Textarea
              id="description"
              placeholder="Optional parameters and details"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="resize-none bg-black/40 border-white/10 focus-visible:ring-primary focus-visible:border-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-3 sm:col-span-1">
              <Label htmlFor="date" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Date *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
                className="bg-black/40 border-white/10 focus-visible:ring-primary focus-visible:border-primary font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Initiate</Label>
              <Input
                id="startTime"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                required
                className="bg-black/40 border-white/10 focus-visible:ring-primary focus-visible:border-primary font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Terminate</Label>
              <Input
                id="endTime"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="bg-black/40 border-white/10 focus-visible:ring-primary focus-visible:border-primary font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Classification</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="bg-black/40 border-white/10 focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="uppercase tracking-wider text-xs font-bold focus:bg-white/10">{c}</SelectItem>
                  ))}
             </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger className="bg-black/40 border-white/10 focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10">
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="uppercase tracking-wider text-xs font-bold focus:bg-white/10">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Coordinates</Label>
              <Input
                id="location"
                placeholder="Optional location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="bg-black/40 border-white/10 focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Color Tag</Label>
              <div className="flex gap-3 items-center">
                <div className="relative overflow-hidden rounded-md border border-white/20 w-10 h-10 shrink-0 shadow-sm" style={{ boxShadow: `0 0 10px ${form.color}40` }}>
                  <Input
                    id="color"
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer p-0 border-0"
                  />
                </div>
                <div
                  className="flex-1 h-10 rounded-md border backdrop-blur-sm px-3 flex items-center"
                  style={{ backgroundColor: `${form.color}20`, borderColor: `${form.color}40` }}
                >
                  <span className="font-mono text-xs tracking-wider" style={{ color: form.color }}>{form.color.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-white/5 gap-2 sm:gap-0 mt-6">
            <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-white/5 hover:text-white">Abort</Button>
            <Button 
              type="submit" 
              disabled={isPending || !form.title}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wide shadow-[0_0_15px_rgba(139,92,246,0.4)]"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEditing ? "Commit Changes" : "Initialize Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
