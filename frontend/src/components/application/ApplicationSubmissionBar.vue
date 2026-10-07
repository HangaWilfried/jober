<script setup lang="ts">
import { Send } from 'lucide-vue-next';

defineProps<{
  canSubmit: boolean;
  unresolvedCount: number;
  submitting: boolean;
  manualSubmissionUrl: string | null;
  manualSubmissionReason: string | null;
}>();

const emit = defineEmits<{
  submit: [];
  submitManual: [];
}>();
</script>

<template>
  <div class="sticky bottom-4 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
    <div class="text-xs text-slate-300 flex items-center gap-2">
      <div
        class="w-2.5 h-2.5 rounded-full"
        :class="canSubmit ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'"
      ></div>
      <span v-if="manualSubmissionReason" class="text-amber-300">
        {{ manualSubmissionReason }}
      </span>
      <span v-else-if="!canSubmit">
        {{ unresolvedCount > 0 ? `Veuillez résoudre les ${unresolvedCount} bloqueurs ci-dessus avant soumission.` : 'Complétez et vérifiez les documents et réponses ci-dessus avant de continuer.' }}
      </span>
      <span v-else class="text-emerald-400 font-medium">
        Aucun bloqueur restant. Envoyez la candidature sur le site de recrutement, puis confirmez-le ici.
      </span>
    </div>

    <button
      @click="emit('submit')"
      :disabled="!canSubmit || submitting"
      class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
    >
      <Send class="w-4 h-4" />
      <span>{{ submitting ? 'Vérification et envoi...' : 'Automatiser la candidature' }}</span>
    </button>

    <div v-if="manualSubmissionUrl" class="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
      <a
        :href="manualSubmissionUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
      >
        Ouvrir le formulaire du recruteur
      </a>
      <button
        type="button"
        @click="emit('submitManual')"
        :disabled="!canSubmit || submitting"
        class="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-amber-500/40 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40 text-xs font-medium"
      >
        J’ai envoyé la candidature manuellement
      </button>
    </div>

    <button
      v-else
      type="button"
      @click="emit('submitManual')"
      :disabled="!canSubmit || submitting"
      class="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 text-xs font-medium"
    >
      J’ai envoyé la candidature manuellement
    </button>
  </div>
</template>
