import { useState, useEffect } from 'react';

interface FavoriteApartment {
  id: string;
  project_id: string;
  apartment_number: string;
  rooms: number;
  area: number;
  price?: number;
  status: string;
  floor_number: number;
  addedAt: number;
}

const FAVORITES_STORAGE_KEY = 'apartment-favorites';

export const useFavorites = (projectId?: string) => {
  const [favorites, setFavorites] = useState<FavoriteApartment[]>([]);

  // Загружаем избранные из localStorage при инициализации
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
    }
  }, []);

  // Сохраняем избранные в localStorage при изменении
  const saveFavoritesToStorage = (newFavorites: FavoriteApartment[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  };

  // Добавить в избранное
  const addToFavorites = (apartment: Omit<FavoriteApartment, 'addedAt'>) => {
    const newFavorite: FavoriteApartment = {
      ...apartment,
      addedAt: Date.now()
    };
    
    const newFavorites = [...favorites, newFavorite];
    setFavorites(newFavorites);
    saveFavoritesToStorage(newFavorites);
  };

  // Удалить из избранного
  const removeFromFavorites = (apartmentId: string) => {
    const newFavorites = favorites.filter(fav => fav.id !== apartmentId);
    setFavorites(newFavorites);
    saveFavoritesToStorage(newFavorites);
  };

  // Переключить состояние избранного
  const toggleFavorite = (apartment: Omit<FavoriteApartment, 'addedAt'>) => {
    if (isFavorite(apartment.id)) {
      removeFromFavorites(apartment.id);
    } else {
      addToFavorites(apartment);
    }
  };

  // Проверить, находится ли квартира в избранном
  const isFavorite = (apartmentId: string) => {
    return favorites.some(fav => fav.id === apartmentId);
  };

  // Получить избранные квартиры, отсортированные по дате добавления (новые сначала)
  const getFavorites = () => {
    return [...favorites].sort((a, b) => b.addedAt - a.addedAt);
  };

  // Получить избранные квартиры по проекту
  const getFavoritesForProject = (id: string) => {
    return [...favorites]
      .filter(fav => fav.project_id === id)
      .sort((a, b) => b.addedAt - a.addedAt);
  };

  // Очистить все избранные
  const clearFavorites = () => {
    setFavorites([]);
    saveFavoritesToStorage([]);
  };

  return {
    favorites: getFavorites(),
    favoritesForProject: projectId ? getFavoritesForProject(projectId) : undefined,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoritesCount: projectId
      ? favorites.filter(fav => fav.project_id === projectId).length
      : favorites.length
  };
};
