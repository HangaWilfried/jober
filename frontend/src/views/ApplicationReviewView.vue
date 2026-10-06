<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useApplicationsStore } from '../stores/applications';
import ScoreBadge from '../components/ScoreBadge.vue';
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Send,
  MessageSquare,
  Sparkles,
  ShieldAlert,
  Save
} from 'lucide-vue-next';

const route = useRoute();
const appStore = useApplicationsStore();
const blockerResponses = ref<Record<string, string>>({});
const coverLetterDraft = ref('');

const applicationId = computed(() => route.params.id as string);
const app = computed(() => appStore.currentApplication);

onMounted(async () => {
  await appStore.fetchApplication(applicationId.value);
  if (app.value) {
    coverLetterDraft.value = app.value.preparedData.coverLetter;
  }
});

const unresolvedBlockers = computed(() => {
  return app.value?.blockers.filter(b => !b.resolved) || [];
});

const canSubmit = computed(() => {
  return (
    app.value &&
    unresolvedBlockers.value.length === 0 &&
    app.value.status !== 'submitted_manual' &&
    app.value.status !== 'submitted_auto'
  );
});

async function handleResolveBlocker(blockerId: string) {
  const answer = blockerResponses.value[blockerId];
  if (!answer || !answer.trim()) return;

  await appStore.resolveBlocker(applicationId.value, blockerId, answer);
}

async function handleSaveCoverLetter() {
  await appStore.updateCoverLetter(applicationId.value, coverLetterDraft.value);
}

async function handleSubmitApplication() {
  await appStore.submitApplication(applicationId.value);
}
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto pb-16">
    <!-- Navigation Back -->
    <RouterLink
      to="/"
      class="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      <span>Retour à la liste des offres</span>
    </RouterLink>

    <!-- Loading State -->
    <div v-if="appStore.loading" class="text-center py-20 text-slate-400 text-sm">
      Chargement du dossier de candidature...
    </div>

    <!-- Error State -->
    <div v-else-if="!app" class="bg-rose-500/10 border border-rose-500/30 rounded-xl p-6 text-rose-300 text-center">
      Candidature introuvable.
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Header Banner with Scores -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div class="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-1">
            Vérification Human-in-the-Loop
          </div>
          <h1 class="text-2xl font-bold text-white mb-1">
            {{ app.jobTitle }}
          </h1>
          <p class="text-slate-400 text-sm">{{ app.company }}</p>
        </div>

        <div class="flex items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <ScoreBadge type="match" :score="app.matchScore" size="lg" />
          <ScoreBadge type="readiness" :score="app.readinessScore" size="lg" />
        </div>
      </div>

      <!-- Success notification if submitted -->
      <div
        v-if="app.submittedAt || appStore.successMessage"
        class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-300 text-sm flex items-center gap-3"
      >
        <CheckCircle class="w-5 h-5 flex-shrink-0" />
        <div>
          <p class="font-semibold">Candidature transmise avec succès !</p>
          <p class="text-xs">Statut : {{ app.status }} — Enregistré le {{ new Date(app.submittedAt || Date.now()).toLocaleString('fr-FR') }}</p>
        </div>
      </div>

      <!-- Two-column workspace -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Colonne Gauche : Bloqueurs & Réponses préparées (7 cols) -->
        <div class="lg:col-span-7 space-y-6">
          <!-- 1. Bloqueurs / Actions humaines requises -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-white flex items-center gap-2">
                <ShieldAlert class="w-5 h-5 text-amber-400" />
                <span>Points de décision humaine</span>
              </h2>
              <span
                class="text-xs px-2.5 py-0.5 rounded-full font-medium"
                :class="unresolvedBlockers.length > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'"
              >
                {{ unresolvedBlockers.length > 0 ? `${unresolvedBlockers.length} bloquant(s)` : 'Tous résolus ✓' }}
              </span>
            </div>

            <p class="text-xs text-slate-400">
              Conformément à la règle de sécurité, l'IA ne soumet jamais de réponse subjective ou d'information sensible sans votre validation explicite.
            </p>

            <!-- Blocker items -->
            <div class="space-y-4 pt-2">
              <div
                v-for="blocker in app.blockers"
                :key="blocker.id"
                class="p-4 rounded-lg border transition-all"
                :class="blocker.resolved ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-300' : 'bg-slate-950 border-amber-500/30'"
              >
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div class="text-sm font-medium text-white flex items-center gap-2">
                    <span v-if="blocker.resolved" class="text-emerald-400 text-xs font-bold">✓ RÉSOLU</span>
                    <span v-else class="text-amber-400 text-xs font-bold">! ACTION REQUISE</span>
                    <span>{{ blocker.question }}</span>
                  </div>
                </div>

                <!-- Input if not resolved -->
                <div v-if="!blocker.resolved" class="space-y-3 mt-3">
                  <textarea
                    v-model="blockerResponses[blocker.id]"
                    rows="2"
                    placeholder="Saisissez votre réponse ici..."
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  ></textarea>
                  <button
                    @click="handleResolveBlocker(blocker.id)"
                    class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                  >
                    Valider cette réponse
                  </button>
                </div>

                <!-- Display resolved response -->
                <div v-else class="mt-2 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded border border-slate-800">
                  <span class="font-medium text-slate-300">Votre réponse :</span> {{ blocker.userResponse }}
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Réponses préremplies (Q&A) -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 class="text-base font-semibold text-white flex items-center gap-2">
              <MessageSquare class="w-5 h-5 text-indigo-400" />
              <span>Questions préremplies par l'IA</span>
            </h2>

            <div class="space-y-3">
              <div
                v-for="(qa, index) in app.preparedData.preparedAnswers"
                :key="index"
                class="bg-slate-950 border border-slate-800/80 rounded-lg p-3.5 flex items-center justify-between gap-4"
              >
                <div>
                  <div class="text-xs text-slate-400 mb-1">{{ qa.question }}</div>
                  <div class="text-sm font-semibold text-white">{{ qa.suggestedAnswer }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    Confiance : {{ Math.round(qa.confidence * 100) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Colonne Droite : Lettre de motivation & CV (5 cols) -->
        <div class="lg:col-span-5 space-y-6">
          <!-- CV Sélectionné -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 class="text-base font-semibold text-white flex items-center gap-2 mb-3">
              <FileText class="w-5 h-5 text-indigo-400" />
              <span>CV Sélectionné</span>
            </h2>

            <div class="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-white">
                  {{ app.preparedData.selectedResume?.name || 'CV par défaut' }}
                </p>
                <p class="text-[10px] text-slate-500">Sélectionné automatiquement pour ce type de poste</p>
              </div>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Adapté
              </span>
            </div>

            <!-- Points d'adaptation -->
            <div class="mt-3 space-y-1.5">
              <p class="text-xs font-medium text-slate-400">Mises en valeur ciblées :</p>
              <ul class="text-xs text-slate-300 space-y-1 list-disc list-inside">
                <li v-for="(highlight, i) in app.preparedData.customizedHighlights" :key="i">
                  {{ highlight }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Lettre de motivation éditable -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles class="w-5 h-5 text-purple-400" />
                <span>Lettre de motivation adaptée</span>
              </h2>
              <button
                @click="handleSaveCoverLetter"
                class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                <Save class="w-3.5 h-3.5" />
                <span>Sauvegarder</span>
              </button>
            </div>

            <p class="text-xs text-slate-400">
              Générée pour s'aligner sur les exigences de l'offre. Vous pouvez la retoucher librement.
            </p>

            <textarea
              v-model="coverLetterDraft"
              rows="12"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Action Footer (Submission Bar) -->
      <div class="sticky bottom-4 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div class="text-xs text-slate-300 flex items-center gap-2">
          <div
            class="w-2.5 h-2.5 rounded-full"
            :class="canSubmit ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'"
          ></div>
          <span v-if="!canSubmit">
            {{ unresolvedBlockers.length > 0 ? `Veuillez résoudre les ${unresolvedBlockers.length} bloqueurs ci-dessus avant soumission.` : 'Candidature déjà soumise.' }}
          </span>
          <span v-else class="text-emerald-400 font-medium">
            Dossier complet (Readiness 100%) ! Vous pouvez valider l'envoi.
          </span>
        </div>

        <button
          @click="handleSubmitApplication"
          :disabled="!canSubmit || appStore.submitting"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
        >
          <Send class="w-4 h-4" />
          <span>{{ appStore.submitting ? 'Transmission en cours...' : 'Valider et Transmettre la candidature' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
