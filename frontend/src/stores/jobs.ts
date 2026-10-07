import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { JobOffer } from '../types';

export const useJobsStore = defineStore('jobs', () => {
  const jobs = ref<JobOffer[]>([]);
  const loading = ref(false);
  const analyzing = ref(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  // Filtres
  const filterMinMatch = ref<number>(0);
  const filterStatus = ref<string>('all');
  const searchQuery = ref<string>('');

  const filteredJobs = computed(() => {
    return jobs.value.filter((job) => {
      // Filtre score
      const score = job.analysis?.matchScore ?? 0;
      if (score < filterMinMatch.value) return false;

      // Filtre statut
      if (filterStatus.value !== 'all' && job.status !== filterStatus.value) {
        return false;
      }

      // Recherche texte
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        const matchesSkills = job.analysis?.requiredSkills.some(s => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCompany && !matchesSkills) return false;
      }

      return true;
    });
  });

  async function fetchJobs() {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch('/api/v1/jobs');
      if (!res.ok) throw new Error('Erreur lors du chargement des offres');
      const data = await res.json();
      jobs.value = data.data;
    } catch (err: any) {
      error.value = err.message || 'Impossible de joindre le backend';
    } finally {
      loading.value = false;
    }
  }

  async function analyzeNewJob(payload: {
    title: string;
    company: string;
    location?: string;
    remoteType?: string;
    url?: string;
    description: string;
  }): Promise<JobOffer | null> {
    analyzing.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const res = await fetch('/api/v1/jobs/analyze-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l analyse de l offre');
      }

      successMessage.value = `Offre "${payload.title}" analysée avec succès ! (Match : ${data.job.analysis?.matchScore}%)`;
      await fetchJobs();
      return data.job;
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      analyzing.value = false;
    }
  }

  async function triggerCollect() {
    loading.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const res = await fetch('/api/v1/jobs/collect', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la synchronisation');
      }
      successMessage.value = data.message || 'Offres synchronisées avec succès !';
      await fetchJobs();
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  return {
    jobs,
    loading,
    analyzing,
    error,
    successMessage,
    filterMinMatch,
    filterStatus,
    searchQuery,
    filteredJobs,
    fetchJobs,
    analyzeNewJob,
    triggerCollect
  };
});
