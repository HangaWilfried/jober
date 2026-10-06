<script setup lang="ts">
import { PlusCircle, RefreshCw, Sparkles } from 'lucide-vue-next';

defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  analyze: [];
  sync: [];
}>();
</script>

<template>
  <section class="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
        @click="emit('analyze')"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30 whitespace-nowrap cursor-pointer"
      >
        <PlusCircle class="w-4 h-4" />
        <span>Analyser une offre</span>
      </button>

      <button
        @click="emit('sync')"
        :disabled="loading"
        class="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-all whitespace-nowrap cursor-pointer border border-slate-700"
        title="Synchroniser"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
      </button>
    </div>
  </section>
</template>
