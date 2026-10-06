import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import ApplicationReviewView from '../views/ApplicationReviewView.vue';
import ProfileView from '../views/ProfileView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/review/:id',
      name: 'application-review',
      component: ApplicationReviewView
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView
    }
  ]
});

