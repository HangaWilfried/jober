<script setup lang="ts">
import { Search } from 'lucide-vue-next';

defineProps<{
  searchQuery: string;
  minMatch: number;
  status: string;
}>();

const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'update:minMatch': [value: number];
  'update:status': [value: string];
}>();
</script>

<template>
  <section class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
    <div class="relative w-full md:w-80">
      <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        :value="searchQuery"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        type="text"
        placeholder="Rechercher par titre, entreprise, techno..."
        class="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
      />
    </div>

    <div class="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
      <div class="flex items-center gap-2 text-xs text-slate-300">
        <span>Score min :</span>
        <select
          :value="minMatch"
          @change="emit('update:minMatch', Number(($event.target as HTMLSelectElement).value))"
          class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option :value="0">Tous (0%+)</option>
          <option :value="70">≥ 70% (Pertinent)</option>
          <option :value="85">≥ 85% (Forte adéquation)</option>
          <option :value="90">≥ 90% (Match Idéal)</option>
        </select>
      </div>

      <div class="flex items-center gap-2 text-xs text-slate-300">
        <span>Statut :</span>
        <select
          :value="status"
          @change="emit('update:status', ($event.target as HTMLSelectElement).value)"
          class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="analyzed">Analysées</option>
          <option value="rejected">Non retenues</option>
        </select>
      </div>
    </div>
  </section>
</template>
