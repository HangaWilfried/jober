<script setup lang="ts">
import { ref } from 'vue';
import { useJobsStore } from '../../stores/jobs';
import { Loader2, Sparkles, X } from 'lucide-vue-next';

const open = defineModel<boolean>('open', { required: true });
const jobsStore = useJobsStore();

const newJobForm = ref({
  title: '',
  company: '',
  location: '',
  remoteType: 'hybrid',
  url: '',
  description: ''
});

async function handleSubmit() {
  const form = newJobForm.value;
  const created = await jobsStore.analyzeNewJob({
    title: form.title,
    company: form.company,
    location: form.location || 'Paris, France',
    remoteType: form.remoteType,
    url: form.url,
    description: form.description
  });

  if (created) {
    open.value = false;
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
  <div
    v-if="open"
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
          @click="open = false"
          class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
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
            <label class="block text-xs font-semibold text-slate-300 mb-1">Lien de l'offre (URL) *</label>
            <input
              v-model="newJobForm.url"
              required
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
            @click="open = false"
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
</template>
