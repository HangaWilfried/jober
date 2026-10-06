<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProfileStore } from '../stores/profile';
import {
  User,
  Briefcase,
  FileText,
  CheckCircle2,
  Mail,
  Phone,
  UploadCloud,
  Trash2,
  Star,
  Loader2,
  Check
} from 'lucide-vue-next';

const profileStore = useProfileStore();
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

onMounted(() => {
  profileStore.fetchProfile();
});

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      profileStore.uploadResume(file);
    }
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0];
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      profileStore.uploadResume(file);
    }
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-white mb-1">Profil & Base de CVs</h1>
      <p class="text-slate-400 text-sm">
        Importez votre vrai CV au format PDF. Le parseur local extrait le texte et indexe vos compétences dans SQLite pour le moteur de matching.
      </p>
    </div>

    <!-- Notification message -->
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

    <!-- Loading -->
    <div v-if="profileStore.loading && !profileStore.profile" class="text-center py-16 text-slate-400 text-sm">
      Chargement du profil...
    </div>

    <!-- Profile Cards -->
    <div v-else-if="profileStore.profile" class="space-y-6">
      <!-- 1. Upload CV PDF (Moteur 2) -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 class="text-base font-semibold text-white flex items-center gap-2 mb-3">
          <UploadCloud class="w-5 h-5 text-indigo-400" />
          <span>Importer un nouveau CV (PDF)</span>
        </h2>

        <div
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="fileInput?.click()"
          class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
          :class="isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-950/60'"
        >
          <input
            ref="fileInput"
            type="file"
            accept="application/pdf"
            class="hidden"
            @change="handleFileChange"
          />

          <div v-if="profileStore.uploading" class="flex flex-col items-center justify-center gap-2">
            <Loader2 class="w-8 h-8 text-indigo-400 animate-spin" />
            <p class="text-sm font-medium text-slate-200">Extraction du texte et détection des compétences en cours...</p>
          </div>

          <div v-else class="flex flex-col items-center justify-center gap-2">
            <div class="w-12 h-12 rounded-full bg-slate-850 flex items-center justify-center text-indigo-400 mb-1">
              <FileText class="w-6 h-6" />
            </div>
            <p class="text-sm font-semibold text-slate-200">
              Glissez-déposez votre CV PDF ici, ou <span class="text-indigo-400 hover:underline">parcourez vos fichiers</span>
            </p>
            <p class="text-xs text-slate-500">Format accepté : PDF (max 15 Mo) • Traitement 100% local</p>
          </div>
        </div>
      </div>

      <!-- 2. CVs enregistrés -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 class="text-base font-semibold text-white flex items-center gap-2 mb-4">
          <FileText class="w-5 h-5 text-indigo-400" />
          <span>Vos CVs Enregistrés en Base</span>
        </h2>

        <div v-if="profileStore.profile.resumes.length === 0" class="text-xs text-slate-500 py-4 text-center">
          Aucun CV importé pour l'instant. Uploadez votre premier CV ci-dessus.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="resume in profileStore.profile.resumes"
            :key="resume.id"
            class="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
                <FileText class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-sm font-semibold text-white">{{ resume.name }}</p>
                  <span
                    v-if="resume.isPrimary"
                    class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  >
                    Principal (Matching par défaut)
                  </span>
                </div>
                <p class="text-[11px] text-slate-500">
                  Enregistré le {{ new Date(resume.updatedAt).toLocaleDateString('fr-FR') }} à {{ new Date(resume.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 self-end sm:self-center">
              <button
                v-if="!resume.isPrimary"
                @click="profileStore.setPrimaryResume(resume.id)"
                class="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Définir comme CV principal"
              >
                <Star class="w-3.5 h-3.5 text-amber-400" />
                <span>Définir principal</span>
              </button>

              <button
                @click="profileStore.deleteResume(resume.id)"
                class="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Supprimer ce CV"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Compétences Clés Indexées -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-white flex items-center gap-2">
            <CheckCircle2 class="w-5 h-5 text-emerald-400" />
            <span>Compétences Détectées & Indexées</span>
          </h2>
          <span class="text-xs text-slate-400">{{ profileStore.profile.skills.length }} compétences</span>
        </div>

        <div class="flex flex-wrap gap-2">
          <span
            v-for="skill in profileStore.profile.skills"
            :key="skill"
            class="px-2.5 py-1 rounded-lg bg-slate-850 text-slate-200 text-xs font-medium border border-slate-700/60"
          >
            {{ skill }}
          </span>
        </div>
      </div>

      <!-- 4. Identité & Contact -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 class="text-base font-semibold text-white flex items-center gap-2 mb-4">
          <User class="w-5 h-5 text-indigo-400" />
          <span>Informations Extraites</span>
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

      <!-- 5. Préférences de Recherche -->
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
              <span class="text-xs text-slate-500 block mb-0.5">Politique de télétravail</span>
              <span class="text-slate-200 capitalize font-medium">{{ profileStore.profile.searchPreferences.remote }}</span>
            </div>
            <div>
              <span class="text-xs text-slate-500 block mb-0.5">Salaire brut minimum</span>
              <span class="text-slate-200 font-medium">{{ profileStore.profile.searchPreferences.minSalary?.toLocaleString('fr-FR') }} € / an</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
