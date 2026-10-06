<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { ArrowLeft, Check, Copy } from 'lucide-vue-next';

defineProps<{
  copied: boolean;
}>();

const emit = defineEmits<{
  copy: [];
}>();
</script>

<template>
  <div class="flex items-center justify-between">
    <RouterLink
      to="/"
      class="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      <span>Retour à la liste des offres</span>
    </RouterLink>

    <button
      @click="emit('copy')"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer"
    >
      <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-400" />
      <Copy v-else class="w-3.5 h-3.5 text-slate-400" />
      <span>{{ copied ? 'Dossier copié !' : 'Copier tout le dossier' }}</span>
    </button>
  </div>
</template>
