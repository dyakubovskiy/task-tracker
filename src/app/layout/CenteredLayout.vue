<template>
  <main class="layout">
    <div class="content">
      <RouterView />
    </div>
  </main>
</template>

<style scoped>
.layout {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-32);
  min-height: 100dvh;
  background-color: var(--color-bg);
}

.content {
  width: 100%;
  max-width: 52rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background-color: transparent;
  gap: var(--spacing-24);
  padding: var(--spacing-32);
}

@media (max-width: 768px) {
  .layout {
    padding: var(--spacing-16);
  }

  .content {
    max-width: 100%;
  }
}
</style>
