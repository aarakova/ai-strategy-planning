import { useEffect, useState } from 'react';
import {
  GitBranch,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ShieldCheck,
  TriangleAlert,
  TrendingUp,
  Clock3,
  Users,
  ListChecks,
  AlertOctagon,
  Loader2,
} from 'lucide-react';

import { alternativesApi, type ApiScenario, type AlternativesData } from '../api/alternatives';

type RoleResources = {
  analysts: number;
  developers: number;
  testers: number;
};

type ScenarioRisk = {
  text: string;
  level: 'high' | 'medium' | 'low';
  impact: 'Высокий' | 'Средний' | 'Низкий';
};

type ProjectItem = {
  id: string;
  title: string;
  dependencyNote: string;
  period: string;
  resources: RoleResources;
  description: string;
};

type Scenario = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  aiInterpretation: string;
  strengths: string[];
  weaknesses: string[];
  totalDuration: string;
  riskCount: number;
  constraintsCompliance: number;
  resourceFeasibility: number;
  totalResources: RoleResources;
  keyRisks: ScenarioRisk[];
  constraintsOk: string[];
  constraintsIssues: string[];
  projects: ProjectItem[];
};

type ScenarioWithScore = Scenario & {
  integralScore: number;
  status: 'Рекомендуемый' | 'Допустимый' | 'Требует внимания';
};

function getIntegralScore(
  riskCount: number,
  constraintsCompliance: number,
  resourceFeasibility: number,
) {
  const riskPenalty = Math.min(riskCount * 10, 100);
  return Math.round(
    (100 - riskPenalty) * 0.35 + constraintsCompliance * 0.35 + resourceFeasibility * 0.3,
  );
}

function buildScenarioStatuses(scenarios: Scenario[]): ScenarioWithScore[] {
  const withScore = scenarios.map((scenario) => ({
    ...scenario,
    integralScore: getIntegralScore(
      scenario.riskCount,
      scenario.constraintsCompliance,
      scenario.resourceFeasibility,
    ),
    status: 'Требует внимания' as const,
  }));

  const highestScore = Math.max(...withScore.map((s) => s.integralScore));
  const attentionThreshold = 75;

  return withScore.map((scenario) => {
    let status: ScenarioWithScore['status'] = 'Требует внимания';
    if (scenario.integralScore === highestScore) {
      status = 'Рекомендуемый';
    } else if (scenario.integralScore >= attentionThreshold) {
      status = 'Допустимый';
    }
    return { ...scenario, status };
  });
}

function getScenarioStatusClass(status: ScenarioWithScore['status']) {
  if (status === 'Рекомендуемый') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Допустимый') return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
}

function getDotClasses(level: ScenarioRisk['level']) {
  if (level === 'high') return 'bg-red-500';
  if (level === 'medium') return 'bg-amber-500';
  return 'bg-emerald-500';
}

function getImpactClasses(level: ScenarioRisk['level']) {
  if (level === 'high') return 'bg-red-100 text-red-700';
  if (level === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-blue-100 text-blue-700';
}

function formatHours(value: number) {
  return `${value.toLocaleString('ru-RU')} чел.-ч.`;
}

function formatNumber(value: number) {
  return value.toLocaleString('ru-RU');
}

const TYPE_SUBTITLE: Record<string, string> = {
  BALANCED: 'Сбалансированный',
  CONSERVATIVE: 'Консервативный',
  RISKY: 'Рискованный',
};

function fromApi(s: ApiScenario, idx: number): Scenario {
  return {
    id: s.type.toLowerCase(),
    title: `Сценарий ${idx + 1}`,
    subtitle: TYPE_SUBTITLE[s.type] ?? s.name,
    description: s.description,
    aiInterpretation: s.ai_interpretation,
    strengths: s.strengths,
    weaknesses: s.weaknesses,
    totalDuration: `${s.total_duration_months} мес`,
    riskCount: s.risk_count,
    constraintsCompliance: s.constraint_compliance_percent,
    resourceFeasibility: s.resource_feasibility_percent,
    totalResources: s.total_resources,
    keyRisks: s.key_risks.map((r) => ({
      text: r.text,
      level: r.level,
      impact: r.impact as ScenarioRisk['impact'],
    })),
    constraintsOk: s.complied_constraints,
    constraintsIssues: s.constraints_in_attention,
    projects: s.projects.map((p, i) => ({
      id: `${s.type}-p${i}`,
      title: p.project_name,
      dependencyNote: p.dependency_note,
      period: p.period,
      resources: p.resources,
      description: p.description,
    })),
  };
}

export function AlternativesScreen({
  contextId,
  onNavigateToPlan,
}: {
  contextId: string | null;
  onNavigateToPlan: () => void;
}) {
  const [data, setData] = useState<AlternativesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!contextId) {
      setData(null);
      setSelectedId(null);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      setLoading(true);
      try {
        const result = await alternativesApi.get(contextId);
        setData(result);
        if (result.selected_scenario_id) setSelectedId(result.selected_scenario_id);
        if (result.status === 'IN_PROGRESS') timer = setTimeout(load, 5000);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => clearTimeout(timer);
  }, [contextId]);

  async function handleGenerate() {
    if (!contextId) return;
    setGenerating(true);
    setActionError(null);
    try {
      await alternativesApi.generate(contextId);
      setData((prev) => ({
        ...(prev ?? { scenarios: [], selected_scenario_id: null }),
        status: 'IN_PROGRESS',
      }));
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setActionError(err.detail ?? 'Ошибка запуска генерации');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSelectAndProceed() {
    if (!contextId || !selectedId) return;
    setSelectingId(selectedId);
    setActionError(null);
    try {
      await alternativesApi.select(contextId, selectedId);
      onNavigateToPlan();
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setActionError(err.detail ?? 'Ошибка при сохранении выбора');
    } finally {
      setSelectingId(null);
    }
  }

  const handleToggleDetails = (scenarioId: string) => {
    setExpandedDetails((prev) => ({ ...prev, [scenarioId]: !prev[scenarioId] }));
  };

  if (!contextId) {
    return (
      <main className="flex-1 overflow-auto bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-400 text-sm">Выберите мультипроект для работы</p>
      </main>
    );
  }

  if (!data || data.status === 'NOT_STARTED') {
    return (
      <main className="flex-1 overflow-auto bg-neutral-50">
        <div className="max-w-6xl mx-auto p-8">
          <h1 className="text-neutral-900 mb-2">Альтернативы</h1>
          <p className="text-sm text-neutral-500 mb-8">
            Формирование и сравнение сценариев реализации портфеля проектов с учётом
            ограничений, зависимостей, рисков и распределения ресурсов
          </p>
          <div className="bg-white border border-neutral-200 rounded-xl p-10 flex flex-col items-center gap-4">
            <GitBranch className="w-10 h-10 text-neutral-300" />
            <p className="text-neutral-500 text-sm">Сценарии ещё не сформированы</p>
            {actionError && (
              <p className="text-red-600 text-sm">{actionError}</p>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || loading}
              className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-lg text-sm hover:bg-neutral-800 transition-colors disabled:opacity-60"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{generating ? 'Запуск...' : 'Сформировать альтернативы'}</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (data.status === 'IN_PROGRESS') {
    return (
      <main className="flex-1 overflow-auto bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          <p className="text-neutral-500 text-sm">Генерация сценариев, подождите…</p>
        </div>
      </main>
    );
  }

  if (data.status === 'FAILED') {
    return (
      <main className="flex-1 overflow-auto bg-neutral-50">
        <div className="max-w-6xl mx-auto p-8">
          <h1 className="text-neutral-900 mb-2">Альтернативы</h1>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center gap-4">
            <TriangleAlert className="w-8 h-8 text-red-400" />
            <p className="text-red-700 text-sm text-center">{data.error ?? 'Ошибка генерации сценариев'}</p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Повторить</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  const scenarios = data.scenarios.map(fromApi);
  const scenariosWithScore = buildScenarioStatuses(scenarios);

  const comparison =
    scenariosWithScore.length === 3
      ? [
          {
            parameter: 'Интегральная оценка',
            values: scenariosWithScore.map((s) => `${s.integralScore} / 100`),
            highlight: true,
          },
          {
            parameter: 'Количество рисков',
            values: scenariosWithScore.map((s) => `${s.riskCount}`),
          },
          {
            parameter: 'Соблюдение ограничений',
            values: scenariosWithScore.map((s) => `${s.constraintsCompliance}%`),
          },
          {
            parameter: 'Ресурсная реализуемость',
            values: scenariosWithScore.map((s) => `${s.resourceFeasibility}%`),
          },
          {
            parameter: 'Общий срок реализации',
            values: scenariosWithScore.map((s) => s.totalDuration),
          },
          {
            parameter: 'Статус',
            values: scenariosWithScore.map((s) => s.status),
          },
        ]
      : [];

  return (
    <main className="flex-1 overflow-auto bg-neutral-50">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-neutral-900 mb-2">Альтернативы</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Формирование и сравнение сценариев реализации портфеля проектов с учётом
          ограничений, зависимостей, рисков и распределения ресурсов
        </p>

        <div className="space-y-6">
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-blue-500" />
                <h2 className="text-neutral-900">Сгенерированные сценарии</h2>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-60"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Перегенерировать</span>
              </button>
            </div>

            <p className="text-sm text-neutral-600 leading-relaxed mb-6">
              Во все сценарии входит один и тот же состав проектов, сформированный на этапе
              контекста. Альтернативы различаются последовательностью и параллельностью
              выполнения, распределением ресурсов, уровнем риска и степенью соблюдения
              ограничений.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {scenariosWithScore.map((scenario) => {
                const isSelected = selectedId === scenario.id;
                const isExpanded = expandedDetails[scenario.id] ?? false;

                return (
                  <div
                    key={scenario.id}
                    className={`p-5 rounded-xl border transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-white border-neutral-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-base font-medium text-neutral-900">{scenario.title}</h3>
                        <p className="text-sm text-neutral-500 mt-1">{scenario.subtitle}</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs whitespace-nowrap ${getScenarioStatusClass(scenario.status)}`}
                        >
                          {scenario.status}
                        </span>
                        <span className="px-2 py-1 rounded text-xs whitespace-nowrap bg-blue-100 text-blue-700">
                          Интегральная оценка: {scenario.integralScore}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-700 mb-4 leading-relaxed">
                      {scenario.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
                      <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock3 className="w-4 h-4 text-neutral-500" />
                          <p className="text-xs text-neutral-500">Общий срок</p>
                        </div>
                        <p className="text-sm text-neutral-800">{scenario.totalDuration}</p>
                      </div>

                      <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="flex items-center gap-2 mb-1">
                          <TriangleAlert className="w-4 h-4 text-neutral-500" />
                          <p className="text-xs text-neutral-500">Количество рисков</p>
                        </div>
                        <p className="text-sm text-neutral-800">{scenario.riskCount}</p>
                      </div>

                      <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="w-4 h-4 text-neutral-500" />
                          <p className="text-xs text-neutral-500">Соблюдение ограничений</p>
                        </div>
                        <p className="text-sm text-neutral-800">{scenario.constraintsCompliance}%</p>
                      </div>

                      <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-neutral-500" />
                          <p className="text-xs text-neutral-500">Ресурсы</p>
                        </div>
                        <div className="space-y-1 text-sm text-neutral-800">
                          <p>Аналитики: {formatHours(scenario.totalResources.analysts)}</p>
                          <p>Разработчики: {formatHours(scenario.totalResources.developers)}</p>
                          <p>Тестировщики: {formatHours(scenario.totalResources.testers)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-4">
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {scenario.aiInterpretation}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-sm font-medium text-neutral-900">Сильные стороны</h4>
                        </div>
                        <ul className="space-y-2 text-sm text-neutral-700">
                          {scenario.strengths.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="text-emerald-500">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TriangleAlert className="w-4 h-4 text-amber-600" />
                          <h4 className="text-sm font-medium text-neutral-900">Слабые стороны</h4>
                        </div>
                        <ul className="space-y-2 text-sm text-neutral-700">
                          {scenario.weaknesses.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="text-amber-500">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 border-t border-neutral-200 pt-4 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                            <div className="flex items-center gap-2 mb-2">
                              <TriangleAlert className="w-4 h-4 text-amber-600" />
                              <h4 className="text-sm font-medium text-neutral-900">
                                Ограничения в зоне внимания
                              </h4>
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-700">
                              {scenario.constraintsIssues.map((item) => (
                                <li key={item} className="flex gap-2">
                                  <span className="text-amber-500">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                            <div className="flex items-center gap-2 mb-2">
                              <ListChecks className="w-4 h-4 text-emerald-600" />
                              <h4 className="text-sm font-medium text-neutral-900">
                                Соблюдённые ограничения
                              </h4>
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-700">
                              {scenario.constraintsOk.map((item) => (
                                <li key={item} className="flex gap-2">
                                  <span className="text-emerald-500">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 lg:col-span-2">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertOctagon className="w-4 h-4 text-rose-600" />
                              <h4 className="text-sm font-medium text-neutral-900">
                                Перечень рисков сценария
                              </h4>
                            </div>
                            <div className="space-y-3">
                              {scenario.keyRisks.map((risk, index) => (
                                <div
                                  key={`${risk.text}-${index}`}
                                  className="p-4 bg-white rounded-lg border border-neutral-200"
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`w-2.5 h-2.5 rounded-full mt-2 ${getDotClasses(risk.level)}`}
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm text-neutral-700 mb-2">{risk.text}</p>
                                      <span
                                        className={`inline-flex px-2 py-1 rounded text-xs ${getImpactClasses(risk.level)}`}
                                      >
                                        Влияние: {risk.impact}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-neutral-50 rounded-lg border border-neutral-200 overflow-hidden">
                          <div className="px-4 py-3 border-b border-neutral-200">
                            <h4 className="text-sm font-medium text-neutral-900">
                              Проекты сценария
                            </h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px]">
                              <thead className="bg-white">
                                <tr className="border-b border-neutral-200">
                                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                                    Название проекта
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                                    Сроки
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                                    Описание проекта в сценарии
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                                    Ресурсы по ролям (чел.-ч.)
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {scenario.projects.map((project, index) => (
                                  <tr
                                    key={project.id}
                                    className="border-b border-neutral-100 last:border-b-0 align-top"
                                  >
                                    <td className="py-3 px-4 text-sm text-neutral-800">
                                      <div className="space-y-1">
                                        <p>
                                          {index + 1}. {project.title}
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                          {project.dependencyNote}
                                        </p>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-neutral-700">
                                      {project.period}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-neutral-700 leading-relaxed">
                                      {project.description}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-neutral-700">
                                      А: {formatNumber(project.resources.analysts)} / Р:{' '}
                                      {formatNumber(project.resources.developers)} / Т:{' '}
                                      {formatNumber(project.resources.testers)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => handleToggleDetails(scenario.id)}
                        className="px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 transition-colors flex items-center gap-2"
                      >
                        {isExpanded ? (
                          <>
                            <span>Скрыть подробности</span>
                            <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>Подробнее</span>
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedId(isSelected ? null : scenario.id)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                          isSelected
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600'
                            : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <span>
                          {isSelected ? 'Выбрано для планирования' : 'Выбрать для планирования'}
                        </span>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {comparison.length === 3 && (
            <section className="bg-white border border-neutral-200 rounded-xl p-6">
              <h2 className="text-neutral-900 mb-4">Матрица сравнения альтернатив</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                        Параметр
                      </th>
                      {scenariosWithScore.map((s) => (
                        <th
                          key={s.id}
                          className="text-left py-3 px-4 text-sm font-medium text-neutral-700"
                        >
                          {s.subtitle}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row) => (
                      <tr
                        key={row.parameter}
                        className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                          row.highlight ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-sm font-medium text-neutral-700">
                          {row.parameter}
                        </td>
                        {row.values.map((v, i) => (
                          <td key={i} className="py-3 px-4 text-sm text-neutral-700">
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}

                    <tr className="hover:bg-neutral-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-medium text-neutral-700">
                        Выбор для планирования
                      </td>
                      {scenariosWithScore.map((s) => {
                        const isSelected = selectedId === s.id;
                        return (
                          <td key={s.id} className="py-4 px-4">
                            <button
                              type="button"
                              onClick={() => setSelectedId(isSelected ? null : s.id)}
                              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                              }`}
                            >
                              {isSelected ? 'Выбрано' : 'Выбрать'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {actionError && (
            <p className="text-red-600 text-sm text-center">{actionError}</p>
          )}

          <button
            type="button"
            onClick={handleSelectAndProceed}
            disabled={!selectedId || !!selectingId}
            className="w-full bg-neutral-900 text-white py-4 rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectingId ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            <span>{selectingId ? 'Сохранение...' : 'Перейти к плану'}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
