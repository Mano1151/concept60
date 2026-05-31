import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import Card from './ui/Card';
import { getLocalSetting, setLocalSetting } from '../utils/localStorage';

const baseMenuItems = [
  { label: 'Home', path: '/' },
  { label: 'Trending', path: '/trending' },
  { label: 'PDF Q&A', path: '/pdf-qa' },
  { label: 'Saved', path: '/saved' },
  { label: 'Profile', path: '/profile' },
  { label: 'Settings', path: '/settings' },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const { user, logout } = useAuth();

  useEffect(() => {
    const savedSettings = getLocalSetting('concept60_accessibility_settings', null);
    const initialTheme = savedSettings?.theme || 'dark';
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;

    const savedSettings = getLocalSetting('concept60_accessibility_settings', {
      font: 'Inter',
      fontSize: 'medium',
      playbackSpeed: 1,
      readingMode: 'normal',
      listenMode: false,
      theme: nextTheme,
    });

    setLocalSetting('concept60_accessibility_settings', { ...savedSettings, theme: nextTheme });
  };

  return (
    <header className="glass border-b border-white/6">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-lg font-semibold text-white">
          Concept in 60 Seconds
        </Link>

        <div className="flex items-center gap-3 md:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl bg-white/5 p-2 text-white transition hover:bg-white/10"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            {!menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 6h18M3 12h18M3 18h18"></path>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            )}
          </button>
        </div>

        <nav className="hidden items-center gap-4 md:flex">
          {baseMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `rounded-2xl px-3 py-2 text-sm transition ${
                  isActive ? 'bg-accent text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="px-3 py-2"
            aria-pressed={theme === 'dark'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </Button>

          {user ? (
            <Button variant="ghost" className="ml-2" onClick={logout}>
              Sign out
            </Button>
          ) : (
            <NavLink to="/login">
              <Button variant="primary">Login</Button>
            </NavLink>
          )}
        </nav>

      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-white/10 bg-bg/95"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4">
              {baseMenuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 text-sm transition ${
                      isActive ? 'bg-accent text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              <Button
                variant="ghost"
                className="w-full text-left px-4 py-3"
                onClick={() => {
                  setMenuOpen(false);
                  toggleTheme();
                }}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                <span className="mr-3">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                {theme === 'dark' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                )}
              </Button>

              {user ? null : (
                <NavLink to="/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="primary" className="w-full">Login</Button>
                </NavLink>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
