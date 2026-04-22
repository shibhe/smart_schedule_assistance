import { useEffect, useRef, useCallback } from "react";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { FloatingChatbot } from "@/components/chat/FloatingChatbot";
import Home from "@/pages/Home";
import Calendar from "@/pages/Calendar";
import Stats from "@/pages/Stats";
import Suggestions from "@/pages/Suggestions";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import NotFound from "@/pages/not-found";
import { useWebSocket } from "@/hooks/useWebSocket";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

// Initialize API client with token getter
setAuthTokenGetter(() => localStorage.getItem("auth_token"));

function AuthQueryClientCacheInvalidator() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<number | null>(undefined);

  useEffect(() => {
    const userId = user?.id ?? null;
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
      qc.clear();
    }
    prevUserIdRef.current = userId;
  }, [user, qc]);

  return null;
}

function PushNotificationBanner() {
  const { permission, isSupported, subscribe } = usePushNotifications();
  if (!isSupported || permission !== "default") return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border shadow-lg text-sm max-w-sm w-[calc(100%-2rem)] animate-in slide-in-from-top-4 duration-500">
      <span className="text-lg">🔔</span>
      <span className="flex-1 text-muted-foreground text-xs">Enable push notifications for event reminders</span>
      <button
        onClick={subscribe}
        className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold transition-colors hover:bg-primary/90"
      >
        Enable
      </button>
    </div>
  );
}

function ReminderNotifier() {
  const { toast } = useToast();
  const handler = useCallback((e: Event) => {
    const { event } = (e as CustomEvent).detail;
    toast({
      title: "Event in 15 minutes",
      description: event.title,
      duration: 8000,
    });
  }, [toast]);
  useEffect(() => {
    window.addEventListener("event_reminder", handler);
    return () => window.removeEventListener("event_reminder", handler);
  }, [handler]);
  return null;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  useWebSocket();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/sign-in" />;
  }

  return (
    <AppLayout>
      <PushNotificationBanner />
      <ReminderNotifier />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/stats" component={Stats} />
        <Route path="/suggestions" component={Suggestions} />
        <Route component={NotFound} />
      </Switch>
      <FloatingChatbot />
    </AppLayout>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthQueryClientCacheInvalidator />
            <Switch>
              <Route path="/sign-in" component={SignInPage} />
              <Route path="/sign-up" component={SignUpPage} />
              <Route component={AppRoutes} />
            </Switch>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </WouterRouter>
  );
}

export default App;
