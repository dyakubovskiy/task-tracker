<template>
  <svg class="icon">
    <use :xlink:href="`/sprite.svg#${iconId}`" />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  iconId: string
}

defineProps<Props>()
</script>

<style scoped>
.icon {
  display: inline-block;
  width: 2.4rem;
  height: 2.4rem;
  fill: currentColor;
}
</style>
