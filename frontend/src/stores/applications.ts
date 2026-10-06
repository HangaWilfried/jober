import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Application } from '../types';

export const useApplicationsStore = defineStore('applications', () => {
  const currentApplication = ref<Application | null>(null);
  const loading = ref(false);
  const regenerating = ref(false);
  const suggestingAnswer = ref<Record<string, boolean>>({});
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
        successMessage.value = 'Lettre de motivation mise à jour.';
      }
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function regenerateCoverLetter(id: string, instructions?: string, tone?: string) {
    regenerating.value = true;
    error.value = null;
    try {
      const res = await fetch(`/api/v1/applications/${id}/regenerate-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions, tone })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la régénération');

      currentApplication.value = data.application;
      successMessage.value = 'Lettre de motivation réécrite par l IA avec succès !';
      return data.coverLetter;
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      regenerating.value = false;
    }
  }

  async function getSuggestedAnswer(appId: string, blockerId: string): Promise<string | null> {
    suggestingAnswer.value[blockerId] = true;
    try {
      const res = await fetch(`/api/v1/applications/${appId}/suggest-blocker-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockerId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suggestion');
      return data.suggestedAnswer;
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      suggestingAnswer.value[blockerId] = false;
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
    regenerating,
    suggestingAnswer,
    submitting,
    error,
    successMessage,
    fetchApplication,
    updateCoverLetter,
    regenerateCoverLetter,
    getSuggestedAnswer,
    resolveBlocker,
    submitApplication
  };
});
