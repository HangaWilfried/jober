<script setup lang="ts">
import type { JobOffer } from '../../types';
import { RouterLink } from 'vue-router';
import { ArrowRight, ExternalLink } from 'lucide-vue-next';

defineProps<{
  job: JobOffer;
}>();
</script>

<template>
  <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
    <div class="flex items-center gap-2">
      <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
        {{ job.source }}
      </span>
      <span class="capitalize">{{ job.remoteType }}</span>
    </div>

    <div class="flex items-center gap-2">
      <a
        :href="job.url"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
      >
        <span>Voir l'offre</span>
        <ExternalLink class="w-3.5 h-3.5" />
      </a>

      <RouterLink
        v-if="job.applicationId"
        :to="`/review/${job.applicationId}`"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm shadow-indigo-600/30"
      >
        <span>Préparation & Revue</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </RouterLink>
    </div>
  </div>
</template>
