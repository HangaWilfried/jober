<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { Sparkles } from 'lucide-vue-next';
</script>

<template>
  <RouterLink to="/" class="flex items-center gap-2.5 group">
    <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
      <Sparkles class="w-5 h-5" />
    </div>
    <div>
      <span class="text-xl font-bold tracking-tight text-white">Jober</span>
      <span class="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Human-in-the-Loop</span>
    </div>
  </RouterLink>
</template>
