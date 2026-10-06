<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { Briefcase, Sparkles, Sliders } from 'lucide-vue-next';

const route = useRoute();
</script>

<template>
  <header class="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Logo & Brand -->
      <RouterLink to="/" class="flex items-center gap-2.5 group">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
          <Sparkles class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xl font-bold tracking-tight text-white">Jober</span>
          <span class="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Human-in-the-Loop</span>
        </div>
      </RouterLink>

      <!-- Navigation links -->
      <nav class="flex items-center gap-1 sm:gap-2">
        <RouterLink
          to="/"
          class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="route.path === '/' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'"
        >
          <Briefcase class="w-4 h-4" />
          <span>Offres & Matchs</span>
        </RouterLink>

        <RouterLink
          to="/profile"
          class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="route.path === '/profile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'"
        >
          <Sliders class="w-4 h-4" />
          <span>Profil & Critères</span>
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
