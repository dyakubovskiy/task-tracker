<template>
  <RouterView />
  <ToastList />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { userModel } from '@/entities/user'
import { http } from '@/shared/api'
import { ToastList } from './ui/toast'

const { user } = userModel()
const { setToken, resetToken } = http

watch(
  user,
  (userData) => {
    if (userData) setToken(userData.token)
    else resetToken()
  },
  { immediate: true }
)
</script>
