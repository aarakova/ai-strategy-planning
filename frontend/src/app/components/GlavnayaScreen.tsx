import { useEffect, useState } from 'react';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Circle,
  Users,
  Loader2,
} from 'lucide-react';
import { homeApi, type HomeData } from '../api/home';

function getStatusStyles(status: string) {
  if (status === 'COMPLETED') {
    return {
      badge: 'bg-emerald-100 text-emerald-700',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      label: 'Завершено',
    };
  }
  if (status === 'IN_PROGRESS') {
    return {
      badge: 'bg-blue-100 text-blue-700',
      icon: <Clock3 className="w-4 h-4 text-blue-600" />,
      label: 'В процессе',
    };
  }
  return {
    badge: 'bg-neutral-100 text-neutral-600',
    icon: <Circle className="w-4 h-4 text-neutral-400" />,
    label: 'Не начато',
  };
}

function getLevelStyles(level: string) {
  if (level === 'high') return { dot: 'bg-red-500', badge: 'bg-red-100 text-red-700', label: 'Высокий' };
  if (level === 'medium') return { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', label: 'Средний' };
  return { dot: 'bg-emerald-500', badge: 'bg-blue-100 text-blue-700', label: 'Низкий' };
}

function getResourceStatusStyles(status: string) {
  if (status === 'critical') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'warning') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

const STAGE_LABELS: Record<string, string> = {
  'Контекст': 'Загрузка контекста',
  'Анализ': 'Анализ',
  'Цели': 'Определение целей',
  'Альтернативы': 'Выбор альтернативы',
  'План': 'Формирование плана',
};

export function GlavnayaScreen({
  selectedMultiproject,
  contextId,
}: {
  selectedMultiproject: { name?: string } | null;
  contextId: string | null;
}) {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contextId) {
      setData(null);
      return;
    }
    setLoading(true);
    homeApi
      .get(contextId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [contextId]);

  const multiprojectName = selectedMultiproject?.name || 'Мультипроект не выбран';

  const visibleRisks = (data?.key_risks ?? []).filter((r) => r.level !== 'low');

  return (
    <main className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-neutral-900 mb-2">Стратегическое планирование</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Главная страница отображает текущее состояние планирования, проблемные
          зоны, риски, цели и сводные показатели стратегического плана.
        </p>

        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-neutral-900">{multiprojectName}</h1>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />}
        </div>

        {!contextId ? (
          <div className="p-6 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-500 text-sm text-center">
            Выберите мультипроект, чтобы увидеть сводку планирования.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Состояние этапов */}
            <section className="bg-white border border-neutral-200 rounded-xl p-6">
              <h2 className="text-neutral-900 mb-4">Состояние этапов</h2>
              <div className="space-y-3">
                {(data?.planning_stages_status ?? []).length > 0 ? (
                  data!.planning_stages_status.map((item, index) => {
                    const styles = getStatusStyles(item.status);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4 p-3 bg-neutral-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {styles.icon}
                          <span className="text-sm text-neutral-800">
                            {STAGE_LABELS[item.stage_name] ?? item.stage_name}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs ${styles.badge}`}>
                          {styles.label}
                        </span>
                      </div>
                    );
                  })
                ) : loading ? null : (
                  <p className="text-sm text-neutral-500">Данные о этапах не загружены.</p>
                )}
              </div>
            </section>

            {/* Ключевые риски */}
            <section className="bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-neutral-900">Ключевые риски из анализа</h2>
              </div>
              {visibleRisks.length > 0 ? (
                <div className="space-y-3">
                  {visibleRisks.map((item, index) => {
                    const styles = getLevelStyles(item.level);
                    return (
                      <div key={index} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${styles.dot}`} />
                        <span className="text-sm text-neutral-700 flex-1">{item.text}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${styles.badge}`}>
                          {styles.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  {data ? 'Ключевые риски не выявлены или анализ ещё не выполнен.' : 'Загрузка…'}
                </p>
              )}
            </section>

            {/* Ресурсы */}
            <section className="bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Users className="w-5 h-5 text-blue-500" />
                <h2 className="text-neutral-900">Анализ загрузки и дефицита ресурсов по ролям</h2>
              </div>
              {(data?.resource_analysis ?? []).length > 0 ? (
                <div className="overflow-hidden border border-neutral-200 rounded-lg">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="text-left font-medium text-neutral-900 px-4 py-3 border border-neutral-200">Роль</th>
                        <th className="text-left font-medium text-neutral-900 px-4 py-3 border border-neutral-200">Суммарная потребность</th>
                        <th className="text-left font-medium text-neutral-900 px-4 py-3 border border-neutral-200">Лимит</th>
                        <th className="text-left font-medium text-neutral-900 px-4 py-3 border border-neutral-200">Дефицит / профицит</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data!.resource_analysis.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-neutral-800 border border-neutral-200">{item.role}</td>
                          <td className="px-4 py-3 text-neutral-700 border border-neutral-200">{item.demand}</td>
                          <td className="px-4 py-3 text-neutral-700 border border-neutral-200">{item.limit}</td>
                          <td className="px-4 py-3 border border-neutral-200">
                            <span className={`inline-flex px-2 py-1 rounded border text-xs ${getResourceStatusStyles(item.status)}`}>
                              {item.balance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  {data ? 'Данные по ресурсам недоступны. Выполните анализ на странице «Анализ».' : 'Загрузка…'}
                </p>
              )}
            </section>

            {/* Стратегические цели */}
            <section className="bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-500" />
                <h2 className="text-neutral-900">Стратегические цели</h2>
              </div>
              {(data?.strategic_goals ?? []).length > 0 ? (
                <div className="space-y-3">
                  {data!.strategic_goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between gap-4 p-3 bg-neutral-50 rounded-lg"
                    >
                      <span className="text-sm text-neutral-800">{goal.specific}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        goal.priority === 'Высокий' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {goal.priority}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  {data ? 'Цели не добавлены. Перейдите на страницу «Цели».' : 'Загрузка…'}
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
