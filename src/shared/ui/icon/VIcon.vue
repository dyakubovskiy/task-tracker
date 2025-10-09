<template>
  <svg class="icon">
    <use :xlink:href="`/sprite.svg#${iconId}`" />
  </svg>
</template>

<script setup lang="ts">
export interface IconProps {
  iconId: string
}

defineProps<IconProps>()
</script>

<style scoped>
.icon {
  display: inline-block;
  width: 2.4rem;
  height: 2.4rem;
  fill: currentColor;
}
</style>
