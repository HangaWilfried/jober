import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Application } from '../types';

export const useApplicationsStore = defineStore('applications', () => {
  const currentApplication = ref<Application | null>(null);
  const loading = ref(false);
  const submitting = ref(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  async function fetchApplication(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`/api/v1/applications/${id}`);
      if (!res.ok) throw new Error('Impossible de charger la candidature');
      currentApplication.value = await res.json();
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function updateCoverLetter(id: string, coverLetter: string) {
    try {
      const res = await fetch(`/api/v1/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preparedData: {
            ...currentApplication.value?.preparedData,
            coverLetter
          }
        })
      });
      if (res.ok) {
        currentApplication.value = await res.json();
      }
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function resolveBlocker(appId: string, blockerId: string, response: string) {
    try {
      const res = await fetch(`/api/v1/applications/${appId}/resolve-blocker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockerId, response })
      });
      if (res.ok) {
        const data = await res.json();
        currentApplication.value = data.application;
      }
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function submitApplication(appId: string) {
    submitting.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const res = await fetch(`/api/v1/applications/${appId}/submit`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la soumission');
      }
      currentApplication.value = data.application;
      successMessage.value = data.message;
    } catch (err: any) {
      error.value = err.message;
    } finally {
      submitting.value = false;
    }
  }

  return {
    currentApplication,
    loading,
    submitting,
    error,
    successMessage,
    fetchApplication,
    updateCoverLetter,
    resolveBlocker,
    submitApplication
  };
});

