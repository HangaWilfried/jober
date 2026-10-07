<script setup lang="ts">
import { ref } from 'vue';
import { FileText, Loader2, UploadCloud } from 'lucide-vue-next';

defineProps<{
  uploading: boolean;
}>();

const emit = defineEmits<{
  upload: [file: File];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

function uploadFile(file: File | undefined) {
  if (file && /\.(pdf|txt)$/i.test(file.name)) {
    emit('upload', file);
  }
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  uploadFile(target.files?.[0]);
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  uploadFile(event.dataTransfer?.files[0]);
}
</script>

<template>
  <section class="bg-slate-900 border border-slate-800 rounded-xl p-6">
    <h2 class="text-base font-semibold text-white flex items-center gap-2 mb-3">
      <UploadCloud class="w-5 h-5 text-indigo-400" />
      <span>Importer un nouveau CV (PDF ou texte)</span>
    </h2>

    <div
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="fileInput?.click()"
      class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
      :class="isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-950/60'"
    >
      <input
        ref="fileInput"
        type="file"
        accept="application/pdf,text/plain,.txt"
        class="hidden"
        @change="handleFileChange"
      />

      <div v-if="uploading" class="flex flex-col items-center justify-center gap-2">
        <Loader2 class="w-8 h-8 text-indigo-400 animate-spin" />
        <p class="text-sm font-medium text-slate-200">Extraction du texte et détection des compétences en cours...</p>
      </div>

      <div v-else class="flex flex-col items-center justify-center gap-2">
        <div class="w-12 h-12 rounded-full bg-slate-850 flex items-center justify-center text-indigo-400 mb-1">
          <FileText class="w-6 h-6" />
        </div>
        <p class="text-sm font-semibold text-slate-200">
          Glissez-déposez votre CV PDF ou texte ici, ou <span class="text-indigo-400 hover:underline">parcourez vos fichiers</span>
        </p>
        <p class="text-xs text-slate-500">Formats acceptés : PDF avec texte ou .txt UTF-8 (max 15 Mo) • Traitement local</p>
      </div>
    </div>
  </section>
</template>
