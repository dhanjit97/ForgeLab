import { useState } from 'react';

const NAV_ITEMS = [
  { key: 'learn', label: 'Learn', href: '#/learn' },
  { key: 'code-lab', label: 'Code Lab', href: '#/code-lab' },
  { key: 'snippets', label: 'Snippets', href: '#/snippets' },
  { key: 'guides', label: 'Engineering Guides', href: '#/guides' },
  { key: 'projects', label: 'Projects', href: '#/projects' },
  { key: 'progress', label: 'My Progress', href: '#/progress' },
];

type TopNavProps = {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onToggleDrawer: () => void;
};

export function TopNav({ theme, onToggleTheme, onToggleDrawer }: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="top-nav">
      <button
        className="nav-toggle"
        aria-label="Open navigation menu"
        aria-expanded={menuOpen}
        onClick={() => {
          setMenuOpen((m) => !m);
          onToggleDrawer();
        }}
      >
        ☰
      </button>
      <div className="brand">ForgeLab</div>
      <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`nav-link ${item.key === 'learn' ? 'active' : ''}`}
            aria-current={item.key === 'learn' ? 'page' : undefined}
            onClick={() => {
              // Navigation is handled by AppShell via the page prop
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="nav-utilities">
        <button
          className="theme-toggle"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}
