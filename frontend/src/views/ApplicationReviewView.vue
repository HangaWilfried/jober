<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useApplicationsStore } from '../stores/applications';
import type { Application } from '../types';
import ApplicationToolbar from '../components/application/ApplicationToolbar.vue';
import ApplicationOverview from '../components/application/ApplicationOverview.vue';
import ApplicationDecisionsSection from '../components/application/ApplicationDecisionsSection.vue';
import ApplicationMaterialsSection from '../components/application/ApplicationMaterialsSection.vue';
import ApplicationSubmissionBar from '../components/application/ApplicationSubmissionBar.vue';
import RegenerateLetterDialog from '../components/application/RegenerateLetterDialog.vue';

const route = useRoute();
const appStore = useApplicationsStore();
const blockerResponses = ref<Record<string, string>>({});
const coverLetterDraft = ref('');
const showRegenModal = ref(false);
const copiedNotification = ref(false);

const applicationId = computed(() => route.params.id as string);
const app = computed(() => appStore.currentApplication);

onMounted(async () => {
  await appStore.fetchApplication(applicationId.value);
  if (app.value) {
    coverLetterDraft.value = app.value.preparedData.coverLetter;
  }
});

const unresolvedBlockers = computed(() => {
  return app.value?.blockers.filter(blocker => !blocker.resolved) || [];
});

const canSubmit = computed(() => {
  return Boolean(
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

async function handleSuggestBlockerAnswer(blockerId: string) {
  const suggested = await appStore.getSuggestedAnswer(applicationId.value, blockerId);
  if (suggested) {
    blockerResponses.value[blockerId] = suggested;
  }
}

function updateBlockerResponses(responses: Record<string, string>) {
  blockerResponses.value = responses;
}

async function handleSaveCoverLetter() {
  await appStore.updateCoverLetter(applicationId.value, coverLetterDraft.value);
}

async function handleRegenerateCoverLetter(instructions: string, tone: string) {
  const newLetter = await appStore.regenerateCoverLetter(
    applicationId.value,
    instructions,
    tone
  );
  if (newLetter) {
    coverLetterDraft.value = newLetter;
    showRegenModal.value = false;
  }
}

async function handleCopyFullApplication() {
  const application: Application | null = app.value;
  if (!application) return;

  const content = `=== CANDIDATURE : ${application.jobTitle} chez ${application.company} ===

--- LETTRE DE MOTIVATION ---
${coverLetterDraft.value}

--- RÉPONSES AUX QUESTIONS ---
${application.preparedData.preparedAnswers.map(answer => `Q: ${answer.question}\nR: ${answer.suggestedAnswer}`).join('\n\n')}

--- POINTS FORTS DU PROFIL ---
${application.preparedData.customizedHighlights.join('\n')}
`;

  await navigator.clipboard.writeText(content);
  copiedNotification.value = true;
  setTimeout(() => {
    copiedNotification.value = false;
  }, 2500);
}

async function handleSubmitApplication() {
  await appStore.submitApplication(applicationId.value);
}
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto pb-16">
    <ApplicationToolbar
      :copied="copiedNotification"
      @copy="handleCopyFullApplication"
    />

    <div v-if="appStore.loading" class="text-center py-20 text-slate-400 text-sm">
      Chargement du dossier de candidature...
    </div>

    <div v-else-if="!app" class="bg-rose-500/10 border border-rose-500/30 rounded-xl p-6 text-rose-300 text-center">
      Candidature introuvable.
    </div>

    <div v-else class="space-y-6">
      <ApplicationOverview
        :application="app"
        :success-message="appStore.successMessage"
      />

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ApplicationDecisionsSection
          :blockers="app.blockers"
          :prepared-answers="app.preparedData.preparedAnswers"
          :responses="blockerResponses"
          :suggesting-answer="appStore.suggestingAnswer"
          @update-responses="updateBlockerResponses"
          @suggest-answer="handleSuggestBlockerAnswer"
          @resolve-blocker="handleResolveBlocker"
        />
        <ApplicationMaterialsSection
          v-model:cover-letter="coverLetterDraft"
          :prepared-data="app.preparedData"
          @regenerate="showRegenModal = true"
          @save="handleSaveCoverLetter"
        />
      </div>

      <ApplicationSubmissionBar
        :can-submit="canSubmit"
        :unresolved-count="unresolvedBlockers.length"
        :submitting="appStore.submitting"
        @submit="handleSubmitApplication"
      />
    </div>

    <RegenerateLetterDialog
      v-model:open="showRegenModal"
      :regenerating="appStore.regenerating"
      @regenerate="handleRegenerateCoverLetter"
    />
  </div>
</template>
