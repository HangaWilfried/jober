<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next';

defineProps<{
  skills: string[];
}>();
</script>

<template>
  <section class="bg-slate-900 border border-slate-800 rounded-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-semibold text-white flex items-center gap-2">
        <CheckCircle2 class="w-5 h-5 text-emerald-400" />
        <span>Compétences Détectées & Indexées</span>
      </h2>
      <span class="text-xs text-slate-400">{{ skills.length }} compétences</span>
    </div>

    <div class="flex flex-wrap gap-2">
      <span
        v-for="skill in skills"
        :key="skill"
        class="px-2.5 py-1 rounded-lg bg-slate-850 text-slate-200 text-xs font-medium border border-slate-700/60"
      >
        {{ skill }}
      </span>
    </div>
  </section>
</template>
