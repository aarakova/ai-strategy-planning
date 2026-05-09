import {
  Play,
  AlertTriangle,
  Info,
  Clock3,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export function AnalizScreen() {
  const risks = [
    {
      text: 'Задержка проекта B может повлиять на сроки проекта D, так как D зависит от завершения B.',
      level: 'high',
      impact: 'Высокий',
    },
    {
      text: 'Отклонение проекта C может передаться на проекты E и F по цепочке зависимостей.',
      level: 'high',
      impact: 'Высокий',
    },
    {
      text: 'В период параллельного выполнения проектов B, C и E возникает дефицит разработчиков.',
      level: 'high',
      impact: 'Высокий',
    },
    {
      text: 'Нагрузка на QA-роль распределена неравномерно, что создает пик ближе к критическим срокам.',
      level: 'medium',
      impact: 'Средний',
    },
  ];

  const scheduleAnalysis = [
    'Горизонт планирования покрывает портфель частично: часть проектов укладывается в целевой период, но проект E выходит за критический срок.',
    'Проекты, выходящие за критические сроки: C и E.',
    'Наибольшее влияние на сроки создают зависимости B → D и C → E → F.',
    'Проект C уже имеет отклонение, которое влияет на последующий проект E.',
  ];

  const resourceAnalysis = [
    {
      role: 'Аналитики',
      demand: '420 ч',
      limit: '480 ч',
      balance: 'Профицит 60 ч',
      status: 'ok',
    },
    {
      role: 'Разработчики',
      demand: '1280 ч',
      limit: '1120 ч',
      balance: 'Дефицит 160 ч',
      status: 'critical',
    },
    {
      role: 'Тестировщики',
      demand: '560 ч',
      limit: '520 ч',
      balance: 'Дефицит 40 ч',
      status: 'warning',
    },
  ];

  const deviationAnalysis = [
    {
      project: 'Проект B',
      deviation: 'Небольшое отклонение по ресурсам',
      danger: 'Средняя',
      transfer: 'Влияние на D возможно при росте отклонения',
    },
    {
      project: 'Проект C',
      deviation: 'Отклонение по срокам',
      danger: 'Высокая',
      transfer: 'Отклонение уже влияет на проект E',
    },
    {
      project: 'Проект E',
      deviation: 'Концентрация проблем по срокам и ресурсам',
      danger: 'Высокая',
      transfer: 'Является точкой накопления отклонений в сегменте C → E → F',
    },
  ];

  const aiExplanation =
    'Портфель в текущем состоянии реализуем частично, однако устойчивость плана снижена из-за каскадных зависимостей, дефицита отдельных ролей и уже возникших отклонений. Наиболее проблемной зоной является сегмент, связанный с проектами C, E и F, где одновременно пересекаются проблемы по срокам, ресурсам и ограничениям.';

  const recommendations = [
    {
      title: 'Снизить нагрузку на дефицитные роли',
      text: 'Рекомендуется перераспределить разработчиков и QA между проектами B, C и E, так как именно эти проекты формируют пик нагрузки и дефицит ресурсов.',
    },
    {
      title: 'Пересмотреть последовательность зависимых проектов',
      text: 'Следует проверить возможность частичного распараллеливания или декомпозиции цепочек B → D и C → E → F, потому что текущая структура усиливает перенос задержек между проектами.',
    },
    {
      title: 'Выделить приоритетный контроль по проекту E',
      text: 'Проект E требует отдельного мониторинга, поскольку одновременно подпадает под несколько ограничений и является наиболее уязвимой точкой портфеля.',
    },
    {
      title: 'Локализовать уже возникшие отклонения',
      text: 'Необходимо отработать отклонение проекта C до того, как оно закрепится в последующем сегменте портфеля и усилит конфликт по срокам.',
    },
  ];

  const getStatusClasses = (status) => {
    if (status === 'critical') {
      return 'bg-red-50 border-red-200 text-red-700';
    }
    if (status === 'warning') {
      return 'bg-amber-50 border-amber-200 text-amber-700';
    }
    return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  };

  const getDotClasses = (level) => {
    if (level === 'high') return 'bg-red-500';
    if (level === 'medium') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getImpactClasses = (level) => {
    if (level === 'high') return 'bg-red-100 text-red-700';
    if (level === 'medium') return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <main className="flex-1 overflow-auto bg-neutral-50">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-neutral-900 mb-2">Анализ</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Анализ зависимостей, реализуемости портфеля, ограничений и текущих отклонений
        </p>

        <div className="space-y-6">
          {/* Граф зависимостей проектов */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-neutral-900 mb-1">Граф зависимостей проектов</h2>
                <p className="text-sm text-neutral-500">
                  Направленный граф с учетом статуса проектов и связей между ними
                </p>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200 overflow-x-auto">
              <svg viewBox="0 0 920 310" className="w-full h-auto min-w-[860px]">
                <defs>
                  <marker
                    id="arrowGray"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="5"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 z" fill="#a1a1aa" />
                  </marker>
                </defs>

                <line x1="150" y1="95" x2="305" y2="95" stroke="#a1a1aa" strokeWidth="2.5" markerEnd="url(#arrowGray)" />
                <line x1="150" y1="225" x2="305" y2="225" stroke="#a1a1aa" strokeWidth="2.5" markerEnd="url(#arrowGray)" />
                <line x1="385" y1="95" x2="540" y2="95" stroke="#a1a1aa" strokeWidth="2.5" markerEnd="url(#arrowGray)" />
                <line x1="385" y1="225" x2="540" y2="225" stroke="#a1a1aa" strokeWidth="2.5" markerEnd="url(#arrowGray)" />
                <line x1="620" y1="225" x2="775" y2="225" stroke="#a1a1aa" strokeWidth="2.5" markerEnd="url(#arrowGray)" />

                <circle cx="110" cy="95" r="34" fill="#ecfdf5" stroke="#10b981" strokeWidth="2.5" />
                <text x="110" y="90" textAnchor="middle" fontSize="11" fill="#262626">Проект</text>
                <text x="110" y="104" textAnchor="middle" fontSize="12" fill="#262626">A</text>

                <circle cx="110" cy="225" r="34" fill="#ecfdf5" stroke="#10b981" strokeWidth="2.5" />
                <text x="110" y="220" textAnchor="middle" fontSize="11" fill="#262626">Проект</text>
                <text x="110" y="234" textAnchor="middle" fontSize="12" fill="#262626">G</text>

                <circle cx="345" cy="95" r="34" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2.5" />
                <text x="345" y="90" textAnchor="middle" fontSize="11" fill="#262626">Проект</text>
                <text x="345" y="104" textAnchor="middle" fontSize="12" fill="#262626">B</text>

                <circle cx="345" cy="225" r="34" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2.5" />
                <text x="345" y="220" textAnchor="middle" fontSize="11" fill="#262626">Проект</text>
                <text x="345" y="234" textAnchor="middle" fontSize="12" fill="#262626">C</text>

                <circle cx="580" cy="95" r="34" fill="#f5f5f5" stroke="#a3a3a3" strokeWidth="2.5" />
                <text x="580" y="90" textAnchor="middle" fontSize="11" fill="#262626">Проект</text>
                <text x="580" y="104" textAnchor="middle" fontSize="12" fill="#262626">D</text>

                <circle cx="580" cy="225" r="34" fill="#f5f5f5" stroke="#a3a3a3" strokeWidth="2.5" />
                <text x="580" y="220" textAnchor="middle" fontSize="11" fill="#262626">Проект</text>
                <text x="580" y="234" textAnchor="middle" fontSize="12" fill="#262626">E</text>

                <circle cx="815" cy="225" r="34" fill="#f5f5f5" stroke="#a3a3a3" strokeWidth="2.5" />
                <text x="815" y="220" textAnchor="middle" fontSize="11" fill="#262626">Проект</text>
                <text x="815" y="234" textAnchor="middle" fontSize="12" fill="#262626">F</text>
              </svg>

              <div className="flex flex-wrap items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-50"></div>
                  <span className="text-xs text-neutral-600">Завершено</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-50"></div>
                  <span className="text-xs text-neutral-600">В работе</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-neutral-400 bg-neutral-100"></div>
                  <span className="text-xs text-neutral-600">Не начато</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 border-t-2 border-neutral-400"></div>
                  <span className="text-xs text-neutral-600">Зависимость</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs text-neutral-600">Направление зависимости</span>
                </div>
              </div>
            </div>
          </section>

          {/* Выявленные риски */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-neutral-900">Выявленные риски</h2>
            </div>

            <div className="space-y-3">
              {risks.map((item, index) => (
                <div key={index} className="p-4 bg-white rounded-lg border border-neutral-200">
                  <div className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-2 ${getDotClasses(item.level)}`} />

                    <div className="flex-1">
                      <p className="text-sm text-neutral-700 mb-2">{item.text}</p>

                      <span className={`inline-flex px-2 py-1 rounded text-xs ${getImpactClasses(item.level)}`}>
                        Влияние: {item.impact}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Реализуемость по срокам */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock3 className="w-5 h-5 text-blue-500" />
              <h2 className="text-neutral-900">Анализ реализуемости портфеля по срокам</h2>
            </div>

            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <ul className="space-y-2 text-sm text-neutral-700 leading-relaxed">
                {scheduleAnalysis.map((item, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Ресурсы */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-500" />
              <h2 className="text-neutral-900">Анализ загрузки и дефицита ресурсов по ролям</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-neutral-50 border border-neutral-200">Роль</th>
                    <th className="text-left p-3 bg-neutral-50 border border-neutral-200">Суммарная потребность</th>
                    <th className="text-left p-3 bg-neutral-50 border border-neutral-200">Лимит</th>
                    <th className="text-left p-3 bg-neutral-50 border border-neutral-200">Дефицит / профицит</th>
                  </tr>
                </thead>
                <tbody>
                  {resourceAnalysis.map((item, index) => (
                    <tr key={index}>
                      <td className="p-3 border border-neutral-200 text-neutral-900">{item.role}</td>
                      <td className="p-3 border border-neutral-200 text-neutral-700">{item.demand}</td>
                      <td className="p-3 border border-neutral-200 text-neutral-700">{item.limit}</td>
                      <td className="p-3 border border-neutral-200">
                        <span className={`inline-flex px-2 py-1 rounded text-xs border ${getStatusClasses(item.status)}`}>
                          {item.balance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Текущие отклонения */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-neutral-900">Анализ текущих отклонений</h2>
            </div>

            <div className="space-y-3">
              {deviationAnalysis.map((item, index) => (
                <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Проект</p>
                      <p className="text-sm text-neutral-900">{item.project}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Отклонение</p>
                      <p className="text-sm text-neutral-700">{item.deviation}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Опасность для портфеля</p>
                      <p className="text-sm text-neutral-700">{item.danger}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Передача по зависимостям</p>
                      <p className="text-sm text-neutral-700">{item.transfer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ИИ-объяснения */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-blue-500" />
              <h2 className="text-neutral-900">ИИ-объяснения</h2>
            </div>

            <div className="p-4 rounded-lg border border-neutral-200 bg-white">
              <p className="text-sm text-neutral-700 leading-relaxed">{aiExplanation}</p>
            </div>
          </section>

          {/* ИИ-рекомендации */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-neutral-900">ИИ-рекомендации</h2>
            </div>

            <div className="p-4 rounded-lg border border-neutral-200 bg-white">
              <ul className="space-y-4">
                {recommendations.map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-neutral-400 mt-0.5">•</span>
                    <div>
                      <h3 className="text-sm font-medium text-neutral-900 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <button className="w-full bg-neutral-900 text-white py-4 rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
            <Play className="w-5 h-5" />
            <span>Перейти к целям</span>
          </button>
        </div>
      </div>
    </main>
  );
}