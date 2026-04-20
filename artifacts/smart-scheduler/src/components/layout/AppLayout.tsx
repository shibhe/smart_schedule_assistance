import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground relative overflow-hidden">
      {/* Global background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none z-0" />
      <div className="fixed inset-0 noise-overlay" />
      
      <div className="relative z-10 flex w-full h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
