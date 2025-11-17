import { defineStore } from 'pinia'
import Cookies from "js-cookie";

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: Cookies.get('jwt_token') || null,
  }),

  actions: {
    setToken(token) {
      this.token = token
      Cookies.set('jwt_token', token, {
        expires: 7,
        secure: false,
        sameSite: 'Lax',
      })
    },
    logout() {
      this.user = null
      this.token = null
      Cookies.remove('jwt_token')
    }
  }
})