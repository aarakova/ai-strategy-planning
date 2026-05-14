import { useEffect, useMemo, useState } from 'react';
import {
  Play,
  AlertTriangle,
  Info,
  Clock3,
  Users,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { analysisApi } from '../api/analysis';
import type { AnalysisResult } from '../api/analysis';
import { contextApi } from '../api/context';
import type { SavedContext } from '../api/context';

// ─── Dependency graph ─────────────────────────────────────────────────────────

const NODE_R = 38;
const COL_GAP = 180;
const ROW_GAP = 110;
const MARGIN_X = 60;
const MARGIN_Y = 70;

type GraphNode = {
  idx: number;
  name: string;
  status: string;
  x: number;
  y: number;
};

type GraphEdge = { from: number; to: number };

function buildGraph(
  projects: SavedContext['projects'],
  dependencies: SavedContext['dependencies'],
): { nodes: GraphNode[]; edges: GraphEdge[]; width: number; height: number } {
  const n = projects.length;
  if (n === 0) return { nodes: [], edges: [], width: 300, height: 200 };

  const nameToIdx = new Map(projects.map((p, i) => [p.name, i]));

  const prereqs: number[][] = Array.from({ length: n }, () => []);
  const edges: GraphEdge[] = [];

  for (const dep of dependencies) {
    const from = nameToIdx.get(dep.main_project_name);
    const to = nameToIdx.get(dep.dependent_project_name);
    if (from !== undefined && to !== undefined) {
      prereqs[to].push(from);
      edges.push({ from, to });
    }
  }

  // Assign levels via longest-path from sources
  const levels = new Array(n).fill(0);
  const computed = new Array(n).fill(false);

  function getLevel(i: number): number {
    if (computed[i]) return levels[i];
    computed[i] = true;
    if (prereqs[i].length === 0) {
      levels[i] = 0;
    } else {
      levels[i] = 1 + Math.max(...prereqs[i].map(getLevel));
    }
    return levels[i];
  }
  for (let i = 0; i < n; i++) getLevel(i);

  const maxLevel = Math.max(...levels);
  const byLevel: number[][] = Array.from({ length: maxLevel + 1 }, () => []);
  for (let i = 0; i < n; i++) byLevel[levels[i]].push(i);

  // Compute positions
  const maxPerCol = Math.max(...byLevel.map((col) => col.length));
  const totalHeight = MARGIN_Y * 2 + (maxPerCol - 1) * ROW_GAP;
  const totalWidth = MARGIN_X * 2 + maxLevel * COL_GAP;

  const positions: { x: number; y: number }[] = new Array(n);
  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    const col = byLevel[lvl];
    const colHeight = (col.length - 1) * ROW_GAP;
    const startY = MARGIN_Y + (totalHeight - MARGIN_Y * 2 - colHeight) / 2;
    const x = MARGIN_X + lvl * COL_GAP;
    col.forEach((nodeIdx, j) => {
      positions[nodeIdx] = { x, y: startY + j * ROW_GAP };
    });
  }

  const nodes: GraphNode[] = projects.map((p, i) => ({
    idx: i,
    name: p.name,
    status: p.status,
    x: positions[i].x,
    y: positions[i].y,
  }));

  return {
    nodes,
    edges,
    width: Math.max(totalWidth, 300),
    height: Math.max(totalHeight, 160),
  };
}

function nodeColors(status: string) {
  if (status === 'Завершено') return { fill: '#ecfdf5', stroke: '#10b981' };
  if (status === 'В работе') return { fill: '#eff6ff', stroke: '#3b82f6' };
  return { fill: '#f5f5f5', stroke: '#a3a3a3' };
}

function truncate(name: string, max = 12) {
  return name.length <= max ? name : name.slice(0, max - 1) + '…';
}

function DependencyGraph({ ctx }: { ctx: SavedContext | null }) {
  const { nodes, edges, width, height } = useMemo(
    () => buildGraph(ctx?.projects ?? [], ctx?.dependencies ?? []),
    [ctx],
  );

  if (!ctx || ctx.projects.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200">
        {ctx ? 'Проекты не добавлены в контекст.' : 'Загрузка данных контекста…'}
      </div>
    );
  }

  return (
    <>
      <div className="bg-neutral-50 rounded-lg border border-neutral-200 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="min-w-full"
        >
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#a1a1aa" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((e, i) => {
            const s = nodes[e.from];
            const t = nodes[e.to];
            const x1 = s.x + NODE_R;
            const y1 = s.y;
            const x2 = t.x - NODE_R - 8;
            const y2 = t.y;
            const cx = (x1 + x2) / 2;
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="#a1a1aa"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const { fill, stroke } = nodeColors(node.status);
            const lines = node.name.split(' ');
            const label = truncate(node.name, 14);
            const multiLine = label.length > 8;

            return (
              <g key={node.idx}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_R}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth="2.5"
                />
                {multiLine ? (
                  <>
                    <text
                      x={node.x}
                      y={node.y - 7}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#262626"
                    >
                      {label.slice(0, Math.ceil(label.length / 2))}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 7}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#262626"
                    >
                      {label.slice(Math.ceil(label.length / 2))}
                    </text>
                  </>
                ) : (
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#262626"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-50" />
          <span className="text-xs text-neutral-600">Завершено</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-50" />
          <span className="text-xs text-neutral-600">В работе</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-neutral-400 bg-neutral-100" />
          <span className="text-xs text-neutral-600">Не начато</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 border-t-2 border-neutral-400" />
          <ArrowRight className="w-4 h-4 text-neutral-500" />
          <span className="text-xs text-neutral-600">Зависимость</span>
        </div>
      </div>

      {/* Node name tooltip table when names are long */}
      {nodes.some((n) => n.name.length > 14) && (
        <div className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
          <p className="text-xs text-neutral-500 mb-2">Полные названия проектов:</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {nodes.map((n) => (
              <span key={n.idx} className="text-xs text-neutral-700">
                <span className="font-medium">{truncate(n.name, 14)}</span> — {n.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function AnalizScreen({ contextId }: { contextId: string | null }) {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [ctx, setCtx] = useState<SavedContext | null>(null);

  // Load analysis with polling when IN_PROGRESS
  useEffect(() => {
    if (!contextId) return;
    let timer: ReturnType<typeof setTimeout>;

    const load = async () => {
      setLoading(true);
      try {
        const result = await analysisApi.get(contextId);
        setData(result);
        if (result.status === 'IN_PROGRESS') {
          timer = setTimeout(load, 5000);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => clearTimeout(timer);
  }, [contextId]);

  // Load context data for dependency graph
  useEffect(() => {
    if (!contextId) { setCtx(null); return; }
    contextApi.get(contextId).then(setCtx).catch(() => setCtx(null));
  }, [contextId]);

  const getStatusClasses = (status: 'ok' | 'warning' | 'critical') => {
    if (status === 'critical') return 'bg-red-50 border-red-200 text-red-700';
    if (status === 'warning') return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  };

  const getDotClasses = (level: 'high' | 'medium' | 'low') => {
    if (level === 'high') return 'bg-red-500';
    if (level === 'medium') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getImpactClasses = (level: 'high' | 'medium' | 'low') => {
    if (level === 'high') return 'bg-red-100 text-red-700';
    if (level === 'medium') return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  const renderContent = () => {
    if (!contextId) {
      return (
        <div className="p-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm text-center">
          Выберите мультипроект и перейдите на страницу «Контекст», чтобы запустить анализ.
        </div>
      );
    }

    if (loading && !data) {
      return (
        <div className="flex items-center justify-center gap-3 py-20 text-neutral-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Загрузка…</span>
        </div>
      );
    }

    if (!data || data.status === 'NOT_STARTED') {
      return (
        <div className="p-6 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-500 text-sm text-center">
          Контекст ещё не отправлен. Перейдите на страницу «Контекст» и нажмите «Сформировать контекст».
        </div>
      );
    }

    if (data.status === 'IN_PROGRESS') {
      return (
        <div className="flex items-center justify-center gap-3 py-20 text-neutral-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Анализ выполняется, подождите…</span>
        </div>
      );
    }

    if (data.status === 'FAILED') {
      return (
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          <p className="font-medium mb-1">Анализ завершился с ошибкой</p>
          <p>{data.error ?? 'Неизвестная ошибка'}</p>
        </div>
      );
    }

    return (
      <>
        {/* Выявленные риски */}
        {data.risks && data.risks.length > 0 && (
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-neutral-900">Выявленные риски</h2>
            </div>
            <div className="space-y-3">
              {data.risks.map((item, index) => (
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
        )}

        {/* Анализ по срокам */}
        {data.scheduleAnalysis && data.scheduleAnalysis.length > 0 && (
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock3 className="w-5 h-5 text-blue-500" />
              <h2 className="text-neutral-900">Анализ реализуемости портфеля по срокам</h2>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <ul className="space-y-2 text-sm text-neutral-700 leading-relaxed">
                {data.scheduleAnalysis.map((item, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Ресурсы */}
        {data.resourceAnalysis && data.resourceAnalysis.length > 0 && (
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
                  {data.resourceAnalysis.map((item, index) => (
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
        )}

        {/* Текущие отклонения */}
        {data.deviationAnalysis && data.deviationAnalysis.length > 0 && (
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-neutral-900">Анализ текущих отклонений</h2>
            </div>
            <div className="space-y-3">
              {data.deviationAnalysis.map((item, index) => (
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
        )}

        {/* ИИ-объяснения */}
        {data.aiExplanation && (
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-blue-500" />
              <h2 className="text-neutral-900">ИИ-объяснения</h2>
            </div>
            <div className="p-4 rounded-lg border border-neutral-200 bg-white">
              <p className="text-sm text-neutral-700 leading-relaxed">{data.aiExplanation}</p>
            </div>
          </section>
        )}

        {/* ИИ-рекомендации */}
        {data.recommendations && data.recommendations.length > 0 && (
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-neutral-900">ИИ-рекомендации</h2>
            </div>
            <div className="p-4 rounded-lg border border-neutral-200 bg-white">
              <ul className="space-y-4">
                {data.recommendations.map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-neutral-400 mt-0.5">•</span>
                    <div>
                      <h3 className="text-sm font-medium text-neutral-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-neutral-700 leading-relaxed">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <button className="w-full bg-neutral-900 text-white py-4 rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
          <Play className="w-5 h-5" />
          <span>Перейти к целям</span>
        </button>
      </>
    );
  };

  return (
    <main className="flex-1 overflow-auto bg-neutral-50">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-neutral-900 mb-2">Анализ</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Анализ зависимостей, реализуемости портфеля, ограничений и текущих отклонений
        </p>

        <div className="space-y-6">
          {/* Граф зависимостей — динамический */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-neutral-900 mb-1">Граф зависимостей проектов</h2>
                <p className="text-sm text-neutral-500">
                  Направленный граф с учётом статуса проектов и связей между ними
                </p>
              </div>
            </div>
            <DependencyGraph ctx={ctx} />
          </section>

          {renderContent()}
        </div>
      </div>
    </main>
  );
}
