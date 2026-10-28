import { useState } from 'react';
import { TopNav } from './TopNav';
import { SidebarNav } from './SidebarNav';

type AppShellProps = {
  page: string;
  theme: 'light' | 'dark';
  onNavigate: (page: string) => void;
  onToggleTheme: () => void;
  children: React.ReactNode;
};

export function AppShell({ page, theme, onNavigate, onToggleTheme, children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="app-shell" data-theme={theme} data-page={page}>
      <TopNav
        theme={theme}
        onToggleTheme={onToggleTheme}
        onToggleDrawer={() => setDrawerOpen((d) => !d)}
      />
      <aside className={`sidebar ${drawerOpen ? 'open' : ''}`}>
        <SidebarNav page={page} onNavigate={onNavigate} />
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
