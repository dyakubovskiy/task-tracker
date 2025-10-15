<template>
  <RouterView />
  <ToastList />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { userModel } from '@/entities/user'
import { http } from '@/shared/api'
import { ToastList } from './ui/toast'

const { isUserAuthorized, getAuthUser, onAuthorize } = userModel()
onAuthorize(({ token }) => http.setToken(token))
onMounted(() => {
  if (isUserAuthorized.value) http.setToken(getAuthUser().token)
})
</script>
