<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import { userModel } from '@/entities/user'

const { user } = userModel()

const isSidebarOpen = ref(true)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<template>
  <div class="sidebar-layout">
    <!-- Sidebar -->
    <aside
      class="sidebar"
      :class="{ 'sidebar--closed': !isSidebarOpen }">
      <div class="sidebar__header">
        <div class="sidebar__logo">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <rect
              width="32"
              height="32"
              rx="8"
              fill="var(--color-accent)" />
            <path
              d="M16 8v16M8 16h16"
              stroke="white"
              stroke-width="2.5"
              stroke-linecap="round" />
          </svg>
          <span
            v-if="isSidebarOpen"
            class="sidebar__title"
            >TimeTracker</span
          >
        </div>
        <button
          class="sidebar__toggle"
          @click="toggleSidebar"
          :aria-label="isSidebarOpen ? 'Свернуть меню' : 'Развернуть меню'">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15 13l-5-5-5 5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              :transform="isSidebarOpen ? 'rotate(90 10 10)' : 'rotate(-90 10 10)'" />
          </svg>
        </button>
      </div>

      <nav class="sidebar__nav">
        <RouterLink
          to="/"
          class="nav-item">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 15H3.5C2.67 15 2 14.33 2 13.5V6.5C2 5.67 2.67 5 3.5 5H8M12 15h4.5c.83 0 1.5-.67 1.5-1.5V6.5c0-.83-.67-1.5-1.5-1.5H12M10 2v16"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
          <span
            v-if="isSidebarOpen"
            class="nav-item__text"
            >Табель</span
          >
        </RouterLink>
      </nav>

      <div class="sidebar__footer">
        <div class="user-card">
          <div class="user-card__avatar">
            {{ user?.name?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
          <div
            v-if="isSidebarOpen"
            class="user-card__info">
            <div class="user-card__name">{{ user?.name || 'Пользователь' }}</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <header class="header">
        <h1 class="header__title">Табель учёта рабочего времени</h1>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.sidebar-layout {
  display: flex;
  min-height: 100dvh;
  background-color: var(--color-bg);
}

.sidebar {
  width: 28rem;
  background-color: var(--color-surface);
  border-right: 0.1rem solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-emphasized);
  position: sticky;
  top: 0;
  height: 100dvh;
}

.sidebar--closed {
  width: 7.2rem;
}

.sidebar__header {
  padding: var(--spacing-24);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 0.1rem solid var(--color-border);
  min-height: 8rem;
}

.sidebar__logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-12);
}

.sidebar__title {
  font-size: 1.8rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  white-space: nowrap;
}

.sidebar__toggle {
  width: 3.2rem;
  height: 3.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  transition: all var(--transition-base);
}

.sidebar__toggle:hover {
  background-color: var(--color-surface-variant);
  color: var(--color-text-primary);
}

.sidebar__nav {
  flex: 1;
  padding: var(--spacing-16);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-12);
  padding: var(--spacing-12) var(--spacing-16);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  transition: all var(--transition-base);
  white-space: nowrap;
}

.nav-item:hover {
  background-color: var(--color-surface-variant);
  color: var(--color-text-primary);
}

.nav-item.router-link-active {
  background-color: var(--color-accent);
  color: #ffffff;
}

.nav-item__text {
  font-size: 1.5rem;
  font-weight: var(--font-weight-medium);
}

.sidebar__footer {
  padding: var(--spacing-24);
  border-top: 0.1rem solid var(--color-border);
}

.user-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-12);
}

.user-card__avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-strong));
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
}

.user-card__info {
  overflow: hidden;
}

.user-card__name {
  font-size: 1.4rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-card__email {
  font-size: 1.2rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  padding: var(--spacing-24) var(--spacing-32);
  background-color: var(--color-surface);
  border-bottom: 0.1rem solid var(--color-border);
  min-height: 8rem;
  display: flex;
  align-items: center;
}

.header__title {
  font-size: 2.4rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.content {
  flex: 1;
  padding: var(--spacing-32);
  overflow-y: auto;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 100;
    transform: translateX(0);
  }

  .sidebar--closed {
    transform: translateX(-100%);
    width: 28rem;
  }

  .main-content {
    margin-left: 0;
  }

  .header {
    padding: var(--spacing-16) var(--spacing-24);
  }

  .header__title {
    font-size: 2rem;
  }

  .content {
    padding: var(--spacing-24) var(--spacing-16);
  }
}
</style>
