import {
  Target,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock3,
  Circle,
  Users,
  BarChart3,
} from 'lucide-react';

const planSummary = {
  selectedVariant: 'Вариант 2 — сбалансированный',
  planningHorizon: '8 месяцев',
  completedStages: 1,
  totalStages: 4,
  milestonesCount: 4,
  risksCount: 5,
  unmetConstraintsCount: 2,
  resources: [
    { role: 'Аналитики', count: 6 },
    { role: 'Разработчики', count: 10 },
    { role: 'Тестировщики', count: 4 },
  ],
};

const planData = {
  stages: [
    {
      stage: 'Загрузка контекста',
      status: 'completed',
      statusLabel: 'Завершено',
    },
    {
      stage: 'Анализ',
      status: 'completed',
      statusLabel: 'Завершено',
    },
    {
      stage: 'Определение целей',
      status: 'active',
      statusLabel: 'В процессе',
    },
    {
      stage: 'Выбор альтернативы',
      status: 'pending',
      statusLabel: 'Не начато',
    },
    {
      stage: 'Формирование плана',
      status: 'pending',
      statusLabel: 'Не начато',
    },
  ],

  resourceBalance: [
    {
      role: 'Аналитики',
      need: 420,
      limit: 480,
      balance: 60,
      type: 'profit',
    },
    {
      role: 'Разработчики',
      need: 1280,
      limit: 1120,
      balance: -160,
      type: 'deficit',
    },
    {
      role: 'Тестировщики',
      need: 560,
      limit: 520,
      balance: -40,
      type: 'deficit',
    },
  ],

  goals: [
    {
      title: 'Сократить сроки вывода изменений в релиз',
      priority: 'Высокий',
    },
    {
      title: 'Повысить устойчивость архитектуры информационной системы',
      priority: 'Высокий',
    },
    {
      title: 'Снизить риски срыва сроков по зависимым проектам',
      priority: 'Средний',
    },
    {
      title: 'Повысить прозрачность управления мультипроектом',
      priority: 'Средний',
    },
  ],

  risks: [
    {
      risk: 'Дефицит разработчиков может привести к смещению сроков реализации.',
      level: 'high',
      levelLabel: 'Высокий',
    },
    {
      risk: 'Зависимость между проектами B и D повышает риск каскадной задержки.',
      level: 'high',
      levelLabel: 'Высокий',
    },
    {
      risk: 'Недостаточная детализация трудоемкости отдельных проектов может снизить точность плана.',
      level: 'medium',
      levelLabel: 'Средний',
    },
    {
      risk: 'Незначительные расхождения в оценках отдельных этапов.',
      level: 'low',
      levelLabel: 'Низкий',
    },
  ],

  problemAreas: [
    {
      title: 'Дефицит разработчиков',
      description:
        'Суммарная потребность превышает доступный лимит на 160 ч, что может повлиять на сроки реализации проектов.',
      level: 'high',
      source: 'Анализ загрузки и дефицита ресурсов по ролям',
    },
    {
      title: 'Дефицит тестировщиков',
      description:
        'Потребность превышает лимит на 40 ч, поэтому этапы проверки могут стать ограничением при формировании плана.',
      level: 'medium',
      source: 'Анализ загрузки и дефицита ресурсов по ролям',
    },
    {
      title: 'Риск каскадной задержки',
      description:
        'Зависимые проекты требуют дополнительного контроля, так как отклонение одного проекта может повлиять на последующие работы.',
      level: 'high',
      source: 'Ключевые риски стратегического плана',
    },
  ],
};

const visibleRisks = planData.risks.filter((risk) => risk.level !== 'low');

function getStatusStyles(status: string) {
  if (status === 'completed') {
    return {
      badge: 'bg-emerald-100 text-emerald-700',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    };
  }

  if (status === 'active') {
    return {
      badge: 'bg-blue-100 text-blue-700',
      icon: <Clock3 className="w-4 h-4 text-blue-600" />,
    };
  }

  return {
    badge: 'bg-neutral-100 text-neutral-600',
    icon: <Circle className="w-4 h-4 text-neutral-400" />,
  };
}

function getLevelStyles(level: string) {
  if (level === 'high') {
    return {
      dot: 'bg-red-500',
      badge: 'bg-red-100 text-red-700',
    };
  }

  return {
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
  };
}

function getBalanceStyles(type: string) {
  if (type === 'profit') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  return 'bg-red-50 text-red-700 border-red-200';
}

export function GlavnayaScreen() {
  const progressPercent = Math.round(
    (planSummary.completedStages / planSummary.totalStages) * 100,
  );

  return (
    <main className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-neutral-900 mb-2">Стратегическое планирование</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Главная страница отображает текущее состояние планирования, проблемные
          зоны, риски, цели и сводные показатели стратегического плана.
        </p>

        <h1 className="text-neutral-900 mb-6">Название мультипроекта</h1>

        <div className="space-y-6">
          {/* Состояние этапов */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="text-neutral-900 mb-4">Состояние этапов</h2>

            <div className="space-y-3">
              {planData.stages.map((item, index) => {
                const styles = getStatusStyles(item.status);

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4 p-3 bg-neutral-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {styles.icon}
                      <span className="text-sm text-neutral-800">
                        {item.stage}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-xs ${styles.badge}`}>
                      {item.statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Ключевые риски */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-neutral-900">Ключевые риски из плана</h2>
            </div>

            <div className="space-y-3">
              {visibleRisks.map((item, index) => {
                const styles = getLevelStyles(item.level);

                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${styles.dot}`} />

                    <span className="text-sm text-neutral-700 flex-1">
                      {item.risk}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-xs ${styles.badge}`}>
                      {item.levelLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Анализ загрузки и дефицита ресурсов */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Users className="w-5 h-5 text-blue-500" />
              <h2 className="text-neutral-900">
                Анализ загрузки и дефицита ресурсов по ролям
              </h2>
            </div>

            <div className="overflow-hidden border border-neutral-200 rounded-lg">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="text-left font-medium text-neutral-900 px-4 py-3 border border-neutral-200">
                      Роль
                    </th>
                    <th className="text-left font-medium text-neutral-900 px-4 py-3 border border-neutral-200">
                      Суммарная потребность
                    </th>
                    <th className="text-left font-medium text-neutral-900 px-4 py-3 border border-neutral-200">
                      Лимит
                    </th>
                    <th className="text-left font-medium text-neutral-900 px-4 py-3 border border-neutral-200">
                      Дефицит / профицит
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {planData.resourceBalance.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-neutral-800 border border-neutral-200">
                        {item.role}
                      </td>
                      <td className="px-4 py-3 text-neutral-700 border border-neutral-200">
                        {item.need} ч
                      </td>
                      <td className="px-4 py-3 text-neutral-700 border border-neutral-200">
                        {item.limit} ч
                      </td>
                      <td className="px-4 py-3 border border-neutral-200">
                        <span
                          className={`inline-flex px-2 py-1 rounded border text-xs ${getBalanceStyles(
                            item.type,
                          )}`}
                        >
                          {item.type === 'profit'
                            ? `Профицит ${item.balance} ч`
                            : `Дефицит ${Math.abs(item.balance)} ч`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Стратегические цели */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-blue-500" />
              <h2 className="text-neutral-900">Стратегические цели</h2>
            </div>

            <div className="space-y-3">
              {planData.goals.map((goal, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4 p-3 bg-neutral-50 rounded-lg"
                >
                  <span className="text-sm text-neutral-800">{goal.title}</span>

                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      goal.priority === 'Высокий'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {goal.priority}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Паспорт стратегического плана */}
                    <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h2 className="text-neutral-900">Паспорт стратегического плана</h2>
            </div>
          
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">Выбранный вариант</p>
                <p className="text-sm font-medium text-neutral-900">
                  {planSummary.selectedVariant}
                </p>
              </div>
          
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">Плановый горизонт</p>
                <p className="text-sm font-medium text-neutral-900">
                  {planSummary.planningHorizon}
                </p>
              </div>
          
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">Контрольных точек</p>
                <p className="text-sm font-medium text-neutral-900">
                  {planSummary.milestonesCount}
                </p>
              </div>
          
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">Рисков</p>
                <p className="text-sm font-medium text-neutral-900">
                  {planSummary.risksCount}
                </p>
              </div>
          
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">
                  Ограничения в зоне внимания
                </p>
                <p className="text-sm font-medium text-neutral-900">
                  {planSummary.unmetConstraintsCount}
                </p>
              </div>
          
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">Прогресс выполнения</p>
          
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-neutral-900">
                    {planSummary.completedStages} из {planSummary.totalStages}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {Math.round(
                      (planSummary.completedStages / planSummary.totalStages) * 100,
                    )}
                    %
                  </p>
                </div>
          
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${
                        (planSummary.completedStages / planSummary.totalStages) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          <button className="w-full bg-neutral-900 text-white py-4 rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
            <Target className="w-5 h-5" />
            <span>Перейти к формированию контекста</span>
          </button>
        </div>
      </div>
    </main>
  );
}