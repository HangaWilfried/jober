import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserProfile } from '../types';

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<UserProfile | null>(null);
  const loading = ref(false);
  const uploading = ref(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  async function fetchProfile() {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch('/api/v1/profile');
      if (!res.ok) throw new Error('Impossible de charger le profil');
      profile.value = await res.json();
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(data: Partial<UserProfile>) {
    loading.value = true;
    try {
      const res = await fetch('/api/v1/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        profile.value = await res.json();
      }
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function uploadResume(file: File) {
    uploading.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/profile/resume/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l upload');
      }

      profile.value = data.profile;
      successMessage.value = `CV "${file.name}" importé et compétences indexées avec succès !`;
    } catch (err: any) {
      error.value = err.message;
    } finally {
      uploading.value = false;
    }
  }

  async function setPrimaryResume(id: string) {
    try {
      const res = await fetch(`/api/v1/profile/resume/${id}/primary`, {
        method: 'POST'
      });
      if (res.ok) {
        profile.value = await res.json();
      }
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function deleteResume(id: string) {
    try {
      const res = await fetch(`/api/v1/profile/resume/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        profile.value = await res.json();
      }
    } catch (err: any) {
      error.value = err.message;
    }
  }

  return {
    profile,
    loading,
    uploading,
    error,
    successMessage,
    fetchProfile,
    updateProfile,
    uploadResume,
    setPrimaryResume,
    deleteResume
  };
});
