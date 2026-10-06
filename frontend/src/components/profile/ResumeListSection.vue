<script setup lang="ts">
import type { ResumeItem } from '../../types';
import { FileText, Star, Trash2 } from 'lucide-vue-next';

defineProps<{
  resumes: ResumeItem[];
}>();

const emit = defineEmits<{
  setPrimary: [id: string];
  delete: [id: string];
}>();
</script>

<template>
  <section class="bg-slate-900 border border-slate-800 rounded-xl p-6">
    <h2 class="text-base font-semibold text-white flex items-center gap-2 mb-4">
      <FileText class="w-5 h-5 text-indigo-400" />
      <span>Vos CVs Enregistrés en Base</span>
    </h2>

    <div v-if="resumes.length === 0" class="text-xs text-slate-500 py-4 text-center">
      Aucun CV importé pour l'instant. Uploadez votre premier CV ci-dessus.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="resume in resumes"
        :key="resume.id"
        class="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <FileText class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-white">{{ resume.name }}</p>
              <span
                v-if="resume.isPrimary"
                class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >
                Principal (Matching par défaut)
              </span>
            </div>
            <p class="text-[11px] text-slate-500">
              Enregistré le {{ new Date(resume.updatedAt).toLocaleDateString('fr-FR') }} à {{ new Date(resume.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-center">
          <button
            v-if="!resume.isPrimary"
            @click="emit('setPrimary', resume.id)"
            class="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Définir comme CV principal"
          >
            <Star class="w-3.5 h-3.5 text-amber-400" />
            <span>Définir principal</span>
          </button>

          <button
            @click="emit('delete', resume.id)"
            class="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Supprimer ce CV"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
