import type { Ref } from 'vue'
import { computed } from 'vue'

import { useStorage, createSharedComposable } from '@vueuse/core'

export interface FavoriteIssue {
  id: string
  key: string
  summary: string
}

const useFavoriteIssuesCore = () => {
  // Храним избранные задачи в localStorage
  const favoriteIssues: Ref<FavoriteIssue[]> = useStorage<FavoriteIssue[]>(
    'favorite-issues',
    [],
    localStorage,
    {
      serializer: {
        read: (v: string) => (v ? JSON.parse(v) : []),
        write: (v: FavoriteIssue[]) => JSON.stringify(v)
      }
    }
  )

  /**
   * Проверяет, находится ли задача в избранном
   */
  const isFavorite = (issueId: string): boolean => {
    return favoriteIssues.value.some((issue) => issue.id === issueId)
  }

  /**
   * Добавляет задачу в избранное
   */
  const addToFavorites = (issue: FavoriteIssue): void => {
    if (!isFavorite(issue.id)) {
      favoriteIssues.value = [...favoriteIssues.value, issue]
    }
  }

  /**
   * Удаляет задачу из избранного
   */
  const removeFromFavorites = (issueId: string): void => {
    favoriteIssues.value = favoriteIssues.value.filter((issue) => issue.id !== issueId)
  }

  /**
   * Переключает статус избранного (добавляет или удаляет)
   */
  const toggleFavorite = (issue: FavoriteIssue): void => {
    if (isFavorite(issue.id)) {
      removeFromFavorites(issue.id)
    } else {
      addToFavorites(issue)
    }
  }

  /**
   * Очищает все избранные задачи
   */
  const clearFavorites = (): void => {
    favoriteIssues.value = []
  }

  /**
   * Количество избранных задач
   */
  const favoritesCount = computed(() => favoriteIssues.value.length)

  return {
    favoriteIssues,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    clearFavorites,
    favoritesCount
  }
}

// Создаём shared composable, чтобы состояние было общим для всех компонентов
export const useFavoriteIssues = createSharedComposable(useFavoriteIssuesCore)
