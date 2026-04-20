import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
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
import NotFound from "@/pages/not-found";
import { useWebSocket } from "@/hooks/useWebSocket";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(224, 71%, 4%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInputBackground: "hsl(220, 14%, 96%)",
    colorText: "hsl(224, 71%, 4%)",
    colorTextSecondary: "hsl(220, 9%, 46%)",
    colorInputText: "hsl(224, 71%, 4%)",
    colorNeutral: "hsl(220, 9%, 46%)",
    borderRadius: "0.75rem",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    fontFamilyButtons: "'Outfit', 'Inter', sans-serif",
    fontSize: "15px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "shadow-xl rounded-2xl w-full overflow-hidden border border-border bg-card",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: { color: "hsl(224, 71%, 4%)", fontWeight: "700", fontFamily: "'Outfit', sans-serif" },
    headerSubtitle: { color: "hsl(220, 9%, 46%)" },
    socialButtonsBlockButtonText: { color: "hsl(224, 71%, 4%)" },
    formFieldLabel: { color: "hsl(220, 9%, 46%)" },
    footerActionLink: { color: "hsl(224, 71%, 4%)" },
    footerActionText: { color: "hsl(220, 9%, 46%)" },
    dividerText: { color: "hsl(220, 9%, 46%)" },
    identityPreviewEditButton: { color: "hsl(224, 71%, 4%)" },
    formFieldSuccessText: { color: "hsl(142, 71%, 35%)" },
    alertText: { color: "hsl(0, 72%, 51%)" },
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all",
    formFieldInput: "bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all",
    socialButtonsBlockButton: "border-border hover:bg-muted transition-all",
    dividerLine: "bg-border",
    logoImage: "w-10 h-10",
    logoBox: "flex items-center justify-center",
    footerAction: "bg-muted border-t border-border",
    socialButtonsRoot: { display: "none" },
    dividerRow: { display: "none" },
  },
};

function AuthBackground() {
  return (
    <div className="fixed inset-0 bg-muted z-[-2]" />
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 relative overflow-hidden">
      <AuthBackground />
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full" />
              <img src={`${basePath}/logo.svg`} alt="SmartSchedule" className="w-12 h-12 relative z-10" />
            </div>
            <h1 className="text-3xl font-bold text-foreground font-sans tracking-tight">SmartSchedule</h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">AI Command Center</p>
        </div>
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
        />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 relative overflow-hidden">
      <AuthBackground />
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full" />
              <img src={`${basePath}/logo.svg`} alt="SmartSchedule" className="w-12 h-12 relative z-10" />
            </div>
            <h1 className="text-3xl font-bold text-foreground font-sans tracking-tight">SmartSchedule</h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Initialize Sequence</p>
        </div>
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
        />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

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

function AppRoutes() {
  useWebSocket();
  return (
    <AppLayout>
      <PushNotificationBanner />
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

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <AppRoutes />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={HomeRedirect} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={{
        signIn: {
          start: {
            title: "Access terminal",
            subtitle: "Authenticate to continue",
          },
        },
        signUp: {
          start: {
            title: "Establish connection",
            subtitle: "Initialize your AI assistant",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
