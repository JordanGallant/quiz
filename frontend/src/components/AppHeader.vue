<script setup lang="ts">
</script>

<template>
  <header class="">
    <nav class="bg-primaryMedium border-gray-200 p-2 xl:py-4 xl:px-0">
      <div class="flex flex-wrap justify-between items-center mx-auto max-w-screen-md">
        <RouterLink to="/">
          <img src="@/assets/images/logo.svg" class="h-6 sm:h-9" alt="Oasis logo" />
        </RouterLink>
        <a href="https://ethdam.com">
          <img src="@/assets/images/logo-ethdam.png" class="h-6 sm:h-9" alt="RTK logo" />
        </a>
      </div>
    </nav>
    <p class="text-white text-right mt-3 mr-3">
      Problems, questions, compliments?<br/>
      Contact us on <a href="https://oasis.io/discord" target="_blank">Discord</a>! 🎉
    </p>
  </header>
</template>

<style lang="postcss" scoped></style>
