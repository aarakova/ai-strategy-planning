import { useState, useEffect } from 'react';
import {
  BarChart3,
  Home,
  FileText,
  Activity,
  Goal,
  GitBranch,
  BarChart,
  LogOut,
  Layers,
} from 'lucide-react';

import { AuthorizationScreen } from './components/AuthorizationScreen';
import { GlavnayaScreen } from './components/GlavnayaScreen';
import { KontekstScreen } from './components/KontekstScreen';
import { AnalizScreen } from './components/AnalizScreen';
import { GoalsScreen } from './components/GoalsScreen';
import { AlternativesScreen } from './components/AlternativesScreen';
import { PlanScreen } from './components/PlanScreen';

import { authApi } from './api/auth';
import type { Multiproject } from './api/contexts';

export type { Multiproject };

export default function App() {
  const [activeScreen, setActiveScreen] = useState('Авторизация');
  const [selectedMultiproject, setSelectedMultiproject] = useState<Multiproject | null>(null);
  const [currentLogin, setCurrentLogin] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    authApi
      .me()
      .then((user) => setCurrentLogin(user.login))
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  const menuItems = [
    { icon: Home, label: 'Главная' },
    { icon: FileText, label: 'Контекст' },
    { icon: Activity, label: 'Анализ' },
    { icon: Goal, label: 'Цели' },
    { icon: GitBranch, label: 'Альтернативы' },
    { icon: BarChart, label: 'План' },
  ];

  const isAuthorizationScreen = activeScreen === 'Авторизация';

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    setCurrentLogin(null);
    setSelectedMultiproject(null);
    setActiveScreen('Авторизация');
  };

  if (!authChecked) {
    return (
      <div className="size-full flex items-center justify-center bg-neutral-50 text-neutral-400 text-sm">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="size-full flex bg-neutral-50">
      {!isAuthorizationScreen && (
        <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center gap-2 text-neutral-900">
              <BarChart3 className="w-6 h-6" />
              <span className="font-semibold">Стратегия</span>
            </div>
          </div>

          <nav className="flex-1 p-4">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.label;

              return (
                <button
                  key={index}
                  onClick={() => setActiveScreen(item.label)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-neutral-200 space-y-1">
            <button
              type="button"
              onClick={() => {
                setSelectedMultiproject(null);
                setActiveScreen('Авторизация');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-neutral-600 transition-colors hover:bg-neutral-100"
            >
              <Layers className="w-5 h-5" />
              <span>Сменить проект</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-neutral-600 transition-colors hover:bg-neutral-100"
            >
              <LogOut className="w-5 h-5" />
              <span>Выйти</span>
            </button>
          </div>
        </aside>
      )}

      {activeScreen === 'Авторизация' && (
        <AuthorizationScreen
          setActiveScreen={setActiveScreen}
          setSelectedMultiproject={setSelectedMultiproject}
          onLoginSuccess={setCurrentLogin}
          initialStep={currentLogin ? 'multiproject' : 'auth'}
          initialLogin={currentLogin ?? ''}
        />
      )}

      {activeScreen === 'Главная' && (
        <GlavnayaScreen
          selectedMultiproject={selectedMultiproject}
          contextId={selectedMultiproject?.id ?? null}
        />
      )}

      {activeScreen === 'Контекст' && (
        <KontekstScreen contextId={selectedMultiproject?.id ?? null} />
      )}

      {activeScreen === 'Анализ' && (
        <AnalizScreen contextId={selectedMultiproject?.id ?? null} />
      )}

      {activeScreen === 'Цели' && <GoalsScreen contextId={selectedMultiproject?.id ?? null} />}

      {activeScreen === 'Альтернативы' && (
        <AlternativesScreen
          contextId={selectedMultiproject?.id ?? null}
          onNavigateToPlan={() => setActiveScreen('План')}
        />
      )}

      {activeScreen === 'План' && (
        <PlanScreen
          contextId={selectedMultiproject?.id ?? null}
          selectedMultiproject={selectedMultiproject}
        />
      )}
    </div>
  );
}
