<script setup lang="ts">
import { onMounted } from 'vue';
import { useJobsStore } from '../stores/jobs';
import JobCard from '../components/JobCard.vue';
import { RefreshCw, Search, Filter, AlertCircle } from 'lucide-vue-next';

const jobsStore = useJobsStore();

onMounted(() => {
  jobsStore.fetchJobs();
});
</script>

<template>
  <div class="space-y-8">
    <!-- Top banner / intro -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Assistant de Recherche d'Emploi
        </h1>
        <p class="text-slate-400 text-sm max-w-2xl leading-relaxed">
          L'application surveille les plateformes, extrait les compétences, calcule le
          <strong class="text-indigo-300">Match Score</strong> et prépare vos dossiers.
          Vous intervenez uniquement pour valider les décisions clés.
        </p>
      </div>

      <button
        @click="jobsStore.triggerCollect"
        :disabled="jobsStore.loading"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20 whitespace-nowrap cursor-pointer"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': jobsStore.loading }" />
        <span>Synchroniser les offres</span>
      </button>
    </div>

    <!-- Filters & Search Bar -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
      <!-- Search Input -->
      <div class="relative w-full md:w-80">
        <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          v-model="jobsStore.searchQuery"
          type="text"
          placeholder="Rechercher par titre, entreprise, techno..."
          class="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <!-- Filters right -->
      <div class="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
        <!-- Min match filter -->
        <div class="flex items-center gap-2 text-xs text-slate-300">
          <span>Score min :</span>
          <select
            v-model.number="jobsStore.filterMinMatch"
            class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option :value="0">Tous (0%+)</option>
            <option :value="70">≥ 70% (Pertinent)</option>
            <option :value="85">≥ 85% (Forte adéquation)</option>
            <option :value="90">≥ 90% (Match Idéal)</option>
          </select>
        </div>

        <!-- Status filter -->
        <div class="flex items-center gap-2 text-xs text-slate-300">
          <span>Statut :</span>
          <select
            v-model="jobsStore.filterStatus"
            class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="analyzed">Analysées</option>
            <option value="rejected">Non retenues</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Error message if backend not reached -->
    <div v-if="jobsStore.error" class="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm flex items-center gap-3">
      <AlertCircle class="w-5 h-5 flex-shrink-0" />
      <div>
        <p class="font-semibold">Connexion au serveur :</p>
        <p class="text-xs">{{ jobsStore.error }} (Assurez-vous que le backend tourne sur le port 3001)</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="jobsStore.loading && jobsStore.jobs.length === 0" class="text-center py-16">
      <RefreshCw class="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
      <p class="text-slate-400 text-sm">Chargement et analyse des offres en cours...</p>
    </div>

    <!-- Jobs Grid -->
    <div v-else-if="jobsStore.filteredJobs.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <JobCard
        v-for="job in jobsStore.filteredJobs"
        :key="job.id"
        :job="job"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl p-8">
      <Filter class="w-10 h-10 text-slate-600 mx-auto mb-3" />
      <h3 class="text-base font-semibold text-slate-200 mb-1">Aucune offre ne correspond à ces critères</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        Modifiez les filtres de score ou de statut pour afficher davantage de résultats.
      </p>
    </div>
  </div>
</template>
