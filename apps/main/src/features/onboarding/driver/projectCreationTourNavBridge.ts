/**
 * Связка Driver-турa создания проекта с UI модалки (шаг выбора типа ↔ импорт).
 * Регистрируется из `ProjectCreationModal` для root-потока.
 */
type KindNavHandlers = {
  requestKindScreen: () => void;
};

let kindNavHandlers: KindNavHandlers | null = null;

export function registerProjectCreationTourKindNav(
  handlers: KindNavHandlers | null,
): void {
  kindNavHandlers = handlers;
}

/** Вернуть модалку на экран выбора типа проекта (для «Назад» с первого шага импорта). */
export function requestProjectCreationTourKindScreen(): void {
  kindNavHandlers?.requestKindScreen();
}
