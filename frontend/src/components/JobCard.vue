<script setup lang="ts">
import type { JobOffer } from '../types';
import JobCardHeader from './jobs/JobCardHeader.vue';
import JobAnalysisDetails from './jobs/JobAnalysisDetails.vue';
import JobCardFooter from './jobs/JobCardFooter.vue';

defineProps<{
  job: JobOffer;
}>();
</script>

<template>
  <article class="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm">
    <div>
      <JobCardHeader :job="job" />
      <JobAnalysisDetails v-if="job.analysis" :analysis="job.analysis" />
    </div>

    <JobCardFooter :job="job" />
  </article>
</template>
