"use client";
import { Sidebar } from "@/components/layout/Sidebar";
import { ConnectSetupModal } from "@/components/connect/ConnectSetupModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      <ConnectSetupModal />
    </div>
  );
}
