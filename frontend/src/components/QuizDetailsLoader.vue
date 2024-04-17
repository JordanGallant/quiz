<template>
  <ContentLoader viewBox="0 0 768 124" :speed="2" primaryColor="white" secondaryColor="#e3e3e3">
    <rect x="5" y="10" rx="3" ry="3" width="361" height="28" />
    <rect x="5" y="26" rx="3" ry="3" width="52" height="6" />
    <rect x="5" y="61" rx="3" ry="3" width="410" height="16" />
    <rect x="680" y="10" rx="0" ry="0" width="80" height="19" />
  </ContentLoader>
</template>

<script setup lang="ts">
import { ContentLoader } from 'vue-content-loader';
</script>

<style scoped lang="postcss"></style>
