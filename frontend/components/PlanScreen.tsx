import {
  BarChart3,
  CalendarRange,
  Users,
  Flag,
  FileBarChart,
  AlertTriangle,
  ShieldAlert,
  Briefcase,
  Activity,
  Sparkles,
} from 'lucide-react';

export function PlanScreen({ selectedMultiproject }) {
  const multiprojectName = selectedMultiproject?.name || 'Название мультипроекта';

  const planSummary = {
    selectedVariant: 'Вариант 2 — сбалансированный',
    planningHorizon: '8 месяцев',
    completedStages: 1,
    totalStages: 4,
    milestonesCount: 4,
    risksCount: 5,
    unmetConstraintsCount: 2,
  };

  const phases = [
    {
      phase: 'Этап 1',
      title: 'Подготовка архитектурной основы',
      period: 'Май 2026 — Июнь 2026',
      status: 'Выполнен',
      milestone: {
        title: 'Утверждение архитектурного решения',
        date: '15.06.2026',
        status: 'Достигнута',
      },
      works: [
        { project: 'Проект 1', share: '30%', roles: 'аналитики, разработчики' },
        { project: 'Проект 2', share: '15%', roles: 'разработчики' },
      ],
      resources: [
        { role: 'Аналитики', requiredHours: 320, availableHours: 480 },
        { role: 'Разработчики', requiredHours: 720, availableHours: 960 },
        { role: 'Тестировщики', requiredHours: 160, availableHours: 320 },
      ],
    },
    {
      phase: 'Этап 2',
      title: 'Запуск ключевых инициатив',
      period: 'Июль 2026 — Август 2026',
      status: 'В работе',
      milestone: {
        title: 'Запуск пилотного набора проектов',
        date: '01.08.2026',
        status: 'Запланирована',
      },
      works: [
        { project: 'Проект 1', share: '70%', roles: 'разработчики, тестировщики' },
        { project: 'Проект 3', share: '35%', roles: 'аналитики, разработчики' },
      ],
      resources: [
        { role: 'Аналитики', requiredHours: 560, availableHours: 640 },
        { role: 'Разработчики', requiredHours: 1320, availableHours: 1440 },
        { role: 'Тестировщики', requiredHours: 360, availableHours: 640 },
      ],
    },
    {
      phase: 'Этап 3',
      title: 'Масштабирование решений',
      period: 'Сентябрь 2026 — Октябрь 2026',
      status: 'Планируется',
      milestone: {
        title: 'Промежуточная оценка KPI',
        date: '15.10.2026',
        status: 'Запланирована',
      },
      works: [
        { project: 'Проект 3', share: '45%', roles: 'разработчики, тестировщики' },
        { project: 'Проект 4', share: '40%', roles: 'разработчики, тестировщики' },
      ],
      resources: [
        { role: 'Аналитики', requiredHours: 280, availableHours: 480 },
        { role: 'Разработчики', requiredHours: 1080, availableHours: 1280 },
        { role: 'Тестировщики', requiredHours: 700, availableHours: 800 },
      ],
    },
    {
      phase: 'Этап 4',
      title: 'Контроль и стабилизация',
      period: 'Ноябрь 2026 — Декабрь 2026',
      status: 'Планируется',
      milestone: {
        title: 'Финальная проверка исполнения стратегии',
        date: '20.12.2026',
        status: 'Запланирована',
      },
      works: [
        { project: 'Проект 4', share: '60%', roles: 'разработчики, тестировщики' },
        { project: 'Проект 5', share: '25%', roles: 'аналитики' },
      ],
      resources: [
        { role: 'Аналитики', requiredHours: 180, availableHours: 480 },
        { role: 'Разработчики', requiredHours: 520, availableHours: 960 },
        { role: 'Тестировщики', requiredHours: 420, availableHours: 640 },
      ],
    },
  ];

  const risks = [
    {
      text: 'На втором этапе возникает высокая загрузка разработчиков: требуется 1320 ч из доступных 1440 ч.',
      level: 'high',
      impact: 'Высокий',
    },
    {
      text: 'Задержка проекта 3 может повлиять на сроки проекта 4, так как проект 4 зависит от результатов проекта 3.',
      level: 'medium',
      impact: 'Высокий',
    },
    {
      text: 'На третьем этапе возникает повышенная нагрузка на тестирование: требуется 700 ч из доступных 800 ч.',
      level: 'medium',
      impact: 'Высокий',
    },
    {
      text: 'Часть работ проекта 3 запускается до полного завершения аналитики, что может привести к уточнению требований в ходе реализации.',
      level: 'medium',
      impact: 'Средний',
    },
    {
      text: 'Финальный этап содержит резерв на устранение дефектов, однако при росте числа замечаний может увеличиться объём стабилизационных работ.',
      level: 'low',
      impact: 'Низкий',
    },
  ];

  const unmetConstraints = [
    {
      title: 'Ограничение по загрузке разработчиков',
      value: 'Не более 85%',
      actual: '92% на этапе 2',
      impact: 'Риск сдвига контрольной точки запуска пилота.',
    },
    {
      title: 'Ограничение по параллельности работ',
      value: 'Не более 3 активных проектов одновременно',
      actual: '4 проекта на этапе 3',
      impact: 'Повышается сложность координации и контроля зависимостей.',
    },
  ];

  const getPhaseStatusColor = (status: string) => {
    if (status === 'Выполнен') return 'bg-emerald-100 text-emerald-700';
    if (status === 'В работе') return 'bg-blue-100 text-blue-700';
    return 'bg-neutral-100 text-neutral-600';
  };

  const getMilestoneStatusColor = (status: string) => {
    if (status === 'Достигнута') return 'bg-emerald-100 text-emerald-700';
    return 'bg-neutral-100 text-neutral-600';
  };

  const getLoadPercent = (requiredHours: number, availableHours: number) => {
    if (!availableHours) return 0;
    return Math.round((requiredHours / availableHours) * 100);
  };

  const getLoadColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 80) return 'bg-amber-500';
    if (percent >= 60) return 'bg-emerald-500';
    return 'bg-blue-500';
  };

  const getLoadText = (percent: number) => {
    if (percent >= 90) return 'Критическая загрузка';
    if (percent >= 80) return 'Высокая загрузка';
    if (percent >= 60) return 'Допустимая загрузка';
    return 'Низкая загрузка';
  };

  const getDotClasses = (level: string) => {
    if (level === 'high') return 'bg-red-500';
    if (level === 'medium') return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const getImpactClasses = (level: string) => {
    if (level === 'high') return 'bg-red-100 text-red-700';
    if (level === 'medium') return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  const resourcePlan = phases.map((phase) => ({
    phase: phase.phase,
    resources: phase.resources.map((resource) => ({
      ...resource,
      load: getLoadPercent(resource.requiredHours, resource.availableHours),
    })),
  }));

  return (
    <main className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-neutral-900 mb-2">План &quot;{multiprojectName}&quot;</h1>

        <p className="text-sm text-neutral-500 mb-8">
          Формирование стратегического плана мультипроекта на основе выбранной альтернативы
        </p>

        <div className="space-y-6">
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

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarRange className="w-5 h-5 text-blue-500" />
                  <h2 className="text-neutral-900">Этапы реализации плана</h2>
                </div>

                <p className="text-sm text-neutral-600 leading-relaxed">
                  Этапы сформированы по контрольным точкам. Каждый этап включает состав
                  проектов, завершается контрольной точкой и содержит расчет потребности
                  в ресурсах.
                </p>
              </div>

              <span className="px-3 py-1.5 rounded-lg text-xs bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Сгенерировано ИИ</span>
              </span>
            </div>

            <div className="space-y-5">
              {phases.map((item, index) => (
                <div
                  key={index}
                  className="p-5 bg-neutral-50 rounded-xl border border-neutral-200"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">{item.phase}</p>
                      <h3 className="text-sm font-medium text-neutral-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-neutral-500 mt-1">{item.period}</p>
                    </div>

                    <span
                      className={`px-2 py-1 rounded text-xs whitespace-nowrap ${getPhaseStatusColor(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="w-4 h-4 text-neutral-500" />
                      <h4 className="text-sm font-medium text-neutral-900">
                        Состав этапа
                      </h4>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full bg-white border border-neutral-200 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="border-b border-neutral-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                              Проект
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                              Доля
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                              Роли
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {item.works.map((work, workIndex) => (
                            <tr
                              key={workIndex}
                              className="border-b border-neutral-100 last:border-b-0"
                            >
                              <td className="py-3 px-4 text-sm text-neutral-700">
                                {work.project}
                              </td>
                              <td className="py-3 px-4 text-sm font-medium text-neutral-900">
                                {work.share}
                              </td>
                              <td className="py-3 px-4 text-sm text-neutral-700">
                                {work.roles}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-neutral-200 mb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Flag className="w-4 h-4 text-amber-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">
                            Контрольная точка
                          </p>
                          <h4 className="text-sm font-medium text-neutral-900 mb-1">
                            {item.milestone.title}
                          </h4>
                          <p className="text-sm text-neutral-500">
                            Дата: {item.milestone.date}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-1 rounded text-xs whitespace-nowrap ${getMilestoneStatusColor(
                          item.milestone.status,
                        )}`}
                      >
                        {item.milestone.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-neutral-500" />
                      <h4 className="text-sm font-medium text-neutral-900">
                        Ресурсы этапа
                      </h4>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full bg-white border border-neutral-200 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="border-b border-neutral-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                              Роль
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                              Требуется, ч
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                              Доступно, ч
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                              Загрузка
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {item.resources.map((resource) => {
                            const load = getLoadPercent(
                              resource.requiredHours,
                              resource.availableHours,
                            );

                            return (
                              <tr
                                key={resource.role}
                                className="border-b border-neutral-100 last:border-b-0"
                              >
                                <td className="py-3 px-4 text-sm font-medium text-neutral-900">
                                  {resource.role}
                                </td>

                                <td className="py-3 px-4 text-sm text-neutral-700">
                                  {resource.requiredHours} ч
                                </td>

                                <td className="py-3 px-4 text-sm text-neutral-700">
                                  {resource.availableHours} ч
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3 mb-1">
                                    <div className="w-28 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${getLoadColor(
                                          load,
                                        )}`}
                                        style={{ width: `${Math.min(load, 100)}%` }}
                                      />
                                    </div>

                                    <span className="text-sm text-neutral-700">
                                      {load}%
                                    </span>
                                  </div>

                                  <p className="text-xs text-neutral-500">
                                    {getLoadText(load)}
                                  </p>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              <h2 className="text-neutral-900">Загрузка ресурсов по этапам</h2>
            </div>

            <p className="text-sm text-neutral-600 leading-relaxed mb-5">
              В таблице показана итоговая загрузка ролей на каждом этапе. Процент
              рассчитывается как отношение требуемых человеко-часов к доступному фонду
              времени.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                      Этап
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                      Аналитики
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                      Разработчики
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                      Тестировщики
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {resourcePlan.map((phase) => (
                    <tr
                      key={phase.phase}
                      className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-neutral-900">
                        {phase.phase}
                      </td>

                      {phase.resources.map((resource) => (
                        <td key={resource.role} className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getLoadColor(
                                  resource.load,
                                )}`}
                                style={{ width: `${Math.min(resource.load, 100)}%` }}
                              />
                            </div>

                            <span className="text-sm text-neutral-700">
                              {resource.load}%
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-neutral-900">Риски плана</h2>
            </div>

            <div className="space-y-3">
              {risks.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-white rounded-lg border border-neutral-200"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-2 ${getDotClasses(
                        item.level,
                      )}`}
                    />

                    <div className="flex-1">
                      <p className="text-sm text-neutral-700 mb-2">{item.text}</p>

                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs ${getImpactClasses(
                          item.level,
                        )}`}
                      >
                        Влияние: {item.impact}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h2 className="text-neutral-900">Ограничения в зоне внимания</h2>
            </div>

            <div className="space-y-3">
              {unmetConstraints.map((constraint, index) => (
                <div
                  key={index}
                  className="p-4 bg-red-50 rounded-lg border border-red-100"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-sm font-medium text-neutral-900">
                      {constraint.title}
                    </h3>

                    <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 whitespace-nowrap">
                      Не соблюдено
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Ограничение</p>
                      <p className="text-sm text-neutral-700">{constraint.value}</p>
                    </div>

                    <div>
                      <p className="text-xs text-neutral-500 mb-1">
                        Фактическое значение
                      </p>
                      <p className="text-sm text-neutral-700">{constraint.actual}</p>
                    </div>

                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Влияние</p>
                      <p className="text-sm text-neutral-700">{constraint.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button className="w-full bg-neutral-900 text-white py-4 rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
            <FileBarChart className="w-5 h-5" />
            <span>Вернуться на главную</span>
          </button>
        </div>
      </div>
    </main>
  );
}