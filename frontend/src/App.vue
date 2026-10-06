<script setup lang="ts">
import Navbar from './components/Navbar.vue';
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
    <Navbar />

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>

    <footer class="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
      <p>Jober — Assistant intelligent d'automatisation de candidature • Conçu pour un usage interne et quotidien</p>
    </footer>
  </div>
</template>
