import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import NotFound from '@/views/NotFound.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFound,
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/raw-data-manangement',
      name: 'raw-data-manangement',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/RawDataView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/processed-profiles-management',
      name: 'processed-profiles-management',
      component: () => import('../views/ProcessedProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/linkedin-accounts-management',
      name: 'linkedin-accounts-management',
      component: () => import('../views/LinkedinAccountsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/proxy-server-management',
      name: 'proxy-server-management',
      component: () => import('../views/ProxyServersView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/user-authorization-management',
      name: 'user-authorization-management',
      component: () => import('../views/UserAuthorizationView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user'))
  console.log('beforeEach')
  if (to.matched.some(record => record.meta.requiresAuth)) {
    console.log('beforeEach ilk if')
    if (!user) {
      console.log('beforeEach ikinci if')
      next('/login')
    } else {
      console.log('beforeEach ikinci else')
      next()
    }
  } else {
    console.log('beforeEach ilk else')
    next()
  }
})

export default router
