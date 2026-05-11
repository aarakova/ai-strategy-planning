import { useState } from 'react';
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
} from 'lucide-react';

const initialUsers = [
  {
    login: 'admin',
    password: 'admin',
  },
];

const initialMultiprojects = [
  {
    id: 1,
    name: 'Стратегическое развитие ИС',
    planningHorizon: '2026-07-31',
    createdAt: '2026-05-01',
  },
  {
    id: 2,
    name: 'Автоматизация клиентских сервисов',
    planningHorizon: '2026-09-30',
    createdAt: '2026-05-04',
  },
];

const formatDate = (date) => {
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
}) {
  const [step, setStep] = useState('auth');

  const [users, setUsers] = useState(initialUsers);
  const [currentUser, setCurrentUser] = useState(null);

  const [authForm, setAuthForm] = useState({
    login: '',
    password: '',
  });

  const [authError, setAuthError] = useState('');

  const [multiprojects, setMultiprojects] = useState(initialMultiprojects);
  const [selectedMultiprojectId, setSelectedMultiprojectId] = useState(null);

  const [projectForm, setProjectForm] = useState({
    name: '',
    planningHorizon: '',
  });

  const [projectError, setProjectError] = useState('');

  const handleAuthChange = (field, value) => {
    setAuthForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setAuthError('');
  };

  const handleLogin = () => {
    const login = authForm.login.trim();
    const password = authForm.password.trim();

    if (!login) {
      setAuthError('Введите логин.');
      return;
    }

    if (!password) {
      setAuthError('Введите пароль.');
      return;
    }

    const existingUser = users.find(
      (user) => user.login === login && user.password === password,
    );

    if (!existingUser) {
      setAuthError('Пользователь с таким логином и паролем не найден.');
      return;
    }

    setCurrentUser(existingUser);
    setStep('multiproject');
  };

  const handleRegister = () => {
    const login = authForm.login.trim();
    const password = authForm.password.trim();

    if (!login) {
      setAuthError('Введите логин.');
      return;
    }

    if (!password) {
      setAuthError('Введите пароль.');
      return;
    }

    const isLoginBusy = users.some((user) => user.login === login);

    if (isLoginBusy) {
      setAuthError('Пользователь с таким логином уже существует.');
      return;
    }

    const newUser = {
      login,
      password,
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setStep('multiproject');
  };

  const handleProjectFormChange = (field, value) => {
    setProjectForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setProjectError('');
  };

  const handleSelectMultiproject = (projectId) => {
    const selectedProject = multiprojects.find((project) => project.id === projectId);

    setSelectedMultiprojectId(projectId);

    if (typeof setSelectedMultiproject === 'function') {
      setSelectedMultiproject(selectedProject);
    }

    if (typeof setActiveScreen === 'function') {
      setActiveScreen('Главная');
    }
  };

  const handleCreateMultiproject = () => {
    const name = projectForm.name.trim();
    const planningHorizon = projectForm.planningHorizon;

    if (!name) {
      setProjectError('Введите название мультипроекта.');
      return;
    }

    if (!planningHorizon) {
      setProjectError('Укажите горизонт планирования.');
      return;
    }

    const newProject = {
      id: Date.now(),
      name,
      planningHorizon,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setMultiprojects((prev) => [...prev, newProject]);
    setSelectedMultiprojectId(newProject.id);

    if (typeof setSelectedMultiproject === 'function') {
      setSelectedMultiproject(newProject);
    }

    if (typeof setActiveScreen === 'function') {
      setActiveScreen('Главная');
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
          {step === 'auth' && (
            <div>
              <div className="mb-8">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                  <LogIn className="h-7 w-7 text-blue-600" />
                </div>

                <h1 className="text-3xl font-semibold">Вход в систему</h1>

                <p className="mt-2 text-sm text-neutral-500">
                  Введите логин и пароль для авторизации или создайте нового
                  пользователя.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Логин
                  </label>
                  <input
                    type="text"
                    value={authForm.login}
                    onChange={(event) =>
                      handleAuthChange('login', event.target.value)
                    }
                    placeholder="Введите логин"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Пароль
                  </label>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(event) =>
                      handleAuthChange('password', event.target.value)
                    }
                    placeholder="Введите пароль"
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
                    className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    <LogIn className="h-5 w-5" />
                    Войти
                  </button>

                  <button
                    type="button"
                    onClick={handleRegister}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    <UserPlus className="h-5 w-5" />
                    Зарегистрироваться
                  </button>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">
                  Для тестового входа можно использовать логин{' '}
                  <span className="font-semibold text-neutral-700">admin</span>{' '}
                  и пароль{' '}
                  <span className="font-semibold text-neutral-700">admin</span>.
                </div>
              </div>
            </div>
          )}

          {step === 'multiproject' && (
            <div>
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                    <FolderKanban className="h-7 w-7 text-emerald-600" />
                  </div>

                  <h1 className="text-3xl font-semibold">
                    Выбор мультипроекта
                  </h1>

                  <p className="mt-2 text-sm text-neutral-500">
                    Пользователь: {currentUser?.login}
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                  Доступно мультипроектов:{' '}
                  <span className="font-semibold text-neutral-900">
                    {multiprojects.length}
                  </span>
                </div>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-4">
                {multiprojects.map((project) => {
                  const isSelected = selectedMultiprojectId === project.id;

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
                            <h3 className="text-lg font-semibold text-neutral-900">
                              {project.name}
                            </h3>

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

                            <div>
                              Дата создания: {formatDate(project.createdAt)}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectMultiproject(project.id)}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                        >
                          Выбрать
                          <ArrowRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white">
                    <Plus className="h-6 w-6 text-neutral-700" />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold">
                      Создание нового мультипроекта
                    </h3>
                    <p className="text-sm text-neutral-500">
                      Укажите базовые данные планирования.
                    </p>
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
                      onChange={(event) =>
                        handleProjectFormChange('name', event.target.value)
                      }
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
                      onChange={(event) =>
                        handleProjectFormChange(
                          'planningHorizon',
                          event.target.value,
                        )
                      }
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
                  className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
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