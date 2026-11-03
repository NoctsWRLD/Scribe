import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { getPageTitle } from '../utils/pageTitles';
import { useI18n } from '../i18n';
import SideNav from './SideNav';
import TopBar from './TopBar';

export default function AppShell({ children }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useI18n();
  const isChat = location.pathname === '/chat';

  useSeo({ title: t(getPageTitle(location.pathname)), path: location.pathname });

  return (
    <div className={`flex bg-rp-canvas ${isChat ? 'h-dvh overflow-hidden' : 'min-h-dvh'}`}>
      <a
        href="#main-content"
        className="sr-only z-[100] bg-rp-accent px-4 py-2 font-semibold text-rp-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('Preskoči na vsebino')}
      </a>
      <SideNav
        pathname={location.pathname}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className={`flex min-w-0 flex-1 flex-col lg:ml-60 ${isChat ? 'h-dvh' : 'min-h-dvh'}`}>
        <TopBar onOpenMenu={() => setMenuOpen(true)} />
        <main
          id="main-content"
          className={isChat
            ? 'mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col'
            : 'mx-auto w-full max-w-6xl flex-1 px-4 pb-8 pt-6 md:px-6 md:pb-10 md:pt-8 lg:pt-12'}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
