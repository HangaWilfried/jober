<script setup lang="ts">
import { onMounted } from 'vue';
import { useProfileStore } from '../stores/profile';
import { User, Briefcase, FileText, CheckCircle2, Mail, Phone } from 'lucide-vue-next';

const profileStore = useProfileStore();

onMounted(() => {
  profileStore.fetchProfile();
});
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-white mb-1">Profil & Critères de Veille</h1>
      <p class="text-slate-400 text-sm">
        Ces paramètres servent de base à l'algorithme d'analyse pour calculer le Match Score et préparer vos candidatures.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="profileStore.loading" class="text-center py-16 text-slate-400 text-sm">
      Chargement du profil...
    </div>

    <!-- Profile Cards -->
    <div v-else-if="profileStore.profile" class="space-y-6">
      <!-- 1. Identité & Contact -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 class="text-base font-semibold text-white flex items-center gap-2 mb-4">
          <User class="w-5 h-5 text-indigo-400" />
          <span>Informations Personnelles</span>
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-xs text-slate-500 block mb-0.5">Nom complet</span>
            <span class="text-white font-medium">{{ profileStore.profile.fullName }}</span>
          </div>
          <div>
            <span class="text-xs text-slate-500 block mb-0.5">Titre actuel</span>
            <span class="text-white font-medium">{{ profileStore.profile.headline }}</span>
          </div>
          <div class="flex items-center gap-2 text-slate-300">
            <Mail class="w-4 h-4 text-slate-500" />
            <span>{{ profileStore.profile.email }}</span>
          </div>
          <div class="flex items-center gap-2 text-slate-300">
            <Phone class="w-4 h-4 text-slate-500" />
            <span>{{ profileStore.profile.phone }}</span>
          </div>
        </div>
      </div>

      <!-- 2. Préférences de Recherche -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 class="text-base font-semibold text-white flex items-center gap-2 mb-4">
          <Briefcase class="w-5 h-5 text-indigo-400" />
          <span>Critères de Recherche & Filtrage</span>
        </h2>

        <div class="space-y-4 text-sm">
          <div>
            <span class="text-xs text-slate-500 block mb-1">Postes ciblés</span>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="title in profileStore.profile.searchPreferences.targetTitles"
                :key="title"
                class="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium"
              >
                {{ title }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <span class="text-xs text-slate-500 block mb-0.5">Politique de télétravail souhaitée</span>
              <span class="text-slate-200 capitalize font-medium">{{ profileStore.profile.searchPreferences.remote }}</span>
            </div>
            <div>
              <span class="text-xs text-slate-500 block mb-0.5">Salaire brut minimum visé</span>
              <span class="text-slate-200 font-medium">{{ profileStore.profile.searchPreferences.minSalary?.toLocaleString('fr-FR') }} € / an</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Compétences Clés -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 class="text-base font-semibold text-white flex items-center gap-2 mb-4">
          <CheckCircle2 class="w-5 h-5 text-emerald-400" />
          <span>Compétences Clés Référencées</span>
        </h2>

        <div class="flex flex-wrap gap-2">
          <span
            v-for="skill in profileStore.profile.skills"
            :key="skill"
            class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/60"
          >
            {{ skill }}
          </span>
        </div>
      </div>

      <!-- 4. CVs enregistrés -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 class="text-base font-semibold text-white flex items-center gap-2 mb-4">
          <FileText class="w-5 h-5 text-indigo-400" />
          <span>CVs de Référence</span>
        </h2>

        <div class="space-y-3">
          <div
            v-for="resume in profileStore.profile.resumes"
            :key="resume.id"
            class="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <FileText class="w-5 h-5 text-slate-400" />
              <div>
                <p class="text-xs font-semibold text-white">{{ resume.name }}</p>
                <p class="text-[10px] text-slate-500">Mis à jour le {{ new Date(resume.updatedAt).toLocaleDateString('fr-FR') }}</p>
              </div>
            </div>
            <span
              v-if="resume.isPrimary"
              class="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              Principal
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
