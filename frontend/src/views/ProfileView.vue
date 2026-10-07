<script setup lang="ts">
import { onMounted } from 'vue';
import { useProfileStore } from '../stores/profile';
import { Check } from 'lucide-vue-next';
import ResumeUploadSection from '../components/profile/ResumeUploadSection.vue';
import ResumeListSection from '../components/profile/ResumeListSection.vue';
import ProfileSettingsForm from '../components/profile/ProfileSettingsForm.vue';

const profileStore = useProfileStore();

onMounted(() => {
  profileStore.fetchProfile();
});
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-12">
    <div>
      <h1 class="text-2xl font-bold text-white mb-1">Profil & Base de CVs</h1>
      <p class="text-slate-400 text-sm">
        Importez votre CV en PDF ou texte brut. Le parseur local extrait son contenu et indexe les compétences dans SQLite pour le moteur de matching.
      </p>
    </div>

    <div
      v-if="profileStore.successMessage"
      class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-300 text-sm flex items-center gap-3 animate-fade-in"
    >
      <Check class="w-5 h-5 flex-shrink-0" />
      <div>{{ profileStore.successMessage }}</div>
    </div>

    <div
      v-if="profileStore.error"
      class="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm flex items-center gap-3"
    >
      <div>{{ profileStore.error }}</div>
    </div>

    <div v-if="profileStore.loading && !profileStore.profile" class="text-center py-16 text-slate-400 text-sm">
      Chargement du profil...
    </div>

    <div v-else-if="profileStore.profile" class="space-y-6">
      <ResumeUploadSection
        :uploading="profileStore.uploading"
        @upload="profileStore.uploadResume"
      />
      <ResumeListSection
        :resumes="profileStore.profile.resumes"
        @set-primary="profileStore.setPrimaryResume"
        @delete="profileStore.deleteResume"
      />
      <ProfileSettingsForm
        :profile="profileStore.profile"
        :saving="profileStore.loading"
        @save="profileStore.updateProfile"
      />
    </div>
  </div>
</template>
