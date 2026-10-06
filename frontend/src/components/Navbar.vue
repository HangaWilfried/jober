<script setup lang="ts">
import { useRoute } from 'vue-router';
import BrandLink from './navigation/BrandLink.vue';
import PrimaryNavigation from './navigation/PrimaryNavigation.vue';

const route = useRoute();
</script>

<template>
  <header class="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <BrandLink />
      <PrimaryNavigation :current-path="route.path" />
    </div>
  </header>
</template>
