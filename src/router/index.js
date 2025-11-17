import Cookies from 'js-cookie'
import { createRouter, createWebHistory } from 'vue-router'

const Login = () => import('../views/Login.vue')
const Admin = () => import('../layouts/Admin.vue')
const Home = () => import('../views/Home.vue')
const Users = () => import('../views/Users.vue')
const Auctions = () => import('../views/Auctions.vue')
const Reports = () => import('../views/Reports.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'Login', component: Login },

    {
      path: '/',
      component: Admin,
      children: [
        { path: '', name: 'Home', component: Home, meta: { requiresAuth: true } },
        { path: 'users', name: 'Users', component: Users, meta: { requiresAuth: true } },
        { path: 'auctions', name: 'Auctions', component: Auctions, meta: { requiresAuth: true } },
        { path: 'reports', name: 'Reports', component: Reports, meta: { requiresAuth: true } },
      ],
    },

    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  const token = Cookies.get('jwt_token')

  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router