<script setup lang="ts">
import type { UserProfile } from '../../types';
import { Mail, Phone, User } from 'lucide-vue-next';

defineProps<{
  profile: UserProfile;
}>();
</script>

<template>
  <section class="bg-slate-900 border border-slate-800 rounded-xl p-6">
    <h2 class="text-base font-semibold text-white flex items-center gap-2 mb-4">
      <User class="w-5 h-5 text-indigo-400" />
      <span>Informations Extraites</span>
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <span class="text-xs text-slate-500 block mb-0.5">Nom complet</span>
        <span class="text-white font-medium">{{ profile.fullName }}</span>
      </div>
      <div>
        <span class="text-xs text-slate-500 block mb-0.5">Titre actuel</span>
        <span class="text-white font-medium">{{ profile.headline }}</span>
      </div>
      <div class="flex items-center gap-2 text-slate-300">
        <Mail class="w-4 h-4 text-slate-500" />
        <span>{{ profile.email }}</span>
      </div>
      <div class="flex items-center gap-2 text-slate-300">
        <Phone class="w-4 h-4 text-slate-500" />
        <span>{{ profile.phone }}</span>
      </div>
    </div>
  </section>
</template>
