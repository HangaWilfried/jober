<script setup lang="ts">
import { ref } from 'vue';
import { Loader2, Sparkles, Wand2, X } from 'lucide-vue-next';

const open = defineModel<boolean>('open', { required: true });

defineProps<{
  regenerating: boolean;
}>();

const emit = defineEmits<{
  regenerate: [instructions: string, tone: string];
}>();

const tone = ref('Professionnel, dynamique et percutant');
const instructions = ref('');
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
  >
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <Wand2 class="w-5 h-5 text-purple-400" />
          <span>Ajuster la lettre de motivation avec l'IA</span>
        </h3>
        <button @click="open = false" class="text-slate-400 hover:text-white">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Ton souhaité</label>
          <select
            v-model="tone"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="Professionnel, dynamique et percutant">Dynamique & Percutant (Recommandé)</option>
            <option value="Très concis et axé sur les résultats chiffrés">Très concis (Bullet points & impact)</option>
            <option value="Formel et institutionnel">Formel & Corporatif</option>
            <option value="Créatif et passionné">Passionné & Visionnaire</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">
            Instructions spécifiques (optionnel)
          </label>
          <textarea
            v-model="instructions"
            rows="3"
            placeholder="ex: Insister sur mon expérience en refonte d'architecture, mentionner ma disponibilité sous 15 jours..."
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          ></textarea>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          @click="open = false"
          class="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          Annuler
        </button>

        <button
          type="button"
          @click="emit('regenerate', instructions, tone)"
          :disabled="regenerating"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all cursor-pointer"
        >
          <Loader2 v-if="regenerating" class="w-4 h-4 animate-spin" />
          <Sparkles v-else class="w-4 h-4" />
          <span>{{ regenerating ? 'Réécriture IA...' : 'Régénérer la lettre' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
