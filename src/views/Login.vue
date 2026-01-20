<script setup>
import { ref } from "vue";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");

const submitLogin = async () => {
  if (!email.value || !password.value) {
    error.value = "Vui lòng nhập email và mật khẩu.";
    return;
  }

  loading.value = true;

  try {
    const res = await axios.post("http://localhost:8082/api/auth/login-admin", {
      email: email.value,
      matkhau: password.value,
    });

    if (res.data.code === 200) {
      const token = res.data.result;
      Cookies.set("jwt_admin_token", token);
      auth.setToken(token);
      await auth.fetchUser();
      router.push({ name: "Home" });
    } else {
      error.value = res.data.message || "Đăng nhập thất bại.";
    }
  } catch (e) {
    console.error("Lỗi đăng nhập", e);
    error.value = e.response?.data?.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center px-3">
    <div
      class="bg-white w-full max-w-md rounded-2xl p-8 shadow-xl relative overflow-hidden"
    >
      <div
        class="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 rounded-full opacity-40"
      ></div>

      <!-- Logo + Title -->
      <div class="text-center relative z-10 mb-6">
        <img src="/logo.png" alt="Logo" class="w-48 object-contain mx-auto" />
        <h2 class="text-lg font-semibold mt-1">Đăng nhập quản trị</h2>
        <p class="text-sm text-gray-500 mt-1">Nhập thông tin tài khoản để tiếp tục</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-3 text-sm text-red-600">
        {{ error }}
      </div>

      <!-- Form -->
      <form @submit.prevent="submitLogin" class="space-y-4 relative z-10">
        <!-- Email -->
        <div>
          <label class="text-sm font-medium">Email</label>
          <input
            v-model="email"
            type="email"
            class="w-full mt-1 px-4 py-3 bg-blue-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            placeholder="email@domain.com"
          />
        </div>

        <!-- Password -->
        <div>
          <label class="text-sm font-medium">Mật khẩu</label>
          <div class="relative mt-1">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="w-full px-4 py-3 bg-blue-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
            >
              <i
                :class="showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"
              ></i>
            </button>
          </div>
        </div>

        <!-- Login Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 mt-2 text-white font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 transition disabled:opacity-50"
        >
          {{ loading ? "Đang đăng nhập..." : "ĐĂNG NHẬP" }}
        </button>

        <!-- Links -->
        <div class="flex justify-between text-sm text-gray-600 mt-1">
          <a href="#" class="hover:underline">Quên mật khẩu?</a>
        </div>
      </form>

      <!-- Footer -->
      <p class="text-center text-xs text-gray-400 mt-6 relative z-10">
        Thiết kế bởi đấu giá STU — © 2025
      </p>
    </div>
  </div>
</template>
