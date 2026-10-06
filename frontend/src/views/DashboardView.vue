<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useJobsStore } from '../stores/jobs';
import JobCard from '../components/JobCard.vue';
import {
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  PlusCircle,
  Sparkles,
  X,
  Loader2,
  Check
} from 'lucide-vue-next';

const jobsStore = useJobsStore();
const showAddModal = ref(false);

const newJobForm = ref({
  title: '',
  company: '',
  location: '',
  remoteType: 'hybrid',
  url: '',
  description: ''
});

onMounted(() => {
  jobsStore.fetchJobs();
});

async function handleAnalyzeSubmit() {
  if (!newJobForm.value.title || !newJobForm.value.company || !newJobForm.value.description) {
    return;
  }

  const created = await jobsStore.analyzeNewJob({
    title: newJobForm.value.title,
    company: newJobForm.value.company,
    location: newJobForm.value.location || 'Paris, France',
    remoteType: newJobForm.value.remoteType,
    url: newJobForm.value.url || 'https://example.com',
    description: newJobForm.value.description
  });

  if (created) {
    showAddModal.value = false;
    newJobForm.value = {
      title: '',
      company: '',
      location: '',
      remoteType: 'hybrid',
      url: '',
      description: ''
    };
  }
}
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Top banner / intro -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1.5">
            <Sparkles class="w-3.5 h-3.5" />
            Moteur de Matching IA
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Assistant de Recherche d'Emploi
        </h1>
        <p class="text-slate-400 text-sm max-w-2xl leading-relaxed">
          Analysez instantanément n'importe quelle offre d'emploi. L'IA compare la description avec votre profil stocké en base SQLite et calcule votre
          <strong class="text-indigo-300">Match Score réel</strong>.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          @click="showAddModal = true"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30 whitespace-nowrap cursor-pointer"
        >
          <PlusCircle class="w-4 h-4" />
          <span>Analyser une offre</span>
        </button>

        <button
          @click="jobsStore.triggerCollect"
          :disabled="jobsStore.loading"
          class="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-all whitespace-nowrap cursor-pointer border border-slate-700"
          title="Synchroniser"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': jobsStore.loading }" />
        </button>
      </div>
    </div>

    <!-- Success Message -->
    <div
      v-if="jobsStore.successMessage"
      class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-300 text-sm flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2">
        <Check class="w-5 h-5 flex-shrink-0" />
        <span>{{ jobsStore.successMessage }}</span>
      </div>
      <button @click="jobsStore.successMessage = null" class="text-emerald-400 hover:text-emerald-200">
        <X class="w-4 h-4" />
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
        <p class="font-semibold">Information :</p>
        <p class="text-xs">{{ jobsStore.error }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="jobsStore.loading && jobsStore.jobs.length === 0" class="text-center py-16">
      <RefreshCw class="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
      <p class="text-slate-400 text-sm">Chargement des offres en base SQLite...</p>
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
      <p class="text-xs text-slate-400 max-w-sm mx-auto mb-4">
        Ajoutez une nouvelle offre ci-dessus ou modifiez vos filtres de recherche.
      </p>
      <button
        @click="showAddModal = true"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
      >
        <PlusCircle class="w-3.5 h-3.5" />
        <span>Analyser une offre maintenant</span>
      </button>
    </div>

    <!-- Modal d'analyse manuelle -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Sparkles class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">Analyser une Offre d'Emploi</h2>
              <p class="text-xs text-slate-400">Collez les détails de l'annonce pour calculer le Match Score</p>
            </div>
          </div>
          <button
            @click="showAddModal = false"
            class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleAnalyzeSubmit" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Titre du poste *</label>
              <input
                v-model="newJobForm.title"
                required
                type="text"
                placeholder="ex: Senior Fullstack Vue / Node"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Entreprise *</label>
              <input
                v-model="newJobForm.company"
                required
                type="text"
                placeholder="ex: Voodoo, Doctolib, Startup..."
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Localisation</label>
              <input
                v-model="newJobForm.location"
                type="text"
                placeholder="ex: Paris / Remote"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Télétravail</label>
              <select
                v-model="newJobForm.remoteType"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="full">Full Remote (100%)</option>
                <option value="hybrid">Hybride</option>
                <option value="on-site">Présentiel</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Lien de l'offre (URL)</label>
              <input
                v-model="newJobForm.url"
                type="url"
                placeholder="https://..."
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">
              Description complète de l'offre *
            </label>
            <textarea
              v-model="newJobForm.description"
              required
              rows="6"
              placeholder="Collez ici le texte intégral de l'annonce (missions, profil recherché, stack technique, prérequis)..."
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="showAddModal = false"
              class="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              :disabled="jobsStore.analyzing"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Loader2 v-if="jobsStore.analyzing" class="w-4 h-4 animate-spin" />
              <Sparkles v-else class="w-4 h-4" />
              <span>{{ jobsStore.analyzing ? 'Analyse Gemini en cours...' : 'Lancer l analyse IA & Enregistrer' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
