<template>
  <div class="success-info">
    <SuccessIcon class="mb-4" />
    <slot />
  </div>
</template>

<script setup lang="ts">
import SuccessIcon from '@/components/SuccessIcon.vue';
</script>

<style scoped lang="postcss">
.success-info {
  @apply flex flex-col items-center;
  margin-top: 5vw;
}
</style>
