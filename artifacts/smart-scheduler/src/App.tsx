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
    colorPrimary: "hsl(239, 84%, 67%)",
    colorBackground: "hsl(224, 71%, 4%)",
    colorInputBackground: "hsl(222, 47%, 11%)",
    colorText: "hsl(213, 31%, 91%)",
    colorTextSecondary: "hsl(215, 20%, 65%)",
    colorInputText: "hsl(213, 31%, 91%)",
    colorNeutral: "hsl(215, 20%, 65%)",
    borderRadius: "0.75rem",
    fontFamily: "Inter, sans-serif",
    fontFamilyButtons: "Inter, sans-serif",
    fontSize: "15px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "shadow-2xl rounded-2xl w-full overflow-hidden border border-white/10",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: { color: "hsl(213, 31%, 91%)", fontWeight: "700" },
    headerSubtitle: { color: "hsl(215, 20%, 65%)" },
    socialButtonsBlockButtonText: { color: "hsl(213, 31%, 91%)" },
    formFieldLabel: { color: "hsl(215, 20%, 65%)" },
    footerActionLink: { color: "hsl(239, 84%, 80%)" },
    footerActionText: { color: "hsl(215, 20%, 65%)" },
    dividerText: { color: "hsl(215, 20%, 55%)" },
    identityPreviewEditButton: { color: "hsl(239, 84%, 80%)" },
    formFieldSuccessText: { color: "hsl(142, 71%, 45%)" },
    alertText: { color: "hsl(0, 84%, 70%)" },
    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500 text-white font-semibold",
    formFieldInput: "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500",
    socialButtonsBlockButton: "border-white/10 hover:bg-white/5",
    dividerLine: "bg-white/10",
    logoImage: "w-10 h-10",
    logoBox: "flex items-center justify-center",
    footerAction: "bg-white/5 border-t border-white/10",
  },
};

function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src={`${basePath}/logo.svg`} alt="SmartSchedule" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-foreground">SmartSchedule</h1>
          </div>
          <p className="text-muted-foreground text-sm">Your AI-powered scheduling assistant</p>
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
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src={`${basePath}/logo.svg`} alt="SmartSchedule" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-foreground">SmartSchedule</h1>
          </div>
          <p className="text-muted-foreground text-sm">Create your free account</p>
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

function AppRoutes() {
  return (
    <AppLayout>
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
            title: "Welcome back",
            subtitle: "Sign in to your SmartSchedule account",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start organizing your life with AI",
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
