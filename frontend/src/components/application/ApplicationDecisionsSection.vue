<script setup lang="ts">
import type { ApplicationBlocker, PreparedAnswer } from '../../types';
import { Loader2, MessageSquare, ShieldAlert, Wand2 } from 'lucide-vue-next';

defineProps<{
  blockers: ApplicationBlocker[];
  preparedAnswers: PreparedAnswer[];
  responses: Record<string, string>;
  suggestingAnswer: Record<string, boolean>;
}>();

const emit = defineEmits<{
  updateResponses: [responses: Record<string, string>];
  suggestAnswer: [blockerId: string];
  resolveBlocker: [blockerId: string];
}>();
</script>

<template>
  <div class="lg:col-span-7 space-y-6">
    <section class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-white flex items-center gap-2">
          <ShieldAlert class="w-5 h-5 text-amber-400" />
          <span>Points de décision humaine</span>
        </h2>
        <span
          class="text-xs px-2.5 py-0.5 rounded-full font-medium"
          :class="blockers.some(blocker => !blocker.resolved) ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'"
        >
          {{ blockers.filter(blocker => !blocker.resolved).length > 0 ? `${blockers.filter(blocker => !blocker.resolved).length} bloquant(s)` : 'Tous résolus ✓' }}
        </span>
      </div>

      <p class="text-xs text-slate-400">
        Conformément à la règle de sécurité, l'IA ne soumet jamais de réponse subjective ou d'information sensible sans votre validation explicite.
      </p>

      <div class="space-y-4 pt-2">
        <div
          v-for="blocker in blockers"
          :key="blocker.id"
          class="p-4 rounded-lg border transition-all"
          :class="blocker.resolved ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-300' : 'bg-slate-950 border-amber-500/30'"
        >
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="text-sm font-medium text-white flex items-center gap-2">
              <span v-if="blocker.resolved" class="text-emerald-400 text-xs font-bold">✓ RÉSOLU</span>
              <span v-else class="text-amber-400 text-xs font-bold">! ACTION REQUISE</span>
              <span>{{ blocker.question }}</span>
            </div>
          </div>

          <div v-if="!blocker.resolved" class="space-y-3 mt-3">
            <div class="flex items-center justify-between">
              <span class="text-[11px] text-slate-400">Votre réponse pour ce recruteur :</span>
              <button
                type="button"
                @click="emit('suggestAnswer', blocker.id)"
                :disabled="suggestingAnswer[blocker.id]"
                class="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                <Loader2 v-if="suggestingAnswer[blocker.id]" class="w-3.5 h-3.5 animate-spin" />
                <Wand2 v-else class="w-3.5 h-3.5" />
                <span>Suggérer avec l'IA</span>
              </button>
            </div>

            <textarea
              :value="responses[blocker.id] || ''"
              @input="emit('updateResponses', { ...responses, [blocker.id]: ($event.target as HTMLTextAreaElement).value })"
              rows="3"
              placeholder="Saisissez votre réponse ici, ou cliquez sur 'Suggérer avec l'IA'..."
              class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            ></textarea>

            <button
              @click="emit('resolveBlocker', blocker.id)"
              class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
            >
              Valider cette réponse
            </button>
          </div>

          <div v-else class="mt-2 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded border border-slate-800">
            <span class="font-medium text-slate-300">Votre réponse :</span> {{ blocker.userResponse }}
          </div>
        </div>
      </div>
    </section>

    <section class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <h2 class="text-base font-semibold text-white flex items-center gap-2">
        <MessageSquare class="w-5 h-5 text-indigo-400" />
        <span>Questions préremplies par l'IA</span>
      </h2>

      <div class="space-y-3">
        <div
          v-for="(answer, index) in preparedAnswers"
          :key="index"
          class="bg-slate-950 border border-slate-800/80 rounded-lg p-3.5 flex items-center justify-between gap-4"
        >
          <div>
            <div class="text-xs text-slate-400 mb-1">{{ answer.question }}</div>
            <div class="text-sm font-semibold text-white">{{ answer.suggestedAnswer }}</div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              Confiance : {{ Math.round(answer.confidence * 100) }}%
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
