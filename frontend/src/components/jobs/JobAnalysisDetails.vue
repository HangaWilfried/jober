<script setup lang="ts">
import type { JobAnalysis } from '../../types';

defineProps<{
  analysis: JobAnalysis;
}>();
</script>

<template>
  <div>
    <p v-if="analysis.summary" class="text-xs text-slate-300 bg-slate-800/60 rounded-lg p-3 mb-4 border border-slate-700/50 leading-relaxed">
      {{ analysis.summary }}
    </p>

    <div class="space-y-2 mb-4">
      <div v-if="analysis.matchingSkills.length > 0" class="flex flex-wrap gap-1.5 items-center">
        <span class="text-[11px] font-medium text-slate-400 mr-1">Points forts :</span>
        <span
          v-for="skill in analysis.matchingSkills"
          :key="skill"
          class="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
        >
          ✓ {{ skill }}
        </span>
      </div>

      <div v-if="analysis.missingSkills.length > 0" class="flex flex-wrap gap-1.5 items-center">
        <span class="text-[11px] font-medium text-slate-400 mr-1">À acquérir / vérifier :</span>
        <span
          v-for="skill in analysis.missingSkills"
          :key="skill"
          class="text-[11px] font-medium px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20"
        >
          ✗ {{ skill }}
        </span>
      </div>
    </div>
  </div>
</template>
