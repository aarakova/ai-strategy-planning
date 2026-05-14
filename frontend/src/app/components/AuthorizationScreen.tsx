import { useState, useEffect } from 'react';
import {
  LogIn,
  UserPlus,
  FolderKanban,
  CalendarRange,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Trash2,
  Loader2,
} from 'lucide-react';

import { authApi } from '../api/auth';
import { contextsApi, type Multiproject } from '../api/contexts';
import { ApiError } from '../api/client';

type ScreenName = 'Авторизация' | 'Главная';

type AuthForm = {
  login: string;
  password: string;
};

type ProjectForm = {
  name: string;
  planningHorizon: string;
};

type AuthorizationScreenProps = {
  setActiveScreen: (screen: ScreenName) => void;
  setSelectedMultiproject: (multiproject: Multiproject) => void;
  onLoginSuccess: (login: string) => void;
  initialStep?: 'auth' | 'multiproject';
  initialLogin?: string;
};

const formatDate = (date: string) => {
  if (!date) return 'Не указано';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export function AuthorizationScreen({
  setActiveScreen,
  setSelectedMultiproject,
  onLoginSuccess,
  initialStep = 'auth',
  initialLogin = '',
}: AuthorizationScreenProps) {
  const [step, setStep] = useState<'auth' | 'multiproject'>(initialStep);
  const [currentUserLogin, setCurrentUserLogin] = useState(initialLogin);

  const [authForm, setAuthForm] = useState<AuthForm>({ login: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [multiprojects, setMultiprojects] = useState<Multiproject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedMultiprojectId, setSelectedMultiprojectId] = useState<string | null>(null);

  const [projectForm, setProjectForm] = useState<ProjectForm>({ name: '', planningHorizon: '' });
  const [projectError, setProjectError] = useState('');
  const [projectCreating, setProjectCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMultiprojects = async () => {
    setProjectsLoading(true);
    try {
      const list = await contextsApi.list();
      setMultiprojects(list);
    } catch {
      // ignore — list stays empty
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'multiproject') {
      loadMultiprojects();
    }
  }, [step]);

  const handleAuthChange = (field: keyof AuthForm, value: string) => {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
    setAuthError('');
  };

  const handleLogin = async () => {
    const login = authForm.login.trim();
    const password = authForm.password.trim();
    if (!login) { setAuthError('Введите логин.'); return; }
    if (!password) { setAuthError('Введите пароль.'); return; }

    setAuthLoading(true);
    try {
      const user = await authApi.login(login, password);
      setCurrentUserLogin(user.login);
      onLoginSuccess(user.login);
      setStep('multiproject');
    } catch (e) {
      setAuthError(e instanceof ApiError ? e.detail : 'Ошибка сервера');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    const login = authForm.login.trim();
    const password = authForm.password.trim();
    if (!login) { setAuthError('Введите логин.'); return; }
    if (!password) { setAuthError('Введите пароль.'); return; }
    if (password.length < 8) { setAuthError('Пароль должен быть не менее 8 символов.'); return; }

    setAuthLoading(true);
    try {
      const user = await authApi.register(login, password);
      setCurrentUserLogin(user.login);
      onLoginSuccess(user.login);
      setStep('multiproject');
    } catch (e) {
      setAuthError(e instanceof ApiError ? e.detail : 'Ошибка сервера');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProjectFormChange = (field: keyof ProjectForm, value: string) => {
    setProjectForm((prev) => ({ ...prev, [field]: value }));
    setProjectError('');
  };

  const handleSelectMultiproject = (project: Multiproject) => {
    setSelectedMultiprojectId(project.id);
    setSelectedMultiproject(project);
    setActiveScreen('Главная');
  };

  const handleCreateMultiproject = async () => {
    const name = projectForm.name.trim();
    const horizon = projectForm.planningHorizon;
    if (!name) { setProjectError('Введите название мультипроекта.'); return; }
    if (!horizon) { setProjectError('Укажите горизонт планирования.'); return; }

    setProjectCreating(true);
    try {
      const created = await contextsApi.create(name, horizon);
      setMultiprojects((prev) => [...prev, created]);
      setProjectForm({ name: '', planningHorizon: '' });
      handleSelectMultiproject(created);
    } catch (e) {
      setProjectError(e instanceof ApiError ? e.detail : 'Ошибка сервера');
    } finally {
      setProjectCreating(false);
    }
  };

  const handleDeleteMultiproject = async (id: string) => {
    setDeletingId(id);
    try {
      await contextsApi.delete(id);
      setMultiprojects((prev) => prev.filter((p) => p.id !== id));
      if (selectedMultiprojectId === id) setSelectedMultiprojectId(null);
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen flex-1 bg-neutral-50 text-neutral-900">
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-5 text-neutral-900">
          <BarChart3 className="h-6 w-6" />
          <span className="font-semibold">Стратегия</span>
        </div>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-3xl bg-white p-8 shadow-xl">

          {/* ── AUTH STEP ── */}
          {step === 'auth' && (
            <div>
              <div className="mb-8">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                  <LogIn className="h-7 w-7 text-blue-600" />
                </div>
                <h1 className="text-3xl font-semibold">Вход в систему</h1>
                <p className="mt-2 text-sm text-neutral-500">
                  Введите логин и пароль для авторизации или создайте нового пользователя.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Логин</label>
                  <input
                    type="text"
                    value={authForm.login}
                    onChange={(e) => handleAuthChange('login', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Введите логин"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Пароль</label>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(e) => handleAuthChange('password', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Минимум 8 символов"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {authError && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={authLoading}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {authLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                    Войти
                  </button>

                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={authLoading}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
                  >
                    {authLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                    Зарегистрироваться
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── MULTIPROJECT STEP ── */}
          {step === 'multiproject' && (
            <div>
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                    <FolderKanban className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h1 className="text-3xl font-semibold">Выбор мультипроекта</h1>
                  <p className="mt-2 text-sm text-neutral-500">Пользователь: {currentUserLogin}</p>
                </div>

                <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                  Доступно мультипроектов:{' '}
                  <span className="font-semibold text-neutral-900">{multiprojects.length}</span>
                </div>
              </div>

              {/* List */}
              <div className="mb-8 grid grid-cols-1 gap-4">
                {projectsLoading && (
                  <div className="flex items-center justify-center py-8 text-neutral-400">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm">Загрузка...</span>
                  </div>
                )}

                {!projectsLoading && multiprojects.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-400">
                    Мультипроекты не найдены. Создайте первый.
                  </div>
                )}

                {!projectsLoading && multiprojects.map((project) => {
                  const isSelected = selectedMultiprojectId === project.id;
                  const isDeleting = deletingId === project.id;

                  return (
                    <div
                      key={project.id}
                      className={`rounded-2xl border p-5 transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-neutral-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-neutral-900">{project.name}</h3>
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                                <CheckCircle2 className="h-4 w-4" />
                                Выбран
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-2 text-sm text-neutral-500 sm:grid-cols-2">
                            <div className="flex items-center gap-2">
                              <CalendarRange className="h-4 w-4" />
                              Горизонт: {formatDate(project.planningHorizon)}
                            </div>
                            <div>Дата создания: {formatDate(project.createdAt)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteMultiproject(project.id)}
                            disabled={isDeleting}
                            className="flex items-center justify-center rounded-2xl border border-red-200 bg-white p-3 text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            {isDeleting
                              ? <Loader2 className="h-5 w-5 animate-spin" />
                              : <Trash2 className="h-5 w-5" />
                            }
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectMultiproject(project)}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                          >
                            Выбрать
                            <ArrowRight className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Create form */}
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white">
                    <Plus className="h-6 w-6 text-neutral-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Создание нового мультипроекта</h3>
                    <p className="text-sm text-neutral-500">Укажите базовые данные планирования.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">
                      Название мультипроекта
                    </label>
                    <input
                      type="text"
                      value={projectForm.name}
                      onChange={(e) => handleProjectFormChange('name', e.target.value)}
                      placeholder="Например: Развитие корпоративной ИС"
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">
                      Горизонт планирования
                    </label>
                    <input
                      type="date"
                      value={projectForm.planningHorizon}
                      onChange={(e) => handleProjectFormChange('planningHorizon', e.target.value)}
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {projectError && (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{projectError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCreateMultiproject}
                  disabled={projectCreating}
                  className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {projectCreating
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <Plus className="h-5 w-5" />
                  }
                  Создать мультипроект
                </button>
              </div>
            </div>
          )}

        </section>
      </div>
    </main>
  );
}
