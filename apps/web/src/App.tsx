import { useState, useCallback } from 'react';
import './App.css';
import { AppShell } from './components/AppShell';
import { LearnPage } from './pages/LearnPage';
import { CodeLabPage } from './pages/CodeLabPage';
import { SnippetsPage } from './pages/SnippetsPage';
import { GuidesPage } from './pages/GuidesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProgressPage } from './pages/ProgressPage';

type Page = 'learn' | 'code-lab' | 'snippets' | 'guides' | 'projects' | 'progress';

export function App() {
  const [page, setPage] = useState<Page>('learn');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const navigate = useCallback((next: Page) => {
    setPage(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <AppShell
      page={page}
      theme={theme}
      onNavigate={(next: string) => navigate(next as Page)}
      onToggleTheme={toggleTheme}
    >
      {page === 'learn' && <LearnPage />}
      {page === 'code-lab' && <CodeLabPage />}
      {page === 'snippets' && <SnippetsPage />}
      {page === 'guides' && <GuidesPage />}
      {page === 'projects' && <ProjectsPage />}
      {page === 'progress' && <ProgressPage />}
    </AppShell>
  );
}
