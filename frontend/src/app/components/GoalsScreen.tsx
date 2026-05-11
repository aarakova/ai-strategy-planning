import { useMemo, useRef, useState } from 'react';
import {
  Target,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Lightbulb,
  ShieldCheck,
  FolderKanban,
  Search,
} from 'lucide-react';

const strategicOrientations = [
  { id: 'orientation-1', title: 'Сокращение времени вывода продуктов на рынок' },
  { id: 'orientation-2', title: 'Повышение устойчивости архитектуры' },
  { id: 'orientation-3', title: 'Снижение операционных рисков' },
  { id: 'orientation-4', title: 'Рост прозрачности и управляемости портфеля' },
];

const projects = [
  {
    id: 'project-1',
    title: 'Модернизация CI/CD',
    description: 'Автоматизация сборки, тестирования и поставки релизов.',
    relatedOrientationIds: ['orientation-1', 'orientation-4'],
  },
  {
    id: 'project-2',
    title: 'Рефакторинг ядра платформы',
    description: 'Снижение технического долга и стабилизация архитектуры.',
    relatedOrientationIds: ['orientation-2', 'orientation-3'],
  },
  {
    id: 'project-3',
    title: 'Оптимизация процессов согласования',
    description: 'Сокращение ручных этапов согласования изменений и релизов.',
    relatedOrientationIds: ['orientation-1', 'orientation-4'],
  },
  {
    id: 'project-4',
    title: 'Развитие системы мониторинга',
    description:
      'Повышение прозрачности состояния проектов и раннее выявление отклонений.',
    relatedOrientationIds: ['orientation-3', 'orientation-4'],
  },
];

const initialSuggestedGoals = [
  {
    id: 'ai-goal-1',
    specific: 'Сократить средний цикл поставки изменений по мультипроекту',
    achievable:
      'Цель достижима за счёт автоматизации CI/CD и сокращения ручных этапов согласования',
    timeBound: 'До конца IV квартала 2026 года',
    priority: 'Высокий',
    kpiName: 'Средний цикл поставки изменений',
    kpiTarget: '14',
    kpiUnit: 'дней',
    orientationIds: ['orientation-1', 'orientation-4'],
    projectIds: ['project-1', 'project-3'],
    orientationExplanation:
      'Цель поддерживает ускорение вывода результатов на рынок и повышение управляемости портфеля.',
  },
  {
    id: 'ai-goal-2',
    specific: 'Снизить объём критического технического долга по ключевым компонентам',
    achievable:
      'Достижимо при реализации проекта рефакторинга ядра и перераспределении приоритетов команд',
    timeBound: 'До 1 декабря 2026 года',
    priority: 'Высокий',
    kpiName: 'Количество критических архитектурных замечаний',
    kpiTarget: '25',
    kpiUnit: '%',
    orientationIds: ['orientation-2', 'orientation-3'],
    projectIds: ['project-2'],
    orientationExplanation:
      'Цель направлена на повышение устойчивости архитектуры и снижение операционных рисков.',
  },
];

const emptyForm = {
  specific: '',
  achievable: '',
  timeBound: '',
  priority: 'Средний',
  kpiName: '',
  kpiTarget: '',
  kpiUnit: '',
  orientationIds: [],
  projectIds: [],
  orientationExplanation: '',
};

const fixedRealismIssues = [
  'Формулировка цели слишком короткая или общая',
  'Измеримость цели задана неполно',
  'Для KPI не указано конкретное целевое значение',
  'Не обоснована достижимость цели',
  'Не указан конкретный срок достижения',
  'Не выбраны стратегические ориентиры',
  'Не выбраны проекты, обеспечивающие достижение цели',
  'Не пояснено влияние цели на стратегические ориентиры',
  'Формулировка цели может быть слишком абстрактной',
];

const conflictPairs = [
  ['ускор', 'архитектур'],
  ['ускор', 'техническ'],
  ['снизить затраты', 'расширить функциональность'],
  ['сократить срок', 'снизить риск'],
];

function normalizeText(value) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCombinedGoalText(goal) {
  return normalizeText(
    [
      goal.specific,
      goal.achievable,
      goal.timeBound,
      goal.kpiName,
      goal.kpiTarget,
      goal.kpiUnit,
      goal.orientationExplanation,
    ].join(' ')
  );
}

function getTokens(text) {
  return text
    .split(' ')
    .map((item) => item.trim())
    .filter((item) => item.length > 2);
}

function getJaccardSimilarity(a, b) {
  const setA = new Set(getTokens(a));
  const setB = new Set(getTokens(b));

  if (!setA.size && !setB.size) return 0;

  const intersection = [...setA].filter((item) => setB.has(item)).length;
  const union = new Set([...setA, ...setB]).size;

  return union ? intersection / union : 0;
}

function isGoalComplete(goal) {
  return Boolean(
    goal.specific &&
      goal.achievable &&
      goal.timeBound &&
      goal.priority &&
      goal.kpiName &&
      goal.kpiTarget &&
      goal.kpiUnit &&
      goal.orientationIds.length &&
      goal.orientationExplanation
  );
}

function getAlignmentScore(goal, project) {
  const goalText = getCombinedGoalText(goal);
  const projectText = normalizeText(`${project.title} ${project.description}`);
  const semanticScore = getJaccardSimilarity(goalText, projectText);

  const sharedOrientations = goal.orientationIds.filter((id) =>
    project.relatedOrientationIds.includes(id)
  ).length;
  const orientationScore = goal.orientationIds.length
    ? sharedOrientations / goal.orientationIds.length
    : 0;

  const priorityScore =
    goal.priority === 'Высокий' ? 1 : goal.priority === 'Средний' ? 0.8 : 0.6;

  return semanticScore * 0.55 + orientationScore * 0.3 + priorityScore * 0.15;
}

function getCoverageStatus(scoreCount) {
  if (scoreCount >= 3) return 'Высокое покрытие';
  if (scoreCount === 2) return 'Умеренное покрытие';
  if (scoreCount === 1) return 'Слабое покрытие';
  return 'Нет покрытия';
}

function getCoverageStatusClasses(status) {
  if (status === 'Высокое покрытие') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Умеренное покрытие') return 'bg-amber-100 text-amber-700';
  if (status === 'Слабое покрытие') return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

function getCoverageExplanation(status) {
  if (status === 'Высокое покрытие') {
    return 'Цель хорошо обеспечена проектами и поддерживается несколькими инициативами.';
  }
  if (status === 'Умеренное покрытие') {
    return 'Цель поддерживается несколькими проектами, но покрытие нельзя считать полным.';
  }
  if (status === 'Слабое покрытие') {
    return 'Цель поддерживается ограниченным числом проектов.';
  }
  return 'Для цели не выбраны проекты, обеспечивающие её достижение.';
}

function getProjectShortExplanation(score) {
  if (score >= 0.8) return 'Проект напрямую поддерживает достижение цели.';
  if (score >= 0.6) return 'Проект заметно способствует достижению цели.';
  return 'Проект частично связан с целью.';
}

function getProjectsForGoal(goal, allProjects) {
  const selectedProjectIds = goal.projectIds || [];

  const related = allProjects
    .filter((project) => selectedProjectIds.includes(project.id))
    .map((project) => {
      const score = getAlignmentScore(goal, project);

      return {
        ...project,
        score,
        explanation: getProjectShortExplanation(score),
      };
    })
    .sort((a, b) => b.score - a.score);

  const status = getCoverageStatus(related.length);

  return {
    relatedProjects: related,
    coverageStatus: status,
    coverageExplanation: getCoverageExplanation(status),
  };
}

function SearchableCheckList({
  title,
  description,
  items,
  selectedIds,
  onToggle,
  getItemTitle,
  getItemDescription,
  placeholder,
}) {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) return items;

    return items.filter((item) => {
      const text = normalizeText(`${getItemTitle(item)} ${getItemDescription?.(item) || ''}`);
      return text.includes(normalizedQuery);
    });
  }, [query, items, getItemTitle, getItemDescription]);

  return (
    <div className="border border-neutral-200 rounded-lg bg-neutral-50">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-sm font-medium text-neutral-900">{title}</h3>
            {description ? (
              <p className="text-xs text-neutral-500 mt-1">{description}</p>
            ) : null}
          </div>
          <span className="px-2 py-1 rounded text-xs bg-white border border-neutral-200 text-neutral-600 whitespace-nowrap">
            Выбрано: {selectedIds.length}
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={placeholder}
          />
        </div>
      </div>

      <div className="max-h-56 overflow-auto p-3 space-y-2">
        {filteredItems.length ? (
          filteredItems.map((item) => {
            const checked = selectedIds.includes(item.id);

            return (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  checked
                    ? 'border-violet-300 bg-violet-50'
                    : 'border-neutral-200 bg-white hover:bg-neutral-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.id)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm text-neutral-800">{getItemTitle(item)}</span>
                  {getItemDescription ? (
                    <span className="block text-xs text-neutral-500 mt-1 leading-relaxed">
                      {getItemDescription(item)}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })
        ) : (
          <p className="text-sm text-neutral-500 p-2">Ничего не найдено.</p>
        )}
      </div>
    </div>
  );
}

function IssueCard({ type, description, variant = 'warning' }) {
  const badgeClass =
    variant === 'danger'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700';

  return (
    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <div className="mb-3">
        <span className={`px-2 py-1 rounded text-xs ${badgeClass}`}>{type}</span>
      </div>
      <p className="text-sm text-neutral-700 leading-relaxed">{description}</p>
    </div>
  );
}

function GoalCard({ goal, onDelete, orientationsMap, cardRef }) {
  const { relatedProjects, coverageStatus, coverageExplanation } = getProjectsForGoal(
    goal,
    projects
  );

  return (
    <div ref={cardRef} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-neutral-900 mb-2">{goal.specific}</h3>

          <div className="flex flex-wrap gap-2 mb-3">
            {goal.createdBy === 'ai' ? (
              <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-700">
                ИИ-предложение
              </span>
            ) : null}

            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
              Приоритет: {goal.priority}
            </span>

            <span
              className={`px-2 py-1 rounded text-xs ${
                isGoalComplete(goal)
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isGoalComplete(goal) ? 'Полная формулировка' : 'Есть незаполненные поля'}
            </span>
          </div>
        </div>

        <button
          onClick={() => onDelete(goal.id)}
          className="px-3 py-2 border border-red-200 rounded-lg text-sm text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
          Удалить
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <p className="text-neutral-700">
          <span className="font-medium text-neutral-900">S:</span> {goal.specific}
        </p>
        <p className="text-neutral-700">
          <span className="font-medium text-neutral-900">M:</span> {goal.kpiName} —{' '}
          {goal.kpiTarget} {goal.kpiUnit}
        </p>
        <p className="text-neutral-700">
          <span className="font-medium text-neutral-900">A:</span> {goal.achievable}
        </p>

        <div className="text-neutral-700">
          <span className="font-medium text-neutral-900">R:</span>{' '}
          {goal.orientationExplanation}
          <div className="flex flex-wrap gap-2 mt-2">
            {goal.orientationIds.map((id) => (
              <span
                key={id}
                className="px-2 py-1 rounded text-xs bg-violet-100 text-violet-700"
              >
                {orientationsMap[id] || 'Ориентир'}
              </span>
            ))}
          </div>
        </div>

        <p className="text-neutral-700">
          <span className="font-medium text-neutral-900">T:</span> {goal.timeBound}
        </p>
      </div>

      <div className="mt-5 p-4 bg-white border border-neutral-200 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <FolderKanban className="w-4 h-4 text-blue-500" />
          <h4 className="text-sm font-medium text-neutral-900">Покрытие проектами</h4>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className={`px-2 py-1 rounded text-xs ${getCoverageStatusClasses(coverageStatus)}`}
          >
            {coverageStatus}
          </span>
        </div>

        <p className="text-sm text-neutral-700 mb-3">{coverageExplanation}</p>

        {relatedProjects.length ? (
          <div className="space-y-2">
            {relatedProjects.map((project) => (
              <div
                key={project.id}
                className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg"
              >
                <p className="text-sm font-medium text-neutral-900">{project.title}</p>
                <p className="text-sm text-neutral-600 mt-1">{project.explanation}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Нет проектов, соответствующих цели.</p>
        )}
      </div>
    </div>
  );
}

function SuggestedGoalCard({ goal, onAdd, orientationsMap }) {
  return (
    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-neutral-900 mb-2">{goal.specific}</h3>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-700">
              ИИ-предложение
            </span>
            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
              Приоритет: {goal.priority}
            </span>
          </div>
        </div>

        <button
          onClick={() => onAdd(goal)}
          className="px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm"
        >
          Добавить в основной список
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <p className="text-neutral-700">
          <span className="font-medium text-neutral-900">S:</span> {goal.specific}
        </p>
        <p className="text-neutral-700">
          <span className="font-medium text-neutral-900">M:</span> {goal.kpiName} —{' '}
          {goal.kpiTarget} {goal.kpiUnit}
        </p>
        <p className="text-neutral-700">
          <span className="font-medium text-neutral-900">A:</span> {goal.achievable}
        </p>

        <div className="text-neutral-700">
          <span className="font-medium text-neutral-900">R:</span>{' '}
          {goal.orientationExplanation}
          <div className="flex flex-wrap gap-2 mt-2">
            {goal.orientationIds.map((id) => (
              <span
                key={id}
                className="px-2 py-1 rounded text-xs bg-violet-100 text-violet-700"
              >
                {orientationsMap[id]}
              </span>
            ))}
          </div>
        </div>

        <p className="text-neutral-700">
          <span className="font-medium text-neutral-900">T:</span> {goal.timeBound}
        </p>
      </div>
    </div>
  );
}

export function GoalsScreen() {
  const [goals, setGoals] = useState([
    {
      id: 'goal-1',
      specific: 'Сократить среднюю длительность цикла релиза по мультипроекту',
      achievable:
        'Достигается за счёт внедрения CI/CD и оптимизации процессов согласования',
      timeBound: 'До 31 декабря 2026 года',
      priority: 'Высокий',
      kpiName: 'Средняя длительность цикла релиза',
      kpiTarget: '14',
      kpiUnit: 'дней',
      orientationIds: ['orientation-1', 'orientation-4'],
      projectIds: ['project-1', 'project-3'],
      orientationExplanation:
        'Цель поддерживает ускорение вывода результатов на рынок и повышает управляемость портфеля.',
      createdBy: 'user',
    },
    {
      id: 'goal-2',
      specific: 'Снизить объём критического технического долга в ядре платформы',
      achievable:
        'Реализуемо за счёт отдельного проекта рефакторинга и фокусировки команды на ключевых узлах',
      timeBound: 'До 1 декабря 2026 года',
      priority: 'Высокий',
      kpiName: 'Количество критических архитектурных замечаний',
      kpiTarget: '25',
      kpiUnit: '%',
      orientationIds: ['orientation-2', 'orientation-3'],
      projectIds: ['project-2'],
      orientationExplanation:
        'Цель направлена на повышение устойчивости архитектуры и снижение операционных рисков.',
      createdBy: 'user',
    },
    {
      id: 'goal-3',
      specific: 'Сократить цикл вывода изменений в релиз',
      achievable:
        'Достижимо за счёт автоматизации поставки, оптимизации согласований и сокращения ручных операций',
      timeBound: 'До 31 декабря 2026 года',
      priority: 'Средний',
      kpiName: 'Средняя длительность цикла релиза',
      kpiTarget: '15',
      kpiUnit: 'дней',
      orientationIds: ['orientation-1', 'orientation-4'],
      projectIds: ['project-1', 'project-3'],
      orientationExplanation:
        'Цель также направлена на ускорение вывода результатов на рынок и повышение управляемости портфеля.',
      createdBy: 'user',
    },
  ]);

  const [form, setForm] = useState(emptyForm);
  const [suggestedGoals, setSuggestedGoals] = useState([]);
  const [isSuggestedGenerated, setIsSuggestedGenerated] = useState(false);

  const formRef = useRef(null);
  const goalRefs = useRef({});

  const orientationsMap = useMemo(() => {
    return strategicOrientations.reduce((acc, item) => {
      acc[item.id] = item.title;
      return acc;
    }, {});
  }, []);

  const conflictsAndDuplicates = useMemo(() => {
    const duplicates = [
      {
        id: 'duplicate-example-1',
        type: 'Дублирование целей',
        description:
          'Цели "Сократить среднюю длительность цикла релиза по мультипроекту" и "Сократить цикл вывода изменений в релиз" частично совпадают по смыслу: обе направлены на ускорение релизного цикла и используют близкий KPI.',
        variant: 'warning',
      },
    ];

    const conflicts = [];

    for (let i = 0; i < goals.length; i += 1) {
      for (let j = i + 1; j < goals.length; j += 1) {
        const first = goals[i];
        const second = goals[j];
        const firstText = getCombinedGoalText(first);
        const secondText = getCombinedGoalText(second);

        const similarity = getJaccardSimilarity(firstText, secondText);

        if (similarity >= 0.55) {
          duplicates.push({
            id: `${first.id}-${second.id}-duplicate`,
            type: 'Дублирование целей',
            description: `Цели "${first.specific}" и "${second.specific}" частично пересекаются по смыслу и могут описывать один и тот же ожидаемый результат.`,
            variant: 'warning',
          });
        }

        const normalizedPair = `${firstText} ${secondText}`;
        const hasConflict = conflictPairs.some(([a, b]) => {
          return normalizedPair.includes(a) && normalizedPair.includes(b);
        });

        if (hasConflict) {
          conflicts.push({
            id: `${first.id}-${second.id}-conflict`,
            type: 'Конфликт приоритетов',
            description: `Цели "${first.specific}" и "${second.specific}" могут конкурировать за ресурсы или задавать противоречивые управленческие приоритеты.`,
            variant: 'danger',
          });
        }
      }
    }

    return { duplicates, conflicts };
  }, [goals]);

  function scrollToGoal(goalId) {
    requestAnimationFrame(() => {
      goalRefs.current[goalId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }

  function updateFormField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSelection(field, id) {
    setForm((prev) => {
      const exists = prev[field].includes(id);

      return {
        ...prev,
        [field]: exists ? prev[field].filter((item) => item !== id) : [...prev[field], id],
      };
    });
  }

  function resetForm() {
    setForm(emptyForm);
  }

  function handleGenerateSuggestedGoals() {
    setSuggestedGoals(initialSuggestedGoals);
    setIsSuggestedGenerated(true);
  }

  function handleSaveGoal() {
    if (!isGoalComplete(form)) return;

    const savedGoalId = `goal-${Date.now()}`;

    const payload = {
      ...form,
      id: savedGoalId,
      createdBy: 'user',
    };

    setGoals((prev) => [payload, ...prev]);
    resetForm();
    scrollToGoal(savedGoalId);
  }

  function handleDeleteGoal(goalId) {
    setGoals((prev) => prev.filter((item) => item.id !== goalId));
  }

  function handleAddSuggestedGoal(goal) {
    const newGoalId = `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setGoals((prev) => [
      {
        ...goal,
        id: newGoalId,
        createdBy: 'ai',
      },
      ...prev,
    ]);

    setSuggestedGoals((prev) => prev.filter((item) => item.id !== goal.id));

    scrollToGoal(newGoalId);
  }

  const isFormComplete = isGoalComplete(form);

  return (
    <main className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-neutral-900 mb-2">Цели</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Формирование стратегических целей по SMART, их проверка и сопоставление с проектами
        </p>

        <div className="space-y-6">
          <section ref={formRef} className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-blue-500" />
              <h2 className="text-neutral-900">Добавление стратегической цели</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  S (Specific) — что необходимо достичь
                </label>
                <textarea
                  value={form.specific}
                  onChange={(e) => updateFormField('specific', e.target.value)}
                  className="w-full h-28 px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Что именно необходимо достичь?"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  M (Measurable) — как будет измеряться достижение цели
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    value={form.kpiName}
                    onChange={(e) => updateFormField('kpiName', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Название KPI"
                  />
                  <input
                    value={form.kpiTarget}
                    onChange={(e) => updateFormField('kpiTarget', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Целевое значение"
                  />
                  <input
                    value={form.kpiUnit}
                    onChange={(e) => updateFormField('kpiUnit', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Единица измерения"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  A (Achievable) — почему цель достижима
                </label>
                <textarea
                  value={form.achievable}
                  onChange={(e) => updateFormField('achievable', e.target.value)}
                  className="w-full h-28 px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Почему цель достижима?"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  T (Time-bound) — срок достижения
                </label>
                <input
                  value={form.timeBound}
                  onChange={(e) => updateFormField('timeBound', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Например: До 31.12.2026"
                />

                <label className="block text-sm text-neutral-700 mt-4 mb-2">Приоритет</label>
                <select
                  value={form.priority}
                  onChange={(e) => updateFormField('priority', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option>Высокий</option>
                  <option>Средний</option>
                  <option>Низкий</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm text-neutral-700 mb-2">
                R (Relevant) — соответствие стратегическим ориентирам
              </label>

              <SearchableCheckList
                title="Стратегические ориентиры"
                description="Выберите один или несколько ориентиров, которые поддерживает цель"
                items={strategicOrientations}
                selectedIds={form.orientationIds}
                onToggle={(id) => toggleSelection('orientationIds', id)}
                getItemTitle={(item) => item.title}
                placeholder="Поиск по стратегическим ориентирам"
              />

              <textarea
                value={form.orientationExplanation}
                onChange={(e) => updateFormField('orientationExplanation', e.target.value)}
                className="w-full h-24 mt-3 px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Поясните, как цель влияет на выбранные стратегические ориентиры"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm text-neutral-700 mb-2">
                Проекты, обеспечивающие достижение цели
              </label>

              <SearchableCheckList
                title="Связанные проекты"
                description="Выберите проекты, которые вносят вклад в достижение цели"
                items={projects}
                selectedIds={form.projectIds}
                onToggle={(id) => toggleSelection('projectIds', id)}
                getItemTitle={(item) => item.title}
                getItemDescription={(item) => item.description}
                placeholder="Поиск по проектам"
              />
            </div>

            <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-medium text-neutral-900">
                    Проверка реалистичности цели
                  </h3>
                </div>

                <span className="px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-700">
                  В разработке
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                  Низкая реалистичность
                </span>
                <span className="text-sm text-neutral-700">Оценка: 0%</span>
              </div>

              <div className="space-y-2">
                {fixedRealismIssues.map((issue, index) => (
                  <p key={index} className="text-sm text-neutral-700">
                    • {issue}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleSaveGoal}
                disabled={!isFormComplete}
                className={`px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                  isFormComplete
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                    : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Добавить цель
              </button>

              <button
                onClick={resetForm}
                className="px-4 py-3 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                Очистить форму
              </button>
            </div>

            {!isFormComplete ? (
              <p className="text-sm text-red-600 mt-3">
                Цель нельзя добавить, пока не заполнены все поля SMART, KPI 
                и стратегические ориентиры.
              </p>
            ) : null}
          </section>

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="text-neutral-900 mb-4">Список целей</h2>

            <div className="space-y-3">
              {goals.length ? (
                goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    cardRef={(node) => {
                      goalRefs.current[goal.id] = node;
                    }}
                    goal={goal}
                    onDelete={handleDeleteGoal}
                    orientationsMap={orientationsMap}
                  />
                ))
              ) : (
                <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-sm text-neutral-700">Пока не добавлено ни одной цели.</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h2 className="text-neutral-900">Цели, предложенные ИИ</h2>
              </div>

              <button
                onClick={handleGenerateSuggestedGoals}
                className="px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Предложить цели
              </button>
            </div>

            {isSuggestedGenerated ? (
              <div className="space-y-3">
                {suggestedGoals.length ? (
                  suggestedGoals.map((goal) => (
                    <SuggestedGoalCard
                      key={goal.id}
                      goal={goal}
                      onAdd={handleAddSuggestedGoal}
                      orientationsMap={orientationsMap}
                    />
                  ))
                ) : (
                  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-sm text-neutral-700">
                      Все предложенные ИИ цели уже рассмотрены или добавлены.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-sm text-neutral-700">
                  Нажмите «Предложить цели», чтобы сформировать список целей на основе
                  стратегических ориентиров и проектов.
                </p>
              </div>
            )}
          </section>

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-neutral-900">Конфликты и дублирование целей</h2>
              </div>

              <span className="px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-700">
                В разработке
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">
                  Дублирование целей
                </h3>

                <div className="space-y-3">
                  {conflictsAndDuplicates.duplicates.length ? (
                    conflictsAndDuplicates.duplicates.map((item) => (
                      <IssueCard
                        key={item.id}
                        type={item.type}
                        description={item.description}
                        variant={item.variant}
                      />
                    ))
                  ) : (
                    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <p className="text-sm text-neutral-700">
                        Явных дубликатов среди целей не обнаружено.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">
                  Конфликты целей
                </h3>

                <div className="space-y-3">
                  {conflictsAndDuplicates.conflicts.length ? (
                    conflictsAndDuplicates.conflicts.map((item) => (
                      <IssueCard
                        key={item.id}
                        type={item.type}
                        description={item.description}
                        variant={item.variant}
                      />
                    ))
                  ) : (
                    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <p className="text-sm text-neutral-700">
                        Потенциальных конфликтов между целями не выявлено.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <button className="w-full bg-neutral-900 text-white py-4 rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span>Перейти к альтернативам</span>
          </button>
        </div>
      </div>
    </main>
  );
}