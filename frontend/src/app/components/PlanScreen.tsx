import { useEffect, useState } from 'react';
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
  Loader2,
} from 'lucide-react';
import { planApi } from '../api/plan';
import type { PlanData, PlanResponse } from '../api/plan';

export function PlanScreen({
  contextId,
  selectedMultiproject,
}: {
  contextId: string | null;
  selectedMultiproject?: { name?: string } | null;
}) {
  const multiprojectName = selectedMultiproject?.name || 'Название мультипроекта';

  const [data, setData] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contextId) { setData(null); return; }
    let timer: ReturnType<typeof setTimeout>;

    const load = async () => {
      setLoading(true);
      try {
        const result = await planApi.get(contextId);
        setData(result);
        if (result.status === 'IN_PROGRESS' || result.status === 'NOT_STARTED') {
          timer = setTimeout(load, 5000);
        }
      } catch {
        timer = setTimeout(load, 5000);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => clearTimeout(timer);
  }, [contextId]);

  const getPhaseStatusColor = (s: string) => {
    if (s === 'Выполнен') return 'bg-emerald-100 text-emerald-700';
    if (s === 'В работе') return 'bg-blue-100 text-blue-700';
    return 'bg-neutral-100 text-neutral-600';
  };

  const getMilestoneStatusColor = (s: string) => {
    if (s === 'Достигнута') return 'bg-emerald-100 text-emerald-700';
    return 'bg-neutral-100 text-neutral-600';
  };

  const getLoadColor = (p: number) => {
    if (p >= 95) return 'bg-red-500';
    if (p >= 80) return 'bg-amber-500';
    if (p >= 60) return 'bg-emerald-500';
    return 'bg-blue-500';
  };

  const getLoadText = (p: number) => {
    if (p >= 95) return 'Критичная загрузка';
    if (p >= 80) return 'Высокая загрузка';
    if (p >= 60) return 'Допустимая загрузка';
    return 'Низкая загрузка';
  };

  const getDotClasses = (impact: string) => {
    if (impact === 'Высокий') return 'bg-red-500';
    if (impact === 'Средний') return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const getImpactClasses = (impact: string) => {
    if (impact === 'Высокий') return 'bg-red-100 text-red-700';
    if (impact === 'Средний') return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  // ── Состояния ────────────────────────────────────────────────────────────────

  if (!contextId) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          <div className="p-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm text-center">
            Выберите мультипроект для просмотра плана.
          </div>
        </div>
      </main>
    );
  }

  if (loading && !data) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8 flex items-center justify-center gap-3 py-20 text-neutral-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Загрузка…</span>
        </div>
      </main>
    );
  }

  if (!data || data.status === 'NOT_STARTED' || data.status === 'IN_PROGRESS') {
    return (
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          <h1 className="text-neutral-900 mb-2">План &quot;{multiprojectName}&quot;</h1>
          <div className="flex items-center justify-center gap-3 py-20 text-neutral-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Формирование плана, подождите…</span>
          </div>
        </div>
      </main>
    );
  }

  if (data.status === 'FAILED') {
    return (
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          <h1 className="text-neutral-900 mb-2">План &quot;{multiprojectName}&quot;</h1>
          <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
            <p className="font-medium mb-1">Формирование плана завершилось с ошибкой</p>
            <p>{data.error ?? 'Неизвестная ошибка'}</p>
          </div>
        </div>
      </main>
    );
  }

  // ── COMPLETED ─────────────────────────────────────────────────────────────────

  const plan = data.plan as PlanData;
  const passport = plan.plan_passport;
  const stages = plan.stages ?? [];
  const risks = plan.plan_risks ?? [];
  const constraints = plan.constraints_in_attention ?? [];
  const loadingByStages = plan.resource_loading_by_stages ?? [];

  return (
    <main className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-neutral-900 mb-2">План &quot;{multiprojectName}&quot;</h1>

        <p className="text-sm text-neutral-500 mb-8">
          Формирование стратегического плана мультипроекта на основе выбранной альтернативы
        </p>

        <div className="space-y-6">
          {/* Паспорт */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h2 className="text-neutral-900">Паспорт стратегического плана</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">Выбранный вариант</p>
                <p className="text-sm font-medium text-neutral-900">{passport.selected_variant}</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">Плановый горизонт</p>
                <p className="text-sm font-medium text-neutral-900">{passport.planning_horizon_months} мес</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">Контрольных точек</p>
                <p className="text-sm font-medium text-neutral-900">{passport.checkpoint_count}</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">Рисков</p>
                <p className="text-sm font-medium text-neutral-900">{passport.risk_count}</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">Ограничения в зоне внимания</p>
                <p className="text-sm font-medium text-neutral-900">{passport.constraints_in_attention_count}</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">Прогресс выполнения</p>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-neutral-900">
                    {stages.filter((s) => s.stage_status === 'Выполнен').length} из {stages.length}
                  </p>
                  <p className="text-sm text-neutral-500">{passport.execution_progress}%</p>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${passport.execution_progress}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Этапы */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarRange className="w-5 h-5 text-blue-500" />
                  <h2 className="text-neutral-900">Этапы реализации плана</h2>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Этапы сформированы по контрольным точкам. Каждый этап включает состав
                  проектов, завершается контрольной точкой и содержит расчёт потребности в ресурсах.
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-lg text-xs bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Сгенерировано ИИ</span>
              </span>
            </div>

            <div className="space-y-5">
              {stages.map((stage, index) => (
                <div key={index} className="p-5 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Этап {stage.stage_number}</p>
                      <h3 className="text-sm font-medium text-neutral-900">{stage.name}</h3>
                      <p className="text-sm text-neutral-500 mt-1">{stage.period}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${getPhaseStatusColor(stage.stage_status)}`}>
                      {stage.stage_status}
                    </span>
                  </div>

                  {/* Состав */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="w-4 h-4 text-neutral-500" />
                      <h4 className="text-sm font-medium text-neutral-900">Состав этапа</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full bg-white border border-neutral-200 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="border-b border-neutral-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Проект</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Доля</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Роли</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stage.composition ?? []).map((item, i) => (
                            <tr key={i} className="border-b border-neutral-100 last:border-b-0">
                              <td className="py-3 px-4 text-sm text-neutral-700">{item.project_name}</td>
                              <td className="py-3 px-4 text-sm font-medium text-neutral-900">{item.share}%</td>
                              <td className="py-3 px-4 text-sm text-neutral-700">{item.roles}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Контрольная точка */}
                  {stage.checkpoint && (
                    <div className="p-4 bg-white rounded-lg border border-neutral-200 mb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Flag className="w-4 h-4 text-amber-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Контрольная точка</p>
                            <h4 className="text-sm font-medium text-neutral-900 mb-1">{stage.checkpoint.name}</h4>
                            <p className="text-sm text-neutral-500">Дата: {stage.checkpoint.date}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${getMilestoneStatusColor(stage.checkpoint.status)}`}>
                          {stage.checkpoint.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Ресурсы */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-neutral-500" />
                      <h4 className="text-sm font-medium text-neutral-900">Ресурсы этапа</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full bg-white border border-neutral-200 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="border-b border-neutral-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Роль</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Требуется, ч</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Доступно, ч</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Загрузка</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stage.resources ?? []).map((res) => {
                            const pct = res.loading_percent ?? Math.round((res.required_hours / (res.available_hours || 1)) * 100);
                            return (
                              <tr key={res.role} className="border-b border-neutral-100 last:border-b-0">
                                <td className="py-3 px-4 text-sm font-medium text-neutral-900">{res.role}</td>
                                <td className="py-3 px-4 text-sm text-neutral-700">{res.required_hours} ч</td>
                                <td className="py-3 px-4 text-sm text-neutral-700">{res.available_hours} ч</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3 mb-1">
                                    <div className="w-28 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${getLoadColor(pct)}`}
                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-sm text-neutral-700">{pct}%</span>
                                  </div>
                                  <p className="text-xs text-neutral-500">{res.loading_degree ?? getLoadText(pct)}</p>
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

          {/* Загрузка по этапам */}
          {loadingByStages.length > 0 && (
            <section className="bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-500" />
                <h2 className="text-neutral-900">Загрузка ресурсов по этапам</h2>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed mb-5">
                Процент рассчитывается как отношение требуемых человеко-часов к доступному фонду времени.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Этап</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Аналитики</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Разработчики</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Тестировщики</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingByStages.map((row) => (
                      <tr key={row.stage_number} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-neutral-900">Этап {row.stage_number}</td>
                        {([row.analysts_percent, row.developers_percent, row.testers_percent] as number[]).map((pct, i) => (
                          <td key={i} className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getLoadColor(pct)}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-neutral-700">{pct}%</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Риски */}
          {risks.length > 0 && (
            <section className="bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-neutral-900">Риски плана</h2>
              </div>
              <div className="space-y-3">
                {risks.map((item, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border border-neutral-200">
                    <div className="flex items-start gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full mt-2 ${getDotClasses(item.impact)}`} />
                      <div className="flex-1">
                        <p className="text-sm text-neutral-700 mb-2">{item.risk}</p>
                        <span className={`inline-flex px-2 py-1 rounded text-xs ${getImpactClasses(item.impact)}`}>
                          Влияние: {item.impact}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Ограничения */}
          {constraints.length > 0 && (
            <section className="bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h2 className="text-neutral-900">Ограничения в зоне внимания</h2>
              </div>
              <div className="space-y-3">
                {constraints.map((c, index) => (
                  <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-sm font-medium text-neutral-900">{c.constraint}</h3>
                      <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 whitespace-nowrap">Требует внимания</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Фактическое значение</p>
                        <p className="text-sm text-neutral-700">{c.actual_value}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Влияние</p>
                        <p className="text-sm text-neutral-700">{c.impact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <button className="w-full bg-neutral-900 text-white py-4 rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
            <FileBarChart className="w-5 h-5" />
            <span>Вернуться на главную</span>
          </button>
        </div>
      </div>
    </main>
  );
}
