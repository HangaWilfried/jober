<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { Briefcase, Sliders } from 'lucide-vue-next';

defineProps<{
  currentPath: string;
}>();
</script>

<template>
  <nav class="flex items-center gap-1 sm:gap-2">
    <RouterLink
      to="/"
      class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
      :class="currentPath === '/' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'"
    >
      <Briefcase class="w-4 h-4" />
      <span>Offres & Matchs</span>
    </RouterLink>

    <RouterLink
      to="/profile"
      class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
      :class="currentPath === '/profile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'"
    >
      <Sliders class="w-4 h-4" />
      <span>Profil & Critères</span>
    </RouterLink>
  </nav>
</template>
