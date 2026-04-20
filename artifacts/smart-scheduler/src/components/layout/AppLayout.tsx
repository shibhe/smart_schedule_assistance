import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        {children}
      </main>
    </div>
  );
}
