import { useEffect, useMemo, useRef, useState } from 'react';
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
  Loader2,
} from 'lucide-react';

import { goalsApi, type GoalResponseItem } from '../api/goals';
import { contextApi } from '../api/context';

type CtxOrientation = { id: string; title: string };
type CtxProject = { id: string; title: string; description: string };

const emptyForm = {
  specific: '',
  achievable: '',
  timeBound: '',
  priority: 'Средний',
  kpiName: '',
  kpiTarget: '',
  kpiUnit: '',
  orientationIds: [] as string[],
  projectIds: [] as string[],
  orientationExplanation: '',
};

const conflictPairs = [
  ['ускор', 'архитектур'],
  ['ускор', 'техническ'],
  ['снизить затраты', 'расширить функциональность'],
  ['сократить срок', 'снизить риск'],
];

type FrontendGoal = {
  id: string;
  specific: string;
  achievable: string;
  timeBound: string;
  priority: string;
  kpiName: string;
  kpiTarget: string;
  kpiUnit: string;
  orientationIds: string[];
  projectIds: string[];
  orientationExplanation: string;
  createdBy: 'user' | 'ai';
  aiExplanation?: string;
  projectCoverage?: { degree: string; explanation: string };
  realismCheck?: { degree: string; score: number; issues: string[] };
};

function fromApi(g: GoalResponseItem): FrontendGoal {
  return {
    id: g.id,
    specific: g.specific,
    achievable: g.achievable,
    timeBound: g.timebound,
    priority: g.priority,
    kpiName: g.kpi_name,
    kpiTarget: String(g.kpi_target_value),
    kpiUnit: g.kpi_unit,
    orientationIds: g.orientation_ids ?? [],
    projectIds: [],
    orientationExplanation: g.orientation_explanation ?? '',
    createdBy: g.context === 'AI_SUGGESTED' ? 'ai' : 'user',
    aiExplanation: g.ai_explanation,
    projectCoverage: g.project_coverage,
    realismCheck: g.realism_check,
  };
}

function toApiPayload(g: FrontendGoal, projectsList: CtxProject[]) {
  return {
    specific: g.specific,
    kpi_name: g.kpiName,
    kpi_target_value: parseFloat(g.kpiTarget) || 0,
    kpi_unit: g.kpiUnit,
    achievable: g.achievable,
    timebound: g.timeBound,
    priority: g.priority as 'Высокий' | 'Средний' | 'Низкий',
    orientation_ids: g.orientationIds,
    project_names: g.projectIds.map((id) => projectsList.find((p) => p.id === id)?.title ?? id),
    orientation_explanation: g.orientationExplanation || undefined,
  };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('ru-RU');
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCombinedGoalText(goal: FrontendGoal) {
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

function getTokens(text: string) {
  return text
    .split(' ')
    .map((item) => item.trim())
    .filter((item) => item.length > 2);
}

function getJaccardSimilarity(a: string, b: string) {
  const setA = new Set(getTokens(a));
  const setB = new Set(getTokens(b));

  if (!setA.size && !setB.size) return 0;

  const intersection = [...setA].filter((item) => setB.has(item)).length;
  const union = new Set([...setA, ...setB]).size;

  return union ? intersection / union : 0;
}

function isGoalComplete(goal: typeof emptyForm) {
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

function getAlignmentScore(goal: FrontendGoal, project: CtxProject) {
  const goalText = getCombinedGoalText(goal);
  const projectText = normalizeText(`${project.title} ${project.description}`);
  const semanticScore = getJaccardSimilarity(goalText, projectText);
  const priorityScore =
    goal.priority === 'Высокий' ? 1 : goal.priority === 'Средний' ? 0.8 : 0.6;
  return semanticScore * 0.7 + priorityScore * 0.3;
}

function getCoverageStatus(scoreCount: number) {
  if (scoreCount >= 3) return 'Высокое покрытие';
  if (scoreCount === 2) return 'Умеренное покрытие';
  if (scoreCount === 1) return 'Слабое покрытие';
  return 'Нет покрытия';
}

function getCoverageStatusClasses(status: string) {
  if (status === 'Высокое покрытие') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Умеренное покрытие') return 'bg-amber-100 text-amber-700';
  if (status === 'Слабое покрытие') return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

function getCoverageExplanation(status: string) {
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

function getProjectShortExplanation(score: number) {
  if (score >= 0.8) return 'Проект напрямую поддерживает достижение цели.';
  if (score >= 0.6) return 'Проект заметно способствует достижению цели.';
  return 'Проект частично связан с целью.';
}

function getProjectsForGoal(goal: FrontendGoal, allProjects: CtxProject[]) {
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
}: {
  title: string;
  description?: string;
  items: { id: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  getItemTitle: (item: { id: string }) => string;
  getItemDescription?: (item: { id: string }) => string;
  placeholder: string;
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

function IssueCard({
  type,
  description,
  variant = 'warning',
}: {
  type: string;
  description: string;
  variant?: 'warning' | 'danger';
}) {
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

function GoalCard({
  goal,
  onDelete,
  orientationsMap,
  cardRef,
  projectsList,
}: {
  goal: FrontendGoal;
  onDelete: (id: string) => void;
  orientationsMap: Record<string, string>;
  cardRef: (node: HTMLDivElement | null) => void;
  projectsList: CtxProject[];
}) {
  const { relatedProjects, coverageStatus, coverageExplanation } = getProjectsForGoal(
    goal,
    projectsList
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
          {goal.orientationIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {goal.orientationIds.map((id) => (
                <span
                  key={id}
                  className="px-2 py-1 rounded text-xs bg-violet-100 text-violet-700"
                >
                  {orientationsMap[id] || id}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="text-neutral-700">
          <span className="font-medium text-neutral-900">T:</span> {formatDate(goal.timeBound)}
        </p>
      </div>

      {goal.projectCoverage ? (
        <div className="mt-5 p-4 bg-white border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <FolderKanban className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-medium text-neutral-900">Покрытие проектами (ИИ)</h4>
          </div>
          <span
            className={`px-2 py-1 rounded text-xs ${getCoverageStatusClasses(goal.projectCoverage.degree)}`}
          >
            {goal.projectCoverage.degree}
          </span>
          <p className="text-sm text-neutral-700 mt-2">{goal.projectCoverage.explanation}</p>
          {goal.projectNames && goal.projectNames.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {(goal as FrontendGoal & { projectNames?: string[] }).projectNames?.map((name) => (
                <span key={name} className="px-2 py-1 rounded text-xs bg-neutral-100 text-neutral-700 border border-neutral-200">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : goal.projectIds.length > 0 ? (
        <div className="mt-5 p-4 bg-white border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <FolderKanban className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-medium text-neutral-900">Покрытие проектами</h4>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-2 py-1 rounded text-xs ${getCoverageStatusClasses(coverageStatus)}`}>
              {coverageStatus}
            </span>
          </div>

          <p className="text-sm text-neutral-700 mb-3">{coverageExplanation}</p>

          {relatedProjects.length ? (
            <div className="space-y-2">
              {relatedProjects.map((project) => (
                <div key={project.id} className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <p className="text-sm font-medium text-neutral-900">{project.title}</p>
                  <p className="text-sm text-neutral-600 mt-1">{project.explanation}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {goal.realismCheck ? (
        <div className="mt-3 p-4 bg-white border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h4 className="text-sm font-medium text-neutral-900">Проверка реалистичности (ИИ)</h4>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-1 rounded text-xs ${
              goal.realismCheck.degree === 'Высокая' ? 'bg-emerald-100 text-emerald-700' :
              goal.realismCheck.degree === 'Средняя' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {goal.realismCheck.degree} реалистичность
            </span>
            <span className="text-sm text-neutral-700">Оценка: {goal.realismCheck.score}%</span>
          </div>
          {goal.realismCheck.issues.length > 0 && (
            <div className="space-y-1">
              {goal.realismCheck.issues.map((issue, i) => (
                <p key={i} className="text-sm text-neutral-700">• {issue}</p>
              ))}
            </div>
          )}
          {goal.aiExplanation && (
            <p className="text-sm text-neutral-500 mt-2 italic">{goal.aiExplanation}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SuggestedGoalCard({
  goal,
  onAdd,
  orientationsMap,
  isAdded,
}: {
  goal: FrontendGoal;
  onAdd: (goal: FrontendGoal) => void;
  orientationsMap: Record<string, string>;
  isAdded: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border transition-colors ${isAdded ? 'bg-emerald-50 border-emerald-200' : 'bg-neutral-50 border-neutral-200'}`}>
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
            {goal.realismCheck && (
              <span className={`px-2 py-1 rounded text-xs ${
                goal.realismCheck.degree === 'Высокая' ? 'bg-emerald-100 text-emerald-700' :
                goal.realismCheck.degree === 'Средняя' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                Реалистичность: {goal.realismCheck.score}%
              </span>
            )}
          </div>
        </div>

        {isAdded ? (
          <span className="px-3 py-2 rounded-lg text-sm bg-emerald-100 text-emerald-700 flex items-center gap-2 whitespace-nowrap">
            <CheckCircle2 className="w-4 h-4" />
            Добавлено
          </span>
        ) : (
          <button
            onClick={() => onAdd(goal)}
            className="px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm whitespace-nowrap"
          >
            Добавить в список
          </button>
        )}
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
          {goal.orientationIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {goal.orientationIds.map((id) => (
                <span key={id} className="px-2 py-1 rounded text-xs bg-violet-100 text-violet-700">
                  {orientationsMap[id] || id}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="text-neutral-700">
          <span className="font-medium text-neutral-900">T:</span> {formatDate(goal.timeBound)}
        </p>
      </div>

      {goal.projectCoverage && (
        <div className="mt-4 p-3 bg-white border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FolderKanban className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-neutral-900">Покрытие проектами</span>
            <span className={`px-2 py-1 rounded text-xs ${getCoverageStatusClasses(goal.projectCoverage.degree)}`}>
              {goal.projectCoverage.degree}
            </span>
          </div>
          <p className="text-sm text-neutral-700">{goal.projectCoverage.explanation}</p>
        </div>
      )}

      {goal.aiExplanation && (
        <p className="text-sm text-neutral-500 mt-3 italic">{goal.aiExplanation}</p>
      )}
    </div>
  );
}

export function GoalsScreen({ contextId }: { contextId: string | null }) {
  const [goals, setGoals] = useState<FrontendGoal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [suggestedGoals, setSuggestedGoals] = useState<FrontendGoal[]>([]);
  const [isSuggestedGenerated, setIsSuggestedGenerated] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [ctxOrientations, setCtxOrientations] = useState<CtxOrientation[]>([]);
  const [ctxProjects, setCtxProjects] = useState<CtxProject[]>([]);
  const [addedSuggestionIds, setAddedSuggestionIds] = useState<Set<string>>(new Set());

  const formRef = useRef<HTMLElement | null>(null);
  const goalRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Load real orientations and projects from context
  useEffect(() => {
    if (!contextId) {
      setCtxOrientations([]);
      setCtxProjects([]);
      return;
    }
    contextApi.get(contextId).then((saved) => {
      setCtxOrientations(
        saved.orientations.map((o, i) => ({ id: `orientation-${i}`, title: o.vision }))
      );
      setCtxProjects(
        saved.projects.map((p, i) => ({
          id: `project-${i}`,
          title: p.name,
          description: p.description ?? '',
        }))
      );
    }).catch(() => {});
  }, [contextId]);

  // Load saved goals on mount / contextId change
  useEffect(() => {
    if (!contextId) {
      setGoals([]);
      return;
    }
    setGoalsLoading(true);
    goalsApi
      .list(contextId)
      .then(({ goals: data }) => setGoals(data.map(fromApi)))
      .catch(() => {})
      .finally(() => setGoalsLoading(false));
  }, [contextId]);

  // Reset transient state on contextId change
  useEffect(() => {
    setSubmitSuccess(false);
    setSubmitError(null);
    setSuggestedGoals([]);
    setIsSuggestedGenerated(false);
    setSuggestionsError(null);
    setAddedSuggestionIds(new Set());
  }, [contextId]);

  const orientationsMap = useMemo(() => {
    return ctxOrientations.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.title;
      return acc;
    }, {});
  }, [ctxOrientations]);

  const conflictsAndDuplicates = useMemo(() => {
    const duplicates: { id: string; type: string; description: string; variant: 'warning' | 'danger' }[] = [];
    const conflicts: { id: string; type: string; description: string; variant: 'warning' | 'danger' }[] = [];

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

  function scrollToGoal(goalId: string) {
    requestAnimationFrame(() => {
      goalRefs.current[goalId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }

  function updateFormField(field: string, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSelection(field: 'orientationIds' | 'projectIds', id: string) {
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

  async function handleGenerateSuggestedGoals() {
    if (!contextId) return;
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    setSuggestedGoals([]);
    setAddedSuggestionIds(new Set());
    setIsSuggestedGenerated(false);
    try {
      const { ai_suggestions } = await goalsApi.suggestions(contextId);
      setSuggestedGoals(ai_suggestions.map(fromApi));
      setIsSuggestedGenerated(true);
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setSuggestionsError(err.detail ?? 'Ошибка при получении предложений');
    } finally {
      setSuggestionsLoading(false);
    }
  }

  function handleSaveGoal() {
    if (!isGoalComplete(form)) return;

    const savedGoalId = `goal-${Date.now()}`;

    const payload: FrontendGoal = {
      ...form,
      id: savedGoalId,
      createdBy: 'user',
    };

    setGoals((prev) => [payload, ...prev]);
    resetForm();
    scrollToGoal(savedGoalId);
  }

  function handleDeleteGoal(goalId: string) {
    setGoals((prev) => prev.filter((item) => item.id !== goalId));
  }

  function handleAddSuggestedGoal(goal: FrontendGoal) {
    if (addedSuggestionIds.has(goal.id)) return;

    const newGoalId = `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setGoals((prev) => [{ ...goal, id: newGoalId, createdBy: 'ai' }, ...prev]);
    setAddedSuggestionIds((prev) => new Set(prev).add(goal.id));
    scrollToGoal(newGoalId);
  }

  async function handleSaveGoals() {
    if (!contextId || goals.length === 0) return;
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await goalsApi.submit(contextId, goals.map((g) => toApiPayload(g, ctxProjects)));
      setSubmitSuccess(true);
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setSubmitError(err.detail ?? 'Ошибка при сохранении целей');
    } finally {
      setSubmitLoading(false);
    }
  }

  const isFormComplete = isGoalComplete(form);

  if (!contextId) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Выберите мультипроект для работы с целями.</p>
      </main>
    );
  }

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
                  type="date"
                  value={form.timeBound}
                  onChange={(e) => updateFormField('timeBound', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                items={ctxOrientations}
                selectedIds={form.orientationIds}
                onToggle={(id) => toggleSelection('orientationIds', id)}
                getItemTitle={(item) => (item as CtxOrientation).title}
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
                items={ctxProjects}
                selectedIds={form.projectIds}
                onToggle={(id) => toggleSelection('projectIds', id)}
                getItemTitle={(item) => (item as CtxProject).title}
                getItemDescription={(item) => (item as CtxProject).description}
                placeholder="Поиск по проектам"
              />
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

            {goalsLoading ? (
              <div className="flex items-center gap-2 text-neutral-500 text-sm p-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Загрузка целей...
              </div>
            ) : (
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
                      projectsList={ctxProjects}
                    />
                  ))
                ) : (
                  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-sm text-neutral-700">Пока не добавлено ни одной цели.</p>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h2 className="text-neutral-900">Цели, предложенные ИИ</h2>
              </div>

              <button
                onClick={handleGenerateSuggestedGoals}
                disabled={suggestionsLoading}
                className="px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {suggestionsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {suggestionsLoading ? 'Генерация...' : 'Предложить цели'}
              </button>
            </div>

            {suggestionsError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {suggestionsError}
              </div>
            )}

            {isSuggestedGenerated ? (
              <div className="space-y-3">
                {suggestedGoals.map((goal) => (
                  <SuggestedGoalCard
                    key={goal.id}
                    goal={goal}
                    onAdd={handleAddSuggestedGoal}
                    orientationsMap={orientationsMap}
                    isAdded={addedSuggestionIds.has(goal.id)}
                  />
                ))}
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

          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Цели успешно сохранены. Этап «Цели» отмечен как выполненный.
            </div>
          )}

          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {submitError}
            </div>
          )}

          <button
            onClick={handleSaveGoals}
            disabled={submitLoading || goals.length === 0}
            className="w-full bg-neutral-900 text-white py-4 rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            <span>{submitLoading ? 'Сохранение...' : 'Сохранить цели'}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
