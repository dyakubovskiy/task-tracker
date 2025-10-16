import type { Ref } from 'vue'
import type { IssueSuggest } from '../api'

import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { searchIssues } from '../api'

interface UseIssueSearch {
  searchQuery: Ref<string>
  suggestions: Ref<Array<IssueSuggest>>
  isSearching: Ref<boolean>
  primaryQueue: Ref<string | null>
  username: Ref<string | null>
  selectIssue: (issue: IssueSuggest) => void
  clearSearch: () => void
  setPrimaryQueue: (queue: string | null) => void
  setUsername: (name: string | null) => void
}

export const useIssueSearch = (): UseIssueSearch => {
  const searchQuery: Ref<string> = ref('')
  const suggestions: Ref<Array<IssueSuggest>> = ref([])
  const isSearching: Ref<boolean> = ref(false)
  const primaryQueue: Ref<string | null> = ref(null)
  const username: Ref<string | null> = ref(null)

  const performSearch = async (query: string): Promise<void> => {
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      suggestions.value = []
      isSearching.value = false
      return
    }

    isSearching.value = true
    suggestions.value = []

    try {
      const results = await searchIssues({
        input: query.trim(),
        queue: primaryQueue.value ?? undefined,
        username: username.value ?? undefined
      })
      suggestions.value = results
    } catch (error) {
      console.error('Search error:', error)
      suggestions.value = []
    } finally {
      isSearching.value = false
    }
  }

  const debouncedSearch = useDebounceFn(performSearch, 300)

  watch(searchQuery, (newQuery) => {
    if (!newQuery || typeof newQuery !== 'string' || newQuery.trim().length < 2) {
      suggestions.value = []
      isSearching.value = false
      return
    }
    isSearching.value = true
    debouncedSearch(newQuery)
  })

  const selectIssue: UseIssueSearch['selectIssue'] = (issue) => {
    searchQuery.value = issue.key
    suggestions.value = []
    isSearching.value = false
  }

  const clearSearch: UseIssueSearch['clearSearch'] = () => {
    searchQuery.value = ''
    suggestions.value = []
    isSearching.value = false
  }

  const setPrimaryQueue: UseIssueSearch['setPrimaryQueue'] = (queue) => {
    primaryQueue.value = queue
  }

  const setUsername: UseIssueSearch['setUsername'] = (name) => {
    username.value = name
  }

  return {
    searchQuery,
    suggestions,
    isSearching,
    primaryQueue,
    username,
    selectIssue,
    clearSearch,
    setPrimaryQueue,
    setUsername
  }
}
