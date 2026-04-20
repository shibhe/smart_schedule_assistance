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
    colorPrimary: "hsl(255, 85%, 65%)",
    colorBackground: "hsl(232, 40%, 6%)",
    colorInputBackground: "hsl(232, 30%, 15%)",
    colorText: "hsl(210, 40%, 98%)",
    colorTextSecondary: "hsl(215, 20%, 65%)",
    colorInputText: "hsl(210, 40%, 98%)",
    colorNeutral: "hsl(215, 20%, 65%)",
    borderRadius: "0.75rem",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    fontFamilyButtons: "'Outfit', 'Inter', sans-serif",
    fontSize: "15px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "shadow-2xl rounded-2xl w-full overflow-hidden border border-white/5 bg-background/80 backdrop-blur-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: { color: "hsl(210, 40%, 98%)", fontWeight: "700", fontFamily: "'Outfit', sans-serif" },
    headerSubtitle: { color: "hsl(215, 20%, 65%)" },
    socialButtonsBlockButtonText: { color: "hsl(210, 40%, 98%)" },
    formFieldLabel: { color: "hsl(215, 20%, 65%)" },
    footerActionLink: { color: "hsl(255, 85%, 65%)" },
    footerActionText: { color: "hsl(215, 20%, 65%)" },
    dividerText: { color: "hsl(215, 20%, 55%)" },
    identityPreviewEditButton: { color: "hsl(255, 85%, 65%)" },
    formFieldSuccessText: { color: "hsl(142, 71%, 45%)" },
    alertText: { color: "hsl(0, 84%, 70%)" },
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all",
    formFieldInput: "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all",
    socialButtonsBlockButton: "border-white/10 hover:bg-white/5 transition-all",
    dividerLine: "bg-white/10",
    logoImage: "w-10 h-10 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]",
    logoBox: "flex items-center justify-center",
    footerAction: "bg-white/5 border-t border-white/10",
    socialButtonsRoot: { display: "none" },
    dividerRow: { display: "none" },
  },
};

function AuthBackground() {
  return (
    <>
      <div className="fixed inset-0 bg-background z-[-2]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-secondary/10 via-transparent to-background" />
      </div>
      <div className="fixed inset-0 noise-overlay z-[-1]" />
    </>
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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-background/90 border border-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.2)] backdrop-blur-md text-sm max-w-sm w-[calc(100%-2rem)] animate-in slide-in-from-top-4 duration-500">
      <span className="text-lg">🔔</span>
      <span className="flex-1 text-muted-foreground">Enable push notifications for AI event alerts</span>
      <button
        onClick={subscribe}
        className="shrink-0 px-3 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium transition-colors border border-primary/30"
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
