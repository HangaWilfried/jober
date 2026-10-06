<script setup lang="ts">
import type { JobOffer } from '../../types';
import { Filter, PlusCircle, RefreshCw } from 'lucide-vue-next';
import JobCard from '../JobCard.vue';

defineProps<{
  loading: boolean;
  jobs: JobOffer[];
  filteredJobs: JobOffer[];
}>();

const emit = defineEmits<{
  analyze: [];
}>();
</script>

<template>
  <div v-if="loading && jobs.length === 0" class="text-center py-16">
    <RefreshCw class="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
    <p class="text-slate-400 text-sm">Chargement des offres en base SQLite...</p>
  </div>

  <div v-else-if="filteredJobs.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-5">
    <JobCard
      v-for="job in filteredJobs"
      :key="job.id"
      :job="job"
    />
  </div>

  <div v-else class="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl p-8">
    <Filter class="w-10 h-10 text-slate-600 mx-auto mb-3" />
    <h3 class="text-base font-semibold text-slate-200 mb-1">Aucune offre ne correspond à ces critères</h3>
    <p class="text-xs text-slate-400 max-w-sm mx-auto mb-4">
      Ajoutez une nouvelle offre ci-dessus ou modifiez vos filtres de recherche.
    </p>
    <button
      @click="emit('analyze')"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
    >
      <PlusCircle class="w-3.5 h-3.5" />
      <span>Analyser une offre maintenant</span>
    </button>
  </div>
</template>
