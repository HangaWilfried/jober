<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  type: 'match' | 'readiness';
  score: number;
  size?: 'sm' | 'md' | 'lg';
}>();

const label = computed(() => {
  return props.type === 'match' ? 'Match' : 'Readiness';
});

const colorClasses = computed(() => {
  if (props.score >= 90) {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  }
  if (props.score >= 70) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }
  return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
});

const sizeClasses = computed(() => {
  if (props.size === 'lg') return 'text-sm px-3 py-1.5 font-bold';
  if (props.size === 'sm') return 'text-xs px-2 py-0.5';
  return 'text-xs px-2.5 py-1 font-semibold';
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full border shadow-sm transition-all',
      colorClasses,
      sizeClasses
    ]"
  >
    <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
    <span>{{ label }} :</span>
    <span class="font-bold">{{ score }}%</span>
  </span>
</template>

