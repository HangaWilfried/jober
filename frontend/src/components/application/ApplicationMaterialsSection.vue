<script setup lang="ts">
import type { ApplicationPreparedData } from '../../types';
import { FileText, Save, Sparkles, Wand2 } from 'lucide-vue-next';

defineProps<{
  preparedData: ApplicationPreparedData;
}>();

const coverLetter = defineModel<string>('coverLetter', { required: true });

const emit = defineEmits<{
  regenerate: [];
  save: [];
}>();
</script>

<template>
  <div class="lg:col-span-5 space-y-6">
    <section class="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 class="text-base font-semibold text-white flex items-center gap-2 mb-3">
        <FileText class="w-5 h-5 text-indigo-400" />
        <span>CV Sélectionné</span>
      </h2>

      <div class="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-white">
            {{ preparedData.selectedResume?.name || 'CV par défaut' }}
          </p>
          <p class="text-[10px] text-slate-500">Sélectionné automatiquement depuis SQLite</p>
        </div>
        <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Adapté
        </span>
      </div>

      <div class="mt-3 space-y-1.5">
        <p class="text-xs font-medium text-slate-400">Mises en valeur ciblées :</p>
        <ul class="text-xs text-slate-300 space-y-1 list-disc list-inside">
          <li v-for="(highlight, index) in preparedData.customizedHighlights" :key="index">
            {{ highlight }}
          </li>
        </ul>
      </div>
    </section>

    <section class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-white flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-purple-400" />
          <span>Lettre de motivation</span>
        </h2>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('regenerate')"
            class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-colors cursor-pointer"
          >
            <Wand2 class="w-3.5 h-3.5" />
            <span>Ajuster avec l'IA</span>
          </button>

          <button
            @click="emit('save')"
            class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            <Save class="w-3.5 h-3.5" />
            <span>Sauvegarder</span>
          </button>
        </div>
      </div>

      <p class="text-xs text-slate-400">
        Générée pour s'aligner sur les exigences de l'offre. Vous pouvez la retoucher librement.
      </p>

      <textarea
        v-model="coverLetter"
        rows="13"
        class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500"
      ></textarea>
    </section>
  </div>
</template>
