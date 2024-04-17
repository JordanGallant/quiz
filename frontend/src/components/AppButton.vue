<template>
  <button
    class="btn"
    type="button"
    :class="{
      'btn-primary': variant === 'primary',
      'btn-secondary': variant === 'secondary',
      'btn-tertiary': variant === 'tertiary',
      'btn-danger': variant === 'danger',
      'btn-choice': variant === 'choice',
      'btn-small': size === 'small',
    }"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant: 'primary' | 'secondary' | 'danger' | 'choice' | 'tertiary';
  size?: 'default' | 'small';
}>();
</script>

<style scoped lang="postcss">
.btn {
  @apply font-normal text-lg py-3 px-8 capitalize;
}

.btn-small {
  @apply font-normal py-1 px-2 text-base;
}

.btn:not(.btn-choice):not(.btn-tertiary):disabled {
  @apply cursor-not-allowed bg-gray-500;
}

.btn-primary {
  @apply bg-secondary text-black border-black;
  border-width: 3px;
}

.btn-secondary {
  @apply bg-primary text-white border-white;
  border-width: 3px;
}

.btn-danger {
  @apply bg-red-500 text-white;
}

.btn-tertiary {
  @apply bg-transparent text-mediumDark px-0;
}

.btn-choice {
  @apply bg-white border-primary text-black;
  border-width: 3px;
  border-style: solid;
  box-shadow: 0 7px 7px 0 rgba(0, 0, 0, 0.17);
}

.btn-choice:hover {
  @apply bg-secondary text-white border-white;
}

.btn-choice.selected {
  @apply bg-primaryMedium border-black text-white;
}

.btn-choice.voted {
  @apply text-black;
  border: 3px solid #4cd4a9;
  background: #e8faf3;
}

.btn-choice:disabled {
  @apply border-gray-400 text-gray-400;
}
</style>
