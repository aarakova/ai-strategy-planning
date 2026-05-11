import { useState } from 'react';
import {
  BarChart3,
  Home,
  FileText,
  Activity,
  Goal,
  GitBranch,
  BarChart,
  LogOut,
} from 'lucide-react';

import { AuthorizationScreen } from './components/AuthorizationScreen';
import { GlavnayaScreen } from './components/GlavnayaScreen';
import { KontekstScreen } from './components/KontekstScreen';
import { AnalizScreen } from './components/AnalizScreen';
import { GoalsScreen } from './components/GoalsScreen';
import { AlternativesScreen } from './components/AlternativesScreen';
import { PlanScreen } from './components/PlanScreen';

type Multiproject = {
  id: string;
  name: string;
  planningHorizon: string;
  createdAt: string;
};
export default function App() {
  const [activeScreen, setActiveScreen] = useState('Авторизация');
  const [selectedMultiproject, setSelectedMultiproject] =
    useState<Multiproject | null>(null);
    
  const menuItems = [
    { icon: Home, label: 'Главная' },
    { icon: FileText, label: 'Контекст' },
    { icon: Activity, label: 'Анализ' },
    { icon: Goal, label: 'Цели' },
    { icon: GitBranch, label: 'Альтернативы' },
    { icon: BarChart, label: 'План' },
  ];

  const isAuthorizationScreen = activeScreen === 'Авторизация';

  const handleLogout = () => {
    setSelectedMultiproject(null);
    setActiveScreen('Авторизация');
  };

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

          <div className="p-4 border-t border-neutral-200">
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
        />
      )}

      {activeScreen === 'Главная' && (
        <GlavnayaScreen selectedMultiproject={selectedMultiproject} />
      )}

      {activeScreen === 'Контекст' && <KontekstScreen />}

      {activeScreen === 'Анализ' && <AnalizScreen />}

      {activeScreen === 'Цели' && <GoalsScreen />}

      {activeScreen === 'Альтернативы' && <AlternativesScreen />}

      {activeScreen === 'План' && (
        <PlanScreen 
          selectedMultiproject={selectedMultiproject} />
      )}
    </div>
  );
}