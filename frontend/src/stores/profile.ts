import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserProfile } from '../types';

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<UserProfile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

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

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile
  };
});

