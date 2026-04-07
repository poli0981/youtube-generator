import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { TabBar } from "./TabBar";

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-0">
      <Header />
      <TabBar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
