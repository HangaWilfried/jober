<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { JobOffer } from '../types';
import ScoreBadge from './ScoreBadge.vue';
import { ExternalLink, MapPin, Building, ArrowRight } from 'lucide-vue-next';

defineProps<{
  job: JobOffer;
}>();
</script>

<template>
  <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm">
    <div>
      <!-- Header / Company & Badges -->
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

      <!-- Résumé de l'analyse IA -->
      <p v-if="job.analysis?.summary" class="text-xs text-slate-300 bg-slate-800/60 rounded-lg p-3 mb-4 border border-slate-700/50 leading-relaxed">
        {{ job.analysis.summary }}
      </p>

      <!-- Compétences requises / correspondances -->
      <div v-if="job.analysis" class="space-y-2 mb-4">
        <!-- Matching skills -->
        <div v-if="job.analysis.matchingSkills.length > 0" class="flex flex-wrap gap-1.5 items-center">
          <span class="text-[11px] font-medium text-slate-400 mr-1">Points forts :</span>
          <span
            v-for="skill in job.analysis.matchingSkills"
            :key="skill"
            class="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
          >
            ✓ {{ skill }}
          </span>
        </div>

        <!-- Missing skills -->
        <div v-if="job.analysis.missingSkills.length > 0" class="flex flex-wrap gap-1.5 items-center">
          <span class="text-[11px] font-medium text-slate-400 mr-1">À acquérir / vérifier :</span>
          <span
            v-for="skill in job.analysis.missingSkills"
            :key="skill"
            class="text-[11px] font-medium px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20"
          >
            ✗ {{ skill }}
          </span>
        </div>
      </div>
    </div>

    <!-- Footer & Actions -->
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
  </div>
</template>
