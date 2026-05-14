import { useMemo, useState } from 'react';
import { Upload, Target, Plus, Trash2 } from 'lucide-react';
import { contextApi } from '../api/context';
import type { ContextPayload } from '../api/context';

type Priority = 'Высокий' | 'Средний' | 'Низкий' | '';

type ProjectStatus = 'Не начато' | 'В работе' | 'Завершено' | '';

type Guideline = {
  id: string;
  vision: string;
  priority: Priority;
};

type GuidelineForm = {
  vision: string;
  priority: Priority;
};

type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  analysts: string;
  developers: string;
  testers: string;
  constraints: string;
  deviations: string;
  description: string;
};

type ProjectForm = {
  id: string | null;
  name: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  analysts: string;
  developers: string;
  testers: string;
  constraints: string;
  deviations: string;
  description: string;
};

type DependencyRelation = {
  id: string;
  baseProjectId: string;
  dependentProjectId: string;
};

type PortfolioConstraints = {
  analystsLimit: string;
  developersLimit: string;
  testersLimit: string;
  criticalDeadline: string;
};

const emptyGuidelineForm: GuidelineForm = {
  vision: '',
  priority: '',
};

const emptyProjectForm: ProjectForm = {
  id: null,
  name: '',
  status: '',
  startDate: '',
  endDate: '',
  analysts: '',
  developers: '',
  testers: '',
  constraints: '',
  deviations: '',
  description: '',
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export function KontekstScreen({ contextId }: { contextId: string | null }) {
  const [guidelineForm, setGuidelineForm] =
    useState<GuidelineForm>(emptyGuidelineForm);

  const [guidelines, setGuidelines] = useState<Guideline[]>([]);

  const [projectForm, setProjectForm] =
    useState<ProjectForm>(emptyProjectForm);

  const [projects, setProjects] = useState<Project[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [dependentProjectId, setDependentProjectId] = useState<string>('');

  const [dependencyRelations, setDependencyRelations] =
    useState<DependencyRelation[]>([]);

  const [portfolioConstraints, setPortfolioConstraints] =
    useState<PortfolioConstraints>({
      analystsLimit: '',
      developersLimit: '',
      testersLimit: '',
      criticalDeadline: '',
    });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const buildPayload = (): ContextPayload => {
    const nameById = Object.fromEntries(projects.map((p) => [p.id, p.name]));
    return {
      orientations: guidelines.map((g) => ({
        vision: g.vision,
        priority: g.priority as 'Высокий' | 'Средний' | 'Низкий',
      })),
      projects: projects.map((p) => ({
        name: p.name,
        status: p.status as 'Завершено' | 'В работе' | 'Не начато',
        start_date: p.startDate,
        end_date: p.endDate,
        workload: {
          analysts: parseInt(p.analysts, 10) || 0,
          developers: parseInt(p.developers, 10) || 0,
          testers: parseInt(p.testers, 10) || 0,
        },
        constraints: p.constraints || undefined,
        deviations: p.deviations || undefined,
        description: p.description || undefined,
      })),
      dependencies: dependencyRelations.map((d) => ({
        main_project_name: nameById[d.baseProjectId] ?? '',
        dependent_project_name: nameById[d.dependentProjectId] ?? '',
      })),
      portfolio_constraints: {
        analysts_limit: parseInt(portfolioConstraints.analystsLimit, 10) || 0,
        developers_limit: parseInt(portfolioConstraints.developersLimit, 10) || 0,
        testers_limit: parseInt(portfolioConstraints.testersLimit, 10) || 0,
        critical_deadline: portfolioConstraints.criticalDeadline,
      },
    };
  };

  const handleSubmit = async () => {
    if (!contextId) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await contextApi.submit(contextId, buildPayload());
      setSubmitSuccess(true);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Ошибка при отправке');
    } finally {
      setSubmitLoading(false);
    }
  };

  const totalRoleLoad = useMemo(() => {
    return projects.reduce(
      (acc, project) => {
        acc.analysts += Number(project.analysts || 0);
        acc.developers += Number(project.developers || 0);
        acc.testers += Number(project.testers || 0);
        return acc;
      },
      { analysts: 0, developers: 0, testers: 0 },
    );
  }, [projects]);

  const getProjectNameById = (id: string) => {
    return projects.find((project) => project.id === id)?.name || 'Проект не найден';
  };

  const handleGuidelineChange = (
    field: keyof GuidelineForm,
    value: string,
  ) => {
    setGuidelineForm((prev) => ({
      ...prev,
      [field]: value as Priority,
    }));
  };

  const handleAddGuideline = () => {
    if (!guidelineForm.vision.trim() || !guidelineForm.priority) {
      return;
    }

    setGuidelines((prev) => [
      ...prev,
      {
        id: generateId(),
        vision: guidelineForm.vision.trim(),
        priority: guidelineForm.priority,
      },
    ]);

    setGuidelineForm({ ...emptyGuidelineForm });
  };

  const handleDeleteGuideline = (id: string) => {
    setGuidelines((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProjectChange = (
    field: keyof ProjectForm,
    value: string,
  ) => {
    setProjectForm((prev) => ({
      ...prev,
      [field]: field === 'status' ? (value as ProjectStatus) : value,
    }));
  };

  const handleNumericProjectChange = (
    field: keyof Pick<ProjectForm, 'analysts' | 'developers' | 'testers'>,
    value: string,
  ) => {
    const onlyDigits = value.replace(/\D/g, '');

    setProjectForm((prev) => ({
      ...prev,
      [field]: onlyDigits,
    }));
  };

  const handleSaveProject = () => {
    if (
      !projectForm.name.trim() ||
      !projectForm.status ||
      !projectForm.startDate ||
      !projectForm.endDate
    ) {
      return;
    }

    const preparedProject: Project = {
      id: generateId(),
      name: projectForm.name.trim(),
      status: projectForm.status,
      startDate: projectForm.startDate,
      endDate: projectForm.endDate,
      analysts: projectForm.analysts,
      developers: projectForm.developers,
      testers: projectForm.testers,
      constraints: projectForm.constraints.trim(),
      deviations: projectForm.deviations.trim(),
      description: projectForm.description.trim(),
    };

    setProjects((prev) => [...prev, preparedProject]);
    setProjectForm({ ...emptyProjectForm });
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) =>
      prev.filter((project) => project.id !== projectId),
    );

    setDependencyRelations((prev) =>
      prev.filter(
        (relation) =>
          relation.baseProjectId !== projectId &&
          relation.dependentProjectId !== projectId,
      ),
    );

    if (selectedProjectId === projectId) {
      setSelectedProjectId('');
    }

    if (dependentProjectId === projectId) {
      setDependentProjectId('');
    }
  };

  const handleConstraintChange = (
    field: keyof PortfolioConstraints,
    value: string,
  ) => {
    setPortfolioConstraints((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumericConstraintChange = (
    field: keyof Pick<
      PortfolioConstraints,
      'analystsLimit' | 'developersLimit' | 'testersLimit'
    >,
    value: string,
  ) => {
    const onlyDigits = value.replace(/\D/g, '');

    setPortfolioConstraints((prev) => ({
      ...prev,
      [field]: onlyDigits,
    }));
  };

  const handleAddDependency = () => {
    if (!selectedProjectId || !dependentProjectId || selectedProjectId === dependentProjectId) {
      return;
    }

    const relationExists = dependencyRelations.some(
      (relation) =>
        relation.baseProjectId === selectedProjectId &&
        relation.dependentProjectId === dependentProjectId,
    );

    if (relationExists) {
      return;
    }

    setDependencyRelations((prev) => [
      ...prev,
      {
        id: generateId(),
        baseProjectId: selectedProjectId,
        dependentProjectId,
      },
    ]);

    setDependentProjectId('');
  };

  const handleDeleteDependency = (id: string) => {
    setDependencyRelations((prev) =>
      prev.filter((relation) => relation.id !== id),
    );
  };

  const getStatusStyles = (status: ProjectStatus) => {
    switch (status) {
      case 'Не начато':
        return 'bg-blue-100 text-blue-700';
      case 'В работе':
        return 'bg-amber-100 text-amber-700';
      case 'Завершено':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-neutral-900 mb-2">Контекст</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Определите исходные данные для стратегического планирования мультипроекта
        </p>

        <div className="space-y-6">
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-neutral-900 mb-1">
                  Загрузка отчета о факторах внешней среды
                </h2>
                <p className="text-sm text-neutral-500">Раздел в разработке</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-700">
                В разработке
              </span>
            </div>

            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 mb-4 opacity-70 cursor-not-allowed">
              <div className="flex flex-col items-center gap-3 text-center">
                <Upload className="w-8 h-8 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-700 mb-1">
                    Загрузка отчета о факторах внешней среды будет доступна в следующих версиях
                  </p>
                  <p className="text-xs text-neutral-500">Планируется поддержка PDF, DOCX</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-400 bg-neutral-50 cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              <span>Загрузить отчет</span>
            </button>
          </section>

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="text-neutral-900 mb-4">Стратегические ориентиры</h2>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_auto] gap-4 items-end mb-5">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  Видение (к чему стремимся?)
                </label>
                <textarea
                  value={guidelineForm.vision}
                  onChange={(e) => handleGuidelineChange('vision', e.target.value)}
                  className="w-full h-28 px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Например, Сделать цифровую трансформацию доступной для среднего бизнеса к 2028 году"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  Приоритет ориентира
                </label>
                <select
                  value={guidelineForm.priority}
                  onChange={(e) => handleGuidelineChange('priority', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Выберите приоритет</option>
                  <option value="Высокий">Высокий</option>
                  <option value="Средний">Средний</option>
                  <option value="Низкий">Низкий</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddGuideline}
                className="h-10 px-4 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить</span>
              </button>
            </div>

            {guidelines.length > 0 ? (
              <div className="space-y-3">
                {guidelines.map((item, index) => (
                  <div
                    key={item.id}
                    className="border border-neutral-200 rounded-lg p-4 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Ориентир {index + 1}</p>
                      <p className="text-sm text-neutral-800 leading-relaxed">{item.vision}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.priority === 'Высокий'
                            ? 'bg-rose-100 text-rose-700'
                            : item.priority === 'Средний'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {item.priority}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteGuideline(item.id)}
                        className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                        aria-label="Удалить ориентир"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-neutral-200 rounded-lg p-4 text-sm text-neutral-500">
                Стратегические ориентиры пока не добавлены
              </div>
            )}
          </section>

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="text-neutral-900 mb-4">Реестр проектов</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">Название проекта</label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => handleProjectChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите название проекта"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Статус</label>
                <select
                  value={projectForm.status}
                  onChange={(e) => handleProjectChange('status', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Выберите статус</option>
                  <option value="Не начато">Не начато</option>
                  <option value="В работе">В работе</option>
                  <option value="Завершено">Завершено</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Дата начала</label>
                <input
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) => handleProjectChange('startDate', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Дата окончания</label>
                <input
                  type="date"
                  value={projectForm.endDate}
                  onChange={(e) => handleProjectChange('endDate', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  Трудоемкость: аналитики, чел.-ч
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={projectForm.analysts}
                  onChange={(e) => handleNumericProjectChange('analysts', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="чел.-ч"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  Трудоемкость: разработчики, чел.-ч
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={projectForm.developers}
                  onChange={(e) => handleNumericProjectChange('developers', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="чел.-ч"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  Трудоемкость: тестировщики, чел.-ч
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={projectForm.testers}
                  onChange={(e) => handleNumericProjectChange('testers', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="чел.-ч"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">Ограничения проекта</label>
                <textarea
                  value={projectForm.constraints}
                  onChange={(e) => handleProjectChange('constraints', e.target.value)}
                  className="w-full h-24 px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Например, проект должен быть завершен до 01.01.2027"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Текущие отклонения</label>
                <textarea
                  value={projectForm.deviations}
                  onChange={(e) => handleProjectChange('deviations', e.target.value)}
                  className="w-full h-24 px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Укажите текущие отклонения по срокам, ресурсам, содержанию или качеству"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Описание проекта</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => handleProjectChange('description', e.target.value)}
                  className="w-full h-24 px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Кратко опишите цель, содержание или ожидаемый результат проекта"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                type="button"
                onClick={handleSaveProject}
                className="px-4 py-3 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить проект</span>
              </button>
            </div>

            {projects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Проект</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Статус</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Начало</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Окончание</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Аналитики, чел.-ч</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Разработчики, чел.-ч</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Тестировщики, чел.-ч</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Ограничения</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Отклонения</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Описание</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className="border-b border-neutral-100 align-top">
                        <td className="py-3 px-4 text-sm text-neutral-700">{project.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusStyles(project.status)}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-700">{project.startDate || '—'}</td>
                        <td className="py-3 px-4 text-sm text-neutral-700">{project.endDate || '—'}</td>
                        <td className="py-3 px-4 text-sm text-neutral-700">{project.analysts || '0'}</td>
                        <td className="py-3 px-4 text-sm text-neutral-700">{project.developers || '0'}</td>
                        <td className="py-3 px-4 text-sm text-neutral-700">{project.testers || '0'}</td>
                        <td className="py-3 px-4 text-sm text-neutral-700 whitespace-pre-wrap">
                          {project.constraints || '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-700 whitespace-pre-wrap">
                          {project.deviations || '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-700 whitespace-pre-wrap">
                          {project.description || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project.id)}
                            className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                            aria-label="Удалить проект"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    <tr className="bg-neutral-50">
                      <td className="py-3 px-4 text-sm font-medium text-neutral-900">Итого по ролям, чел.-ч</td>
                      <td className="py-3 px-4" />
                      <td className="py-3 px-4" />
                      <td className="py-3 px-4" />
                      <td className="py-3 px-4 text-sm font-medium text-neutral-900">{totalRoleLoad.analysts}</td>
                      <td className="py-3 px-4 text-sm font-medium text-neutral-900">{totalRoleLoad.developers}</td>
                      <td className="py-3 px-4 text-sm font-medium text-neutral-900">{totalRoleLoad.testers}</td>
                      <td className="py-3 px-4" />
                      <td className="py-3 px-4" />
                      <td className="py-3 px-4" />
                      <td className="py-3 px-4" />
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-dashed border-neutral-200 rounded-lg p-4 text-sm text-neutral-500">
                Проекты пока не добавлены
              </div>
            )}
          </section>

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="text-neutral-900 mb-2">Зависимости проектов</h2>
            <p className="text-sm text-neutral-500 mb-5">
              Выберите основной проект и проект, который от него зависит
            </p>

            {projects.length < 2 ? (
              <div className="border border-dashed border-neutral-200 rounded-lg p-4 text-sm text-neutral-500">
                Для настройки зависимостей необходимо добавить минимум два проекта
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-4 items-end mb-5">
                  <div>
                    <label className="block text-sm text-neutral-700 mb-2">Основной проект</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        setDependentProjectId('');
                      }}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">Выберите проект</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-700 mb-2">Зависимый проект</label>
                    <select
                      value={dependentProjectId}
                      onChange={(e) => setDependentProjectId(e.target.value)}
                      disabled={!selectedProjectId}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-neutral-50 disabled:text-neutral-400"
                    >
                      <option value="">Выберите проект</option>
                      {projects
                        .filter((project) => project.id !== selectedProjectId)
                        .map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddDependency}
                    className="h-10 px-4 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить</span>
                  </button>
                </div>

                {dependencyRelations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Основной проект</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Зависимый проект</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Описание связи</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dependencyRelations.map((relation) => (
                          <tr key={relation.id} className="border-b border-neutral-100">
                            <td className="py-3 px-4 text-sm text-neutral-700">
                              {getProjectNameById(relation.baseProjectId)}
                            </td>
                            <td className="py-3 px-4 text-sm text-neutral-700">
                              {getProjectNameById(relation.dependentProjectId)}
                            </td>
                            <td className="py-3 px-4 text-sm text-neutral-700">
                              {getProjectNameById(relation.dependentProjectId)} зависит от{' '}
                              {getProjectNameById(relation.baseProjectId)}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => handleDeleteDependency(relation.id)}
                                className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                                aria-label="Удалить зависимость"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-dashed border-neutral-200 rounded-lg p-4 text-sm text-neutral-500">
                    Зависимости проектов пока не добавлены
                  </div>
                )}
              </>
            )}
          </section>

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="text-neutral-900 mb-2">Портфельные ограничения</h2>
            <p className="text-sm text-neutral-500 mb-5">
              Укажите доступные ресурсные лимиты и критический срок завершения мультипроекта
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">Лимит: аналитики</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={portfolioConstraints.analystsLimit}
                  onChange={(e) => handleNumericConstraintChange('analystsLimit', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="чел.-ч"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Лимит: разработчики</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={portfolioConstraints.developersLimit}
                  onChange={(e) => handleNumericConstraintChange('developersLimit', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="чел.-ч"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Лимит: тестировщики</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={portfolioConstraints.testersLimit}
                  onChange={(e) => handleNumericConstraintChange('testersLimit', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="чел.-ч"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Критический срок</label>
                <input
                  type="date"
                  value={portfolioConstraints.criticalDeadline}
                  onChange={(e) => handleConstraintChange('criticalDeadline', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {!contextId && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm text-center">
              Выберите мультипроект, чтобы сформировать контекст
            </div>
          )}

          {submitError && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm text-center">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm text-center">
              Контекст принят — анализ запущен. Перейдите на страницу «Анализ».
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitLoading || submitSuccess || !contextId}
            className="w-full bg-neutral-900 text-white py-4 rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Target className="w-5 h-5" />
            <span>{submitLoading ? 'Отправка…' : 'Сформировать контекст'}</span>
          </button>
        </div>
      </div>
    </main>
  );
}