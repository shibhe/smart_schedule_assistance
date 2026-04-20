import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar as CalendarIcon, BarChart3, Lightbulb, Menu, Sparkles, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useClerk, useUser } from "@clerk/react";

const NAV_ITEMS = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/calendar", label: "Schedule", icon: CalendarIcon },
  { href: "/stats", label: "Telemetry", icon: BarChart3 },
  { href: "/suggestions", label: "AI Directives", icon: Lightbulb },
];

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function UserFooter() {
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleSignOut = () => {
    signOut({ redirectUrl: `${basePath}/sign-in` });
  };

  const displayName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "Operator";
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="p-4 border-t border-white/5 bg-background/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate text-white">{displayName}</p>
          {email && <p className="text-[10px] text-primary/70 font-mono truncate uppercase">{email}</p>}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 transition-colors group"
      >
        <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="font-medium tracking-wide">DISCONNECT</span>
      </Button>
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();

  const NavLinks = () => (
    <div className="space-y-1.5 p-4">
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-11 transition-all relative overflow-hidden group ${
                isActive
                  ? "bg-primary/15 text-primary shadow-[inset_2px_0_0_0_var(--color-primary)] font-semibold"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent z-0" />
              )}
              <item.icon className={`w-4 h-4 relative z-10 ${isActive ? "text-primary drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]" : "group-hover:text-primary transition-colors"}`} />
              <span className="relative z-10 tracking-wide">{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-white/5 bg-card/40 backdrop-blur-md h-screen sticky top-0 z-20">
        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-background/50">
          <div className="w-10 h-10 bg-primary/20 border border-primary/50 rounded-xl flex items-center justify-center text-primary shadow-[0_0_15px_rgba(139,92,246,0.3)] relative">
            <div className="absolute inset-0 bg-primary rounded-xl blur-md opacity-20" />
            <Sparkles className="w-5 h-5 relative z-10" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white">SmartSchedule</h1>
            <p className="text-[9px] text-primary font-mono uppercase tracking-[0.2em] mt-0.5">Terminal Active</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="py-4">
            <p className="px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2 font-mono">Operations</p>
            <NavLinks />
          </div>
        </div>
        <UserFooter />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-50 w-11 h-11 rounded-xl bg-card/80 backdrop-blur-md shadow-lg border-white/10 hover:bg-primary/20 hover:border-primary/50 transition-all">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 flex flex-col border-r border-white/10 bg-background/95 backdrop-blur-xl">
          <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-background/50">
            <div className="w-10 h-10 bg-primary/20 border border-primary/50 rounded-xl flex items-center justify-center text-primary shadow-[0_0_15px_rgba(139,92,246,0.3)] relative">
              <Sparkles className="w-5 h-5 relative z-10" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white">SmartSchedule</h1>
              <p className="text-[9px] text-primary font-mono uppercase tracking-[0.2em] mt-0.5">Terminal Active</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            <p className="px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2 font-mono">Operations</p>
            <NavLinks />
          </div>
          <UserFooter />
        </SheetContent>
      </Sheet>
    </>
  );
}
