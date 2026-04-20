import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar as CalendarIcon, BarChart3, Lightbulb, Menu, CalendarCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/stats", label: "Insights", icon: BarChart3 },
  { href: "/suggestions", label: "AI Suggestions", icon: Lightbulb },
];

export function Sidebar() {
  const [location] = useLocation();

  const NavLinks = () => (
    <div className="space-y-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 h-10 transition-all ${
                isActive 
                  ? "bg-primary/10 text-primary hover:bg-primary/15 font-medium" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card/50 backdrop-blur-sm h-screen sticky top-0">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">SmartSchedule</h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AI Assistant</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3">
            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Menu</p>
            <NavLinks />
          </div>
        </div>
        <div className="p-4 border-t mt-auto">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 rounded-xl p-4 text-center">
             <CalendarCheck className="w-6 h-6 text-primary mx-auto mb-2" />
             <p className="text-xs font-medium text-foreground mb-1">Stay organized</p>
             <p className="text-[10px] text-muted-foreground">Your AI assistant is ready to help plan your day.</p>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-full bg-background/80 backdrop-blur shadow-sm border">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 flex flex-col border-r-0">
          <div className="p-6 border-b flex items-center gap-3 bg-muted/20">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight">SmartSchedule</h1>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AI Assistant</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <NavLinks />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
