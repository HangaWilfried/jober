<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useJobsStore } from '../stores/jobs';
import { AlertCircle, Check, X } from 'lucide-vue-next';
import DashboardIntro from '../components/dashboard/DashboardIntro.vue';
import JobFilters from '../components/dashboard/JobFilters.vue';
import JobResultsSection from '../components/dashboard/JobResultsSection.vue';
import ManualJobDialog from '../components/dashboard/ManualJobDialog.vue';

const jobsStore = useJobsStore();
const showAddModal = ref(false);

onMounted(() => {
  jobsStore.fetchJobs();
});
</script>

<template>
  <div class="space-y-8 pb-12">
    <DashboardIntro
      :loading="jobsStore.loading"
      @analyze="showAddModal = true"
      @sync="jobsStore.triggerCollect"
    />

    <div
      v-if="jobsStore.successMessage"
      class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-300 text-sm flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2">
        <Check class="w-5 h-5 flex-shrink-0" />
        <span>{{ jobsStore.successMessage }}</span>
      </div>
      <button @click="jobsStore.successMessage = null" class="text-emerald-400 hover:text-emerald-200">
        <X class="w-4 h-4" />
      </button>
    </div>

    <JobFilters
      :search-query="jobsStore.searchQuery"
      :min-match="jobsStore.filterMinMatch"
      :status="jobsStore.filterStatus"
      @update:search-query="jobsStore.searchQuery = $event"
      @update:min-match="jobsStore.filterMinMatch = $event"
      @update:status="jobsStore.filterStatus = $event"
    />

    <div v-if="jobsStore.error" class="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm flex items-center gap-3">
      <AlertCircle class="w-5 h-5 flex-shrink-0" />
      <div>
        <p class="font-semibold">Information :</p>
        <p class="text-xs">{{ jobsStore.error }}</p>
      </div>
    </div>

    <JobResultsSection
      :loading="jobsStore.loading"
      :jobs="jobsStore.jobs"
      :filtered-jobs="jobsStore.filteredJobs"
      @analyze="showAddModal = true"
    />

    <ManualJobDialog v-model:open="showAddModal" />
  </div>
</template>
