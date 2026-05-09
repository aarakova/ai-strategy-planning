import { useMemo, useState } from 'react';
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
} from 'lucide-react';

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

  const score =
    (100 - riskPenalty) * 0.35 +
    constraintsCompliance * 0.35 +
    resourceFeasibility * 0.3;

  return Math.round(score);
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

  const sortedScores = [...withScore]
    .map((item) => item.integralScore)
    .sort((a, b) => b - a);

  const highestScore = sortedScores[0];
  const attentionThreshold = 75;

  return withScore.map((scenario) => {
    let status: ScenarioWithScore['status'] = 'Требует внимания';

    if (scenario.integralScore === highestScore) {
      status = 'Рекомендуемый';
    } else if (scenario.integralScore >= attentionThreshold) {
      status = 'Допустимый';
    }

    return {
      ...scenario,
      status,
    };
  });
}

function getScenarioStatusClass(status: ScenarioWithScore['status']) {
  if (status === 'Рекомендуемый') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'Допустимый') {
    return 'bg-blue-100 text-blue-700';
  }

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

export function AlternativesScreen() {
  const scenarios = useMemo<Scenario[]>(
    () => [
      {
        id: 'balanced',
        title: 'Сценарий 1',
        subtitle: 'Сбалансированный',
        description:
          'Сценарий обеспечивает компромисс между уровнем риска, ресурсной реализуемостью и соблюдением ограничений. Полный состав портфеля сохраняется, а последовательность работ выстраивается так, чтобы сохранить управляемость реализации.',
        aiInterpretation:
          'ИИ-интерпретация: сценарий подходит как базовый вариант для дальнейшего планирования. Он обеспечивает устойчивое выполнение портфеля, умеренную параллельность работ и контролируемый уровень рисков.',
        strengths: [
          'Хороший баланс между скоростью и устойчивостью реализации',
          'Ресурсная потребность остаётся управляемой',
          'Допустимый уровень рисков при сохранении параллельности',
        ],
        weaknesses: [
          'Не даёт максимального ускорения',
          'Требует контроля нагрузки разработчиков в отдельных периодах',
        ],
        totalDuration: '8 мес',
        riskCount: 3,
        constraintsCompliance: 92,
        resourceFeasibility: 86,
        totalResources: {
          analysts: 960,
          developers: 2240,
          testers: 1120,
        },
        keyRisks: [
          {
            text: 'Сдвиг зависимого проекта при отклонении сроков модернизации CI/CD',
            level: 'high',
            impact: 'Высокий',
          },
          {
            text: 'Задержка аналитической витрины из-за позднего поступления входных данных',
            level: 'medium',
            impact: 'Средний',
          },
          {
            text: 'Повышенная нагрузка на команду разработки в период архитектурных изменений',
            level: 'medium',
            impact: 'Средний',
          },
        ],
        constraintsOk: [
          'Соблюдены ключевые зависимости между проектами',
          'Не превышен общий лимит по аналитикам',
          'Общий срок реализации укладывается в горизонт планирования',
          'Последовательность работ соответствует зависимостям между проектами',
        ],
        constraintsIssues: [
          'Требуется дополнительный контроль загрузки разработчиков в середине сценария',
        ],
        projects: [
          {
            id: 'project-1',
            title: 'Модернизация CI/CD',
            dependencyNote: 'Базовый проект сценария, выполняется первым',
            period: 'Май 2026 — Июль 2026',
            resources: { analysts: 160, developers: 640, testers: 160 },
            description:
              'Проект запускается первым, так как формирует инфраструктурную основу для более управляемой реализации последующих инициатив.',
          },
          {
            id: 'project-2',
            title: 'Система управления требованиями',
            dependencyNote: 'Идёт параллельно с проектом 3',
            period: 'Май 2026 — Август 2026',
            resources: { analysts: 320, developers: 480, testers: 160 },
            description:
              'Проект формирует основу для повышения прозрачности портфеля и качества дальнейшего планирования.',
          },
          {
            id: 'project-3',
            title: 'Рефакторинг ядра платформы',
            dependencyNote: 'Зависит от проекта 1, идёт параллельно с проектом 2',
            period: 'Август 2026 — Ноябрь 2026',
            resources: { analysts: 160, developers: 800, testers: 320 },
            description:
              'Проект стартует после завершения ключевых работ по CI/CD, что позволяет ускорить реализацию без существенного роста риска.',
          },
          {
            id: 'project-4',
            title: 'Портфельная аналитическая витрина',
            dependencyNote: 'Зависит от проекта 2',
            period: 'Сентябрь 2026 — Декабрь 2026',
            resources: { analysts: 320, developers: 320, testers: 480 },
            description:
              'Проект запускается после подготовки процессов управления требованиями, чтобы витрина опиралась на более структурированные данные.',
          },
        ],
      },
      {
        id: 'conservative',
        title: 'Сценарий 2',
        subtitle: 'Консервативный',
        description:
          'Сценарий ориентирован на минимизацию риска и повышение устойчивости реализации. Все проекты портфеля выполняются в более осторожной последовательности с уменьшением числа параллельных работ.',
        aiInterpretation:
          'ИИ-интерпретация: сценарий обеспечивает лучшее соблюдение ограничений и снижает вероятность каскадных отклонений, но увеличивает общий срок реализации портфеля.',
        strengths: [
          'Наиболее устойчивый вариант реализации',
          'Лучшее соблюдение ограничений и зависимостей',
          'Низкая вероятность каскадных отклонений по срокам',
        ],
        weaknesses: [
          'Наиболее длительный общий срок реализации',
          'Более медленное достижение результатов по портфелю',
        ],
        totalDuration: '9,5 мес',
        riskCount: 2,
        constraintsCompliance: 97,
        resourceFeasibility: 94,
        totalResources: {
          analysts: 800,
          developers: 1920,
          testers: 960,
        },
        keyRisks: [
          {
            text: 'Потеря темпа реализации портфеля',
            level: 'medium',
            impact: 'Средний',
          },
          {
            text: 'Смещение части эффектов за пределы целевого горизонта',
            level: 'high',
            impact: 'Высокий',
          },
        ],
        constraintsOk: [
          'Соблюдены все ключевые зависимости между проектами',
          'Ресурсная потребность распределена равномерно',
          'Соблюдены ограничения по последовательности выполнения',
          'Минимизировано число параллельных работ в критичных периодах',
        ],
        constraintsIssues: ['Сценарий приближается к верхней границе допустимого срока реализации'],
        projects: [
          {
            id: 'project-1',
            title: 'Система управления требованиями',
            dependencyNote: 'Выполняется первой, формирует основу для следующих проектов',
            period: 'Май 2026 — Август 2026',
            resources: { analysts: 320, developers: 480, testers: 160 },
            description:
              'Проект открывает сценарий и снижает вероятность ошибок при последующем выполнении остальных инициатив.',
          },
          {
            id: 'project-2',
            title: 'Модернизация CI/CD',
            dependencyNote: 'Зависит от проекта 1',
            period: 'Август 2026 — Октябрь 2026',
            resources: { analysts: 160, developers: 480, testers: 160 },
            description:
              'Инфраструктурные изменения выполняются после стабилизации требований, что уменьшает риск ресурсных и организационных конфликтов.',
          },
          {
            id: 'project-3',
            title: 'Рефакторинг ядра платформы',
            dependencyNote: 'Зависит от проекта 2',
            period: 'Октябрь 2026 — Январь 2027',
            resources: { analysts: 160, developers: 640, testers: 320 },
            description:
              'Проект переносится на более поздний момент, чтобы снизить вероятность каскадных технических проблем.',
          },
          {
            id: 'project-4',
            title: 'Портфельная аналитическая витрина',
            dependencyNote: 'Зависит от проектов 1 и 3',
            period: 'Январь 2027 — Февраль 2027',
            resources: { analysts: 160, developers: 320, testers: 320 },
            description:
              'Витрина строится на завершающем этапе, когда ключевые процессы и архитектурные компоненты уже стабилизированы.',
          },
        ],
      },
      {
        id: 'aggressive',
        title: 'Сценарий 3',
        subtitle: 'Рискованный',
        description:
          'Сценарий ориентирован на максимальное ускорение реализации портфеля. Все проекты сохраняются, но выполняются с более высокой параллельностью и повышенной потребностью в ключевых ролях.',
        aiInterpretation:
          'ИИ-интерпретация: сценарий позволяет ускорить реализацию, но сопровождается повышенной вероятностью отклонений по срокам, ресурсам и качеству исполнения.',
        strengths: [
          'Минимальный общий срок реализации',
          'Максимальная интенсивность выполнения портфеля',
          'Высокая скорость запуска зависимых работ',
        ],
        weaknesses: [
          'Наибольшая ресурсная потребность',
          'Повышенная вероятность срыва зависимых работ',
          'Слабее соблюдаются ограничения по ресурсам',
        ],
        totalDuration: '7 мес',
        riskCount: 5,
        constraintsCompliance: 76,
        resourceFeasibility: 72,
        totalResources: {
          analysts: 1120,
          developers: 2560,
          testers: 1280,
        },
        keyRisks: [
          {
            text: 'Высокая нагрузка на разработчиков и тестировщиков в пиковые периоды',
            level: 'high',
            impact: 'Высокий',
          },
          {
            text: 'Каскадный срыв сроков при отклонении одного из ранних проектов',
            level: 'high',
            impact: 'Высокий',
          },
          {
            text: 'Ухудшение качества исполнения из-за интенсивной параллельной работы',
            level: 'high',
            impact: 'Высокий',
          },
          {
            text: 'Выход части работ за допустимые ресурсные лимиты',
            level: 'high',
            impact: 'Высокий',
          },
          {
            text: 'Снижение управляемости портфеля при одновременном ведении нескольких критичных инициатив',
            level: 'medium',
            impact: 'Средний',
          },
        ],
        constraintsOk: [
          'Сохранён полный состав портфеля',
          'Формально учтены зависимости между проектами',
          'Общий срок реализации минимален среди сценариев',
        ],
        constraintsIssues: [
          'Ресурсные ограничения соблюдаются частично',
          'Повышена потребность в тестировщиках',
          'Требуется усиленный контроль сроков зависимых проектов',
        ],
        projects: [
          {
            id: 'project-1',
            title: 'Модернизация CI/CD',
            dependencyNote: 'Выполняется первой без временного буфера',
            period: 'Май 2026 — Июль 2026',
            resources: { analysts: 160, developers: 640, testers: 160 },
            description:
              'Проект запускается немедленно, чтобы как можно раньше разблокировать последующие работы.',
          },
          {
            id: 'project-2',
            title: 'Система управления требованиями',
            dependencyNote: 'Идёт параллельно с проектом 3',
            period: 'Май 2026 — Июль 2026',
            resources: { analysts: 320, developers: 480, testers: 160 },
            description:
              'Проект стартует максимально рано, чтобы быстрее повысить управляемость портфеля, несмотря на нагрузку на аналитический контур.',
          },
          {
            id: 'project-3',
            title: 'Рефакторинг ядра платформы',
            dependencyNote: 'Зависит от проекта 1, идёт параллельно с проектом 2',
            period: 'Июль 2026 — Октябрь 2026',
            resources: { analysts: 320, developers: 960, testers: 480 },
            description:
              'Проект запускается сразу после подготовки инфраструктурной базы, что ускоряет сценарий, но заметно повышает риск.',
          },
          {
            id: 'project-4',
            title: 'Портфельная аналитическая витрина',
            dependencyNote: 'Зависит от проекта 2',
            period: 'Август 2026 — Ноябрь 2026',
            resources: { analysts: 320, developers: 480, testers: 480 },
            description:
              'Проект стартует при минимально достаточной готовности входных данных для ускоренного получения аналитического результата.',
          },
        ],
      },
    ],
    [],
  );

  const scenariosWithScore = useMemo(() => buildScenarioStatuses(scenarios), [scenarios]);

  const [selectedForPlanning, setSelectedForPlanning] = useState<Record<string, boolean>>({
    balanced: false,
    conservative: false,
    aggressive: false,
  });

  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({
    balanced: false,
    conservative: false,
    aggressive: false,
  });

  const handleTogglePlanning = (scenarioId: string) => {
    setSelectedForPlanning((prev) => ({
      ...prev,
      [scenarioId]: !prev[scenarioId],
    }));
  };

  const handleToggleDetails = (scenarioId: string) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [scenarioId]: !prev[scenarioId],
    }));
  };

  const comparison = [
    {
      parameter: 'Интегральная оценка',
      balanced: `${scenariosWithScore[0].integralScore} / 100`,
      conservative: `${scenariosWithScore[1].integralScore} / 100`,
      aggressive: `${scenariosWithScore[2].integralScore} / 100`,
      highlight: true,
    },
    {
      parameter: 'Количество рисков',
      balanced: `${scenariosWithScore[0].riskCount}`,
      conservative: `${scenariosWithScore[1].riskCount}`,
      aggressive: `${scenariosWithScore[2].riskCount}`,
    },
    {
      parameter: 'Соблюдение ограничений',
      balanced: `${scenariosWithScore[0].constraintsCompliance}%`,
      conservative: `${scenariosWithScore[1].constraintsCompliance}%`,
      aggressive: `${scenariosWithScore[2].constraintsCompliance}%`,
    },
    {
      parameter: 'Ресурсная реализуемость',
      balanced: `${scenariosWithScore[0].resourceFeasibility}%`,
      conservative: `${scenariosWithScore[1].resourceFeasibility}%`,
      aggressive: `${scenariosWithScore[2].resourceFeasibility}%`,
    },
    {
      parameter: 'Общий срок реализации сценария',
      balanced: scenariosWithScore[0].totalDuration,
      conservative: scenariosWithScore[1].totalDuration,
      aggressive: scenariosWithScore[2].totalDuration,
    },
    {
      parameter: 'Статус',
      balanced: scenariosWithScore[0].status,
      conservative: scenariosWithScore[1].status,
      aggressive: scenariosWithScore[2].status,
    },
  ];

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
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-5 h-5 text-blue-500" />
              <h2 className="text-neutral-900">Сгенерированные сценарии</h2>
            </div>

            <p className="text-sm text-neutral-600 leading-relaxed mb-6">
              Во все сценарии входит один и тот же состав проектов, сформированный на этапе
              контекста. Альтернативы различаются последовательностью и параллельностью
              выполнения, распределением ресурсов, уровнем риска и степенью соблюдения
              ограничений.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {scenariosWithScore.map((scenario) => {
                const isSelected = selectedForPlanning[scenario.id];
                const isExpanded = expandedDetails[scenario.id];

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
                          className={`px-2 py-1 rounded text-xs whitespace-nowrap ${getScenarioStatusClass(
                            scenario.status,
                          )}`}
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
                        <p className="text-sm text-neutral-800">
                          {scenario.constraintsCompliance}%
                        </p>
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
                                      className={`w-2.5 h-2.5 rounded-full mt-2 ${getDotClasses(
                                        risk.level,
                                      )}`}
                                    />

                                    <div className="flex-1">
                                      <p className="text-sm text-neutral-700 mb-2">{risk.text}</p>

                                      <span
                                        className={`inline-flex px-2 py-1 rounded text-xs ${getImpactClasses(
                                          risk.level,
                                        )}`}
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
                        onClick={() => handleTogglePlanning(scenario.id)}
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

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="text-neutral-900 mb-4">Матрица сравнения альтернатив</h2>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                      Параметр
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                      Сбалансированный
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                      Консервативный
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">
                      Рискованный
                    </th>
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
                      <td className="py-3 px-4 text-sm text-neutral-700">{row.balanced}</td>
                      <td className="py-3 px-4 text-sm text-neutral-700">{row.conservative}</td>
                      <td className="py-3 px-4 text-sm text-neutral-700">{row.aggressive}</td>
                    </tr>
                  ))}

                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-4 text-sm font-medium text-neutral-700">
                      Выбор для планирования
                    </td>
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePlanning('balanced')}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedForPlanning.balanced
                            ? 'bg-emerald-600 text-white'
                            : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {selectedForPlanning.balanced ? 'Выбрано' : 'Выбрать'}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePlanning('conservative')}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedForPlanning.conservative
                            ? 'bg-emerald-600 text-white'
                            : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {selectedForPlanning.conservative ? 'Выбрано' : 'Выбрать'}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePlanning('aggressive')}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedForPlanning.aggressive
                            ? 'bg-emerald-600 text-white'
                            : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {selectedForPlanning.aggressive ? 'Выбрано' : 'Выбрать'}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <button className="w-full bg-neutral-900 text-white py-4 rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span>Перейти к плану</span>
          </button>
        </div>
      </div>
    </main>
  );
}