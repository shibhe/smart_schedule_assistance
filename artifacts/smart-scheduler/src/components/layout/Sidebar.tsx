import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar as CalendarIcon, BarChart3, Lightbulb, Menu, Sparkles, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useClerk, useUser } from "@clerk/react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/stats", label: "Analytics", icon: BarChart3 },
  { href: "/suggestions", label: "AI Suggestions", icon: Lightbulb },
];

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function UserFooter() {
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleSignOut = () => {
    signOut({ redirectUrl: `${basePath}/sign-in` });
  };

  const displayName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "User";
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate text-foreground">{displayName}</p>
          {email && <p className="text-[10px] text-muted-foreground truncate">{email}</p>}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span className="font-medium">Sign Out</span>
      </Button>
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();

  const NavLinks = () => (
    <div className="space-y-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-10 transition-all relative ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="tracking-wide">{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar h-screen sticky top-0 z-20">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-foreground">SmartSchedule</h1>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">AI Scheduling</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar py-3">
          <p className="px-5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Navigation</p>
          <NavLinks />
        </div>
        <UserFooter />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-card shadow-md border-border">
            <Menu className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 flex flex-col border-r border-border bg-sidebar">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-foreground">SmartSchedule</h1>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">AI Scheduling</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
            <p className="px-5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Navigation</p>
            <NavLinks />
          </div>
          <UserFooter />
        </SheetContent>
      </Sheet>
    </>
  );
}
