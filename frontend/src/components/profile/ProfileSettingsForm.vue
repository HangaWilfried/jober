<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { SearchPreferences, UserProfile } from '../../types';
import { Save } from 'lucide-vue-next';

const props = defineProps<{ profile: UserProfile; saving: boolean }>();
const emit = defineEmits<{ save: [updates: Partial<UserProfile>] }>();

const form = reactive({
  fullName: '',
  email: '',
  phone: '',
  headline: '',
  location: '',
  skills: '',
  targetTitles: '',
  remote: 'any' as SearchPreferences['remote'],
  minSalary: '',
  locations: '',
  excludedCompanies: ''
});

watch(() => props.profile, (profile) => {
  form.fullName = profile.fullName;
  form.email = profile.email;
  form.phone = profile.phone;
  form.headline = profile.headline;
  form.location = profile.location;
  form.skills = profile.skills.join('\n');
  form.targetTitles = profile.searchPreferences.targetTitles.join('\n');
  form.remote = profile.searchPreferences.remote;
  form.minSalary = profile.searchPreferences.minSalary?.toString() || '';
  form.locations = profile.searchPreferences.locations.join('\n');
  form.excludedCompanies = (profile.searchPreferences.excludedCompanies || []).join('\n');
}, { immediate: true });

function lines(value: string): string[] {
  return [...new Set(value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))];
}

function save() {
  const minSalary = form.minSalary.trim() ? Number(form.minSalary) : undefined;
  if (minSalary !== undefined && (!Number.isFinite(minSalary) || minSalary < 0)) return;

  emit('save', {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    headline: form.headline.trim(),
    location: form.location.trim(),
    skills: lines(form.skills),
    searchPreferences: {
      targetTitles: lines(form.targetTitles),
      remote: form.remote,
      ...(minSalary !== undefined ? { minSalary } : {}),
      locations: lines(form.locations),
      excludedCompanies: lines(form.excludedCompanies)
    }
  });
}
</script>

<template>
  <form @submit.prevent="save" class="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
    <div>
      <h2 class="text-base font-semibold text-white">Profil et préférences de recherche</h2>
      <p class="mt-1 text-xs text-slate-400">Un élément par ligne dans les champs de listes. Ces critères pilotent la collecte et le matching.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label class="space-y-1 text-xs text-slate-400">Nom complet
        <input v-model="form.fullName" required class="profile-input" />
      </label>
      <label class="space-y-1 text-xs text-slate-400">Email
        <input v-model="form.email" type="email" required class="profile-input" />
      </label>
      <label class="space-y-1 text-xs text-slate-400">Téléphone
        <input v-model="form.phone" class="profile-input" />
      </label>
      <label class="space-y-1 text-xs text-slate-400">Titre actuel
        <input v-model="form.headline" class="profile-input" />
      </label>
      <label class="space-y-1 text-xs text-slate-400">Localisation du profil
        <input v-model="form.location" class="profile-input" />
      </label>
      <label class="space-y-1 text-xs text-slate-400">Mode de travail recherché
        <select v-model="form.remote" class="profile-input">
          <option value="any">Indifférent</option>
          <option value="full">Télétravail complet</option>
          <option value="hybrid">Hybride ou télétravail complet</option>
          <option value="none">Présentiel uniquement</option>
        </select>
      </label>
      <label class="space-y-1 text-xs text-slate-400">Postes ciblés
        <textarea v-model="form.targetTitles" rows="4" class="profile-input" />
      </label>
      <label class="space-y-1 text-xs text-slate-400">Compétences du profil
        <textarea v-model="form.skills" rows="4" class="profile-input" />
      </label>
      <label class="space-y-1 text-xs text-slate-400">Localisations acceptées
        <textarea v-model="form.locations" rows="3" class="profile-input" />
      </label>
      <label class="space-y-1 text-xs text-slate-400">Entreprises à exclure
        <textarea v-model="form.excludedCompanies" rows="3" class="profile-input" />
      </label>
      <label class="space-y-1 text-xs text-slate-400 md:col-span-2">Salaire brut annuel minimum (EUR)
        <input v-model="form.minSalary" type="number" min="0" step="1000" class="profile-input" />
      </label>
    </div>

    <button
      type="submit"
      :disabled="saving"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium"
    >
      <Save class="w-4 h-4" />
      {{ saving ? 'Enregistrement…' : 'Enregistrer profil et critères' }}
    </button>
  </form>
</template>

<style scoped>
.profile-input {
  display: block;
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgb(51 65 85);
  background: rgb(2 6 23);
  color: rgb(226 232 240);
  padding: 0.55rem 0.7rem;
  outline: none;
}

.profile-input:focus {
  border-color: rgb(99 102 241);
}
</style>
