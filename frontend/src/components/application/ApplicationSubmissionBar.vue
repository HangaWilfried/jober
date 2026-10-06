<script setup lang="ts">
import { Send } from 'lucide-vue-next';

defineProps<{
  canSubmit: boolean;
  unresolvedCount: number;
  submitting: boolean;
}>();

const emit = defineEmits<{
  submit: [];
}>();
</script>

<template>
  <div class="sticky bottom-4 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
    <div class="text-xs text-slate-300 flex items-center gap-2">
      <div
        class="w-2.5 h-2.5 rounded-full"
        :class="canSubmit ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'"
      ></div>
      <span v-if="!canSubmit">
        {{ unresolvedCount > 0 ? `Veuillez résoudre les ${unresolvedCount} bloqueurs ci-dessus avant soumission.` : 'Candidature déjà soumise.' }}
      </span>
      <span v-else class="text-emerald-400 font-medium">
        Dossier complet (Readiness 100%) ! Vous pouvez valider l'envoi.
      </span>
    </div>

    <button
      @click="emit('submit')"
      :disabled="!canSubmit || submitting"
      class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
    >
      <Send class="w-4 h-4" />
      <span>{{ submitting ? 'Transmission en cours...' : 'Valider et Transmettre la candidature' }}</span>
    </button>
  </div>
</template>
