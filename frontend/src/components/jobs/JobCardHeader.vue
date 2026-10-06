<script setup lang="ts">
import type { JobOffer } from '../../types';
import { Building, MapPin } from 'lucide-vue-next';
import ScoreBadge from '../ScoreBadge.vue';

defineProps<{
  job: JobOffer;
}>();
</script>

<template>
  <div class="flex items-start justify-between gap-3 mb-3">
    <div>
      <div class="flex items-center gap-2 text-xs text-slate-400 mb-1">
        <span class="inline-flex items-center gap-1 font-medium text-slate-300">
          <Building class="w-3.5 h-3.5" />
          {{ job.company }}
        </span>
        <span>•</span>
        <span class="inline-flex items-center gap-1">
          <MapPin class="w-3.5 h-3.5" />
          {{ job.location }}
        </span>
      </div>
      <h3 class="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
        {{ job.title }}
      </h3>
    </div>

    <div v-if="job.analysis">
      <ScoreBadge type="match" :score="job.analysis.matchScore" size="md" />
    </div>
  </div>
</template>
