/** Оболочка CprpWPF: WorkspaceManager, WorkspaceHostWindow, старт App. */

export const WorkspaceType = {
  ActiveWorkList: "ActiveWorkList",
  ClosedWorkList: "ClosedWorkList",
  WorkSearch: "WorkSearch",
  Law: "Law",
  ExcontWork: "ExcontWork",
  CustomsWork: "CustomsWork",
  MilitaryWork: "MilitaryWork",
  TnvedConsultationWork: "TnvedConsultationWork",
  VedConsultationWork: "VedConsultationWork",
} as const;

export type WorkspaceType = (typeof WorkspaceType)[keyof typeof WorkspaceType];

export interface WorkspaceKey {
  type: WorkspaceType;
  entityId: number;
}

export interface AppSettings {
  isExpertMode: boolean;
  isLeaderMode: boolean;
  isManagerMode: boolean;
}

export interface WorkView {
  dbId: number | null;
  title: string;
}

export interface HostWindow {
  key: WorkspaceKey;
  dbId: number | null;
  title: string;
}

export interface ShellState {
  windows: HostWindow[];
  activeKey: string | null;
  shutdown: boolean;
}

/** App.OnStartup открывает именно эту работу. */
export const STARTUP_KEY: WorkspaceKey = { type: WorkspaceType.ExcontWork, entityId: 5 };

export function createStartupSettings(): AppSettings {
  return { isExpertMode: true, isLeaderMode: true, isManagerMode: false };
}

export function keyId(key: WorkspaceKey): string {
  return `${key.type}:${key.entityId}`;
}

/** WorkspaceTitleConverter: руководитель важнее эксперта, иначе «ЭС». */
export function roleSuffix(settings: AppSettings): string {
  if (settings.isLeaderMode) return "Руководитель";
  if (settings.isExpertMode) return "Эксперт";
  if (settings.isManagerMode) return "Менеджер";
  return "ЭС";
}

/** WorkViewModel.Title. */
export function workTitle(dbId: number | null | undefined): string {
  return `Работа № ${dbId == null ? "б/н" : String(dbId)}`;
}

export function workspaceWindowTitle(taskTitle: string | null | undefined, settings: AppSettings): string {
  const title = taskTitle == null ? "Рабочая область" : taskTitle;
  return `${title} - ${roleSuffix(settings)}`;
}

/** ViewModelFactory: собрана только ветка ExcontWork. */
export function createWorkView(key: WorkspaceKey): WorkView {
  if (key.type !== WorkspaceType.ExcontWork) {
    throw new Error("Неизвестный тип рабочего пространства");
  }
  return { dbId: key.entityId, title: workTitle(key.entityId) };
}

export function emptyShell(): ShellState {
  return { windows: [], activeKey: null, shutdown: false };
}

/** OpenWorkspaceMessage: повторный ключ активирует уже открытое окно. */
export function openWorkspace(state: ShellState, key: WorkspaceKey, settings: AppSettings): ShellState {
  if (state.shutdown) return state;
  const id = keyId(key);
  if (state.windows.some((window) => keyId(window.key) === id)) {
    return { ...state, activeKey: id };
  }
  const view = createWorkView(key);
  const host: HostWindow = {
    key,
    dbId: view.dbId,
    title: workspaceWindowTitle(view.title, settings),
  };
  return { shutdown: false, activeKey: id, windows: [...state.windows, host] };
}

/** Закрытие последнего окна вызывает завершение приложения. */
export function closeWorkspace(state: ShellState, id: string): ShellState {
  const windows = state.windows.filter((window) => keyId(window.key) !== id);
  if (windows.length === 0) return { windows: [], activeKey: null, shutdown: true };
  return { windows, activeKey: keyId(windows[windows.length - 1].key), shutdown: false };
}

export function initialShell(settings: AppSettings = createStartupSettings()): ShellState {
  return openWorkspace(emptyShell(), STARTUP_KEY, settings);
}
