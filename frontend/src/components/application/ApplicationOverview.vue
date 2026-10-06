<script setup lang="ts">
import type { Application } from '../../types';
import { CheckCircle } from 'lucide-vue-next';
import ScoreBadge from '../ScoreBadge.vue';

defineProps<{
  application: Application;
  successMessage: string | null;
}>();
</script>

<template>
  <section class="space-y-6">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
      <div>
        <div class="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-1">
          Vérification Human-in-the-Loop
        </div>
        <h1 class="text-2xl font-bold text-white mb-1">
          {{ application.jobTitle }}
        </h1>
        <p class="text-slate-400 text-sm">{{ application.company }}</p>
      </div>

      <div class="flex items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
        <ScoreBadge type="match" :score="application.matchScore" size="lg" />
        <ScoreBadge type="readiness" :score="application.readinessScore" size="lg" />
      </div>
    </div>

    <div
      v-if="application.submittedAt || successMessage"
      class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-300 text-sm flex items-center gap-3"
    >
      <CheckCircle class="w-5 h-5 flex-shrink-0" />
      <div>
        <p class="font-semibold">{{ successMessage || 'Candidature transmise avec succès !' }}</p>
        <p class="text-xs">Statut : {{ application.status }} — Enregistré en base SQLite</p>
      </div>
    </div>
  </section>
</template>
