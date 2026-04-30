import { useState, useEffect, useCallback } from "react";

interface FavoriteApartment {
  id: string;
  project_id: string;
  apartment_number: string;
  rooms: number;
  area: number;
  price?: number;
  status: string;
  floor_number: number;
  image_url?: string | null;
  addedAt: number;
}

const FAVORITES_STORAGE_KEY = "apartment-favorites";
const FAVORITES_UPDATED_EVENT = "gridix:favorites-updated";

type FavoritesUpdatedDetail = FavoriteApartment[];

export const useFavorites = (projectId?: string) => {
  const [favorites, setFavorites] = useState<FavoriteApartment[]>([]);

  const readFavoritesFromStorage = (): FavoriteApartment[] => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error loading favorites from localStorage:", error);
      return [];
    }
  };

  // Загружаем избранные из localStorage при инициализации + слушаем изменения
  useEffect(() => {
    setFavorites(readFavoritesFromStorage());

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== FAVORITES_STORAGE_KEY) return;
      setFavorites(readFavoritesFromStorage());
    };

    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<FavoritesUpdatedDetail>;
      if (Array.isArray(customEvent.detail)) {
        setFavorites(customEvent.detail);
      } else {
        setFavorites(readFavoritesFromStorage());
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleCustomEvent);
    };
  }, []);

  // Сохраняем избранные в localStorage при изменении
  const saveFavoritesToStorage = (newFavorites: FavoriteApartment[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      window.dispatchEvent(
        new CustomEvent<FavoritesUpdatedDetail>(FAVORITES_UPDATED_EVENT, {
          detail: newFavorites,
        }),
      );
    } catch (error) {
      console.error("Error saving favorites to localStorage:", error);
    }
  };

  // Добавить в избранное
  const addToFavorites = (apartment: Omit<FavoriteApartment, "addedAt">) => {
    const newFavorite: FavoriteApartment = {
      ...apartment,
      addedAt: Date.now(),
    };

    const newFavorites = [...favorites, newFavorite];
    setFavorites(newFavorites);
    saveFavoritesToStorage(newFavorites);
  };

  // Удалить из избранного
  const removeFromFavorites = (apartmentId: string) => {
    const newFavorites = favorites.filter((fav) => fav.id !== apartmentId);
    setFavorites(newFavorites);
    saveFavoritesToStorage(newFavorites);
  };

  // Переключить состояние избранного
  const toggleFavorite = (apartment: Omit<FavoriteApartment, "addedAt">) => {
    if (isFavorite(apartment.id)) {
      removeFromFavorites(apartment.id);
    } else {
      addToFavorites(apartment);
    }
  };

  // Проверить, находится ли квартира в избранном
  const isFavorite = (apartmentId: string) => {
    return favorites.some((fav) => fav.id === apartmentId);
  };

  // Получить избранные квартиры, отсортированные по дате добавления (новые сначала)
  const getFavorites = () => {
    return [...favorites].sort((a, b) => b.addedAt - a.addedAt);
  };

  // Получить избранные квартиры по проекту
  const getFavoritesForProject = (id: string) => {
    return [...favorites]
      .filter((fav) => fav.project_id === id)
      .sort((a, b) => b.addedAt - a.addedAt);
  };

  // Очистить все избранные
  const clearFavorites = () => {
    setFavorites([]);
    saveFavoritesToStorage([]);
  };

  /**
   * Подборка по проекту из ссылки ?favorites=: снять все избранные с project_id,
   * затем записать items (порядок в URL → addedAt с шагом).
   * items пустой = только очистка по проекту.
   */
  const replaceFavoritesForProject = useCallback(
    (targetProjectId: string, items: Omit<FavoriteApartment, "addedAt">[]) => {
      setFavorites((prev) => {
        const rest = prev.filter((f) => f.project_id !== targetProjectId);
        const now = Date.now();
        const withAdded = items.map((item, i) => ({
          ...item,
          project_id: targetProjectId,
          addedAt: now + i,
        }));
        const next = [...rest, ...withAdded];
        saveFavoritesToStorage(next);
        return next;
      });
    },
    [],
  );

  return {
    favorites: getFavorites(),
    favoritesForProject: projectId
      ? getFavoritesForProject(projectId)
      : undefined,
    addToFavorites,
    replaceFavoritesForProject,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoritesCount: projectId
      ? favorites.filter((fav) => fav.project_id === projectId).length
      : favorites.length,
  };
};
