<script setup lang="ts">
import type { SearchPreferences } from '../../types';
import { Briefcase } from 'lucide-vue-next';

defineProps<{
  preferences: SearchPreferences;
}>();
</script>

<template>
  <section class="bg-slate-900 border border-slate-800 rounded-xl p-6">
    <h2 class="text-base font-semibold text-white flex items-center gap-2 mb-4">
      <Briefcase class="w-5 h-5 text-indigo-400" />
      <span>Critères de Recherche & Filtrage</span>
    </h2>

    <div class="space-y-4 text-sm">
      <div>
        <span class="text-xs text-slate-500 block mb-1">Postes ciblés</span>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="title in preferences.targetTitles"
            :key="title"
            class="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium"
          >
            {{ title }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div>
          <span class="text-xs text-slate-500 block mb-0.5">Politique de télétravail</span>
          <span class="text-slate-200 capitalize font-medium">{{ preferences.remote }}</span>
        </div>
        <div>
          <span class="text-xs text-slate-500 block mb-0.5">Salaire brut minimum</span>
          <span class="text-slate-200 font-medium">{{ preferences.minSalary?.toLocaleString('fr-FR') }} € / an</span>
        </div>
      </div>
    </div>
  </section>
</template>
