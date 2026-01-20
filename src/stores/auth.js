import axios from 'axios'
import { defineStore } from 'pinia'
import Cookies from "js-cookie";

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: Cookies.get('jwt_admin_token') || null,
    loading: false,
  }),

  actions: {
    async fetchUser() {
      if (!this.token) return null
      try {
        this.loading = true
        const res = await axios.get('http://localhost:8082/api/auth/me-admin', {
          headers: { Authorization: `Bearer ${this.token}` },
        })

        if (res.data.code === 200) {
          this.user = res.data.result
          return this.user
        } else {
          this.logout()
        }
      } catch (err) {
        console.error('❌ Lỗi khi fetch user:', err)
        this.logout()
      } finally {
        this.loading = false
      }
    },
    setToken(token) {
      this.token = token
      Cookies.set('jwt_admin_token', token, {
        expires: 7,
        secure: false,
        sameSite: 'Lax',
      })
    },
    logout() {
      this.user = null
      this.token = null
      Cookies.remove('jwt_admin_token')
    },
    
    // 🔹 Load lại user khi reload trang
    async loadUserFromCookies() {
      const token = Cookies.get('jwt_admin_token')
      if (token && !this.user) {
        this.token = token
        await this.fetchUser()
      }
    },
  }
})