import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Application } from '../types';

export const useApplicationsStore = defineStore('applications', () => {
  const currentApplication = ref<Application | null>(null);
  const loading = ref(false);
  const regenerating = ref(false);
  const suggestingAnswer = ref<Record<string, boolean>>({});
  const submitting = ref(false);
  const manualSubmissionUrl = ref<string | null>(null);
  const manualSubmissionReason = ref<string | null>(null);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  async function fetchApplication(id: string) {
    loading.value = true;
    error.value = null;
    manualSubmissionUrl.value = null;
    manualSubmissionReason.value = null;
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
    error.value = null;
    try {
      const res = await fetch(`/api/v1/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preparedData: { coverLetter } })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de sauvegarder la lettre.');
      currentApplication.value = data;
      successMessage.value = 'Lettre de motivation mise à jour.';
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function confirmCoverLetter(id: string) {
    error.value = null;
    const coverLetter = currentApplication.value?.preparedData.coverLetter;
    if (!coverLetter?.trim()) {
      error.value = 'La lettre de motivation ne peut pas être vide.';
      return;
    }
    try {
      const res = await fetch(`/api/v1/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preparedData: { coverLetterConfirmed: true } })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de confirmer la lettre.');
      currentApplication.value = data;
      successMessage.value = 'Lettre vérifiée et confirmée.';
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function selectResume(id: string, resumeId: string) {
    error.value = null;
    loading.value = true;
    try {
      const res = await fetch(`/api/v1/applications/${id}/select-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de sélectionner ce CV.');
      currentApplication.value = data;
      successMessage.value = 'Candidature et documents régénérés à partir du CV sélectionné. Vérifiez-les avant toute soumission.';
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function saveCustomizedResume(id: string, content: string) {
    error.value = null;
    try {
      const res = await fetch(`/api/v1/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preparedData: { customizedResumeContent: content } })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de sauvegarder le CV adapté.');
      currentApplication.value = data;
      successMessage.value = 'CV adapté sauvegardé.';
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function confirmCustomizedResume(id: string) {
    error.value = null;
    const content = currentApplication.value?.preparedData.customizedResumeContent;
    if (!content?.trim()) {
      error.value = 'Le CV adapté ne peut pas être vide.';
      return;
    }
    try {
      const res = await fetch(`/api/v1/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preparedData: { customizedResumeConfirmed: true } })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de confirmer le CV adapté.');
      currentApplication.value = data;
      successMessage.value = 'CV adapté vérifié et confirmé.';
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function confirmPreparedAnswer(id: string, answerIndex: number, suggestedAnswer: string) {
    error.value = null;
    try {
      const res = await fetch(
        `/api/v1/applications/${id}/prepared-answers/${answerIndex}/confirm`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suggestedAnswer })
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de confirmer cette réponse.');
      currentApplication.value = data;
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
    error.value = null;
    try {
      const res = await fetch(`/api/v1/applications/${appId}/resolve-blocker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockerId, response })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de résoudre ce point.');
      currentApplication.value = data.application;
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function submitApplication(appId: string) {
    submitting.value = true;
    error.value = null;
    successMessage.value = null;
    manualSubmissionUrl.value = null;
    manualSubmissionReason.value = null;
    try {
      const res = await fetch(`/api/v1/applications/${appId}/submit`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.status === 409 && data.status === 'manual_required') {
        manualSubmissionUrl.value = data.url;
        manualSubmissionReason.value = data.message;
        if (data.application) currentApplication.value = data.application;
        return;
      }
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

  async function confirmManualSubmission(appId: string) {
    submitting.value = true;
    error.value = null;
    try {
      const res = await fetch(`/api/v1/applications/${appId}/confirm-manual-submission`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de confirmer l’envoi manuel.');
      currentApplication.value = data.application;
      successMessage.value = data.message;
      manualSubmissionUrl.value = null;
      manualSubmissionReason.value = null;
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
    manualSubmissionUrl,
    manualSubmissionReason,
    error,
    successMessage,
    fetchApplication,
    updateCoverLetter,
    confirmCoverLetter,
    selectResume,
    saveCustomizedResume,
    confirmCustomizedResume,
    confirmPreparedAnswer,
    regenerateCoverLetter,
    getSuggestedAnswer,
    resolveBlocker,
    submitApplication,
    confirmManualSubmission
  };
});
