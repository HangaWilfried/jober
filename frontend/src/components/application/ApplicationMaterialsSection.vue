<script setup lang="ts">
import type { ApplicationPreparedData } from '../../types';
import { FileText, Save, Sparkles, Wand2 } from 'lucide-vue-next';

const props = defineProps<{
  preparedData: ApplicationPreparedData;
}>();

const coverLetter = defineModel<string>('coverLetter', { required: true });
const customizedResumeContent = defineModel<string>('customizedResumeContent', { required: true });

const emit = defineEmits<{
  regenerate: [];
  save: [];
  confirmCoverLetter: [];
  saveResume: [];
  confirmResume: [];
  selectResume: [resumeId: string];
}>();

function downloadCustomizedResume() {
  const blob = new Blob([customizedResumeContent.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `CV-adapte-${props.preparedData.selectedResume?.name || 'candidature'}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="lg:col-span-5 space-y-6">
    <section class="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 class="text-base font-semibold text-white flex items-center gap-2 mb-3">
        <FileText class="w-5 h-5 text-indigo-400" />
        <span>CV adapté à l'offre</span>
      </h2>

      <div class="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-white">
            {{ props.preparedData.selectedResume?.name || 'Aucun CV sélectionné' }}
          </p>
          <p class="text-[10px] text-slate-500">CV source — le contenu original n'est pas modifié.</p>
        </div>
      </div>

      <label v-if="props.preparedData.availableResumes.length" class="block mt-3">
        <span class="text-xs font-medium text-slate-400">Choisir le CV pour cette candidature</span>
        <select
          :value="props.preparedData.selectedResume?.id || ''"
          @change="emit('selectResume', ($event.target as HTMLSelectElement).value)"
          class="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="" disabled>Choisir un CV analysé</option>
          <option v-for="resume in props.preparedData.availableResumes" :key="resume.id" :value="resume.id">
            {{ resume.name }}{{ resume.isPrimary ? ' (principal)' : '' }}
          </option>
        </select>
      </label>
      <p v-else class="mt-3 text-xs text-amber-300">
        Aucun CV avec texte analysable n'est disponible. Ajoutez un CV depuis votre profil.
      </p>

      <div class="mt-3 space-y-1.5">
        <p class="text-xs font-medium text-slate-400">Mises en valeur ciblées :</p>
        <ul class="text-xs text-slate-300 space-y-1 list-disc list-inside">
          <li v-for="(highlight, index) in props.preparedData.customizedHighlights" :key="index">
            {{ highlight }}
          </li>
        </ul>
      </div>

      <textarea
        v-model="customizedResumeContent"
        rows="12"
        aria-label="Contenu du CV adapté à l'offre"
        class="mt-3 w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500"
        placeholder="Sélectionnez un CV analysé pour préparer une version à adapter."
      ></textarea>
      <p v-if="!customizedResumeContent.trim()" class="text-xs text-amber-300">
        Cette version doit être préparée manuellement à partir du CV sélectionné avant toute automatisation.
      </p>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          @click="emit('saveResume')"
          class="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
        >
          Sauvegarder le CV adapté
        </button>
        <button
          type="button"
          :disabled="!customizedResumeContent.trim() || props.preparedData.customizedResumeConfirmed"
          @click="emit('confirmResume')"
          class="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-colors"
        >
          {{ props.preparedData.customizedResumeConfirmed ? 'CV confirmé' : 'Confirmer le CV' }}
        </button>
        <button
          type="button"
          @click="downloadCustomizedResume"
          :disabled="!customizedResumeContent.trim()"
          class="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
        >
          Télécharger en .txt
        </button>
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
            :disabled="!coverLetter.trim() || props.preparedData.coverLetterConfirmed"
            @click="emit('confirmCoverLetter')"
            class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 text-emerald-300 border border-emerald-500/20 transition-colors"
          >
            {{ props.preparedData.coverLetterConfirmed ? 'Lettre confirmée' : 'Confirmer la lettre' }}
          </button>
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
