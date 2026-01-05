import Cookies from 'js-cookie'
import { createRouter, createWebHistory } from 'vue-router'

const Login = () => import('../views/Login.vue')
const Admin = () => import('../layouts/Admin.vue')
const Home = () => import('../views/Home.vue')
const Users = () => import('../views/Users.vue')
const Auctions = () => import('../views/Auctions.vue')
const Deposits = () => import('../views/Deposits.vue')
const Products = () => import('../views/Products.vue')
const Payments = () => import('../views/Payments.vue')
const Categories = () => import('../views/Categories.vue')
const Cities = () => import('../views/Cities..vue')
import AuctionRoom from '@/views/AuctionRoom.vue'  

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
        { path: 'products', name: 'Products', component: Products, meta: { requiresAuth: true } },
        { path: 'payments', name: 'Payments', component: Payments, meta: { requiresAuth: true } },
        { path: 'deposits', name: 'Deposits', component: Deposits, meta: { requiresAuth: true } },
        { path: 'categories', name: 'Categories', component: Categories, meta: { requiresAuth: true } },
        { path: 'cities', name: 'Cities', component: Cities, meta: { requiresAuth: true } },
        { path: 'auction-room/:id', name: 'AuctionRoom', component: AuctionRoom, meta: { requiresAuth: true } },
      ],
    },

    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  const token = Cookies.get('jwt_admin_token')

  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router