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
const error = ref("");
const showPassword = ref(false);
const loading = ref(false);

const toast = ref({
  show: false,
  message: "",
  type: "success",
});

function showToast(message, type = "success") {
  toast.value = { show: true, message, type };
  setTimeout(() => (toast.value.show = false), 3000);
}

const onSubmit = async () => {
  error.value = "";
  loading.value = true;

  try {
    const res = await axios.post("http://localhost:8082/api/auth/login-admin", {
      email: email.value,
      matkhau: password.value,
    });

    if (res.data.code === 200) {
      const token = res.data.result;
      Cookies.set("jwt_token", token);
      auth.setToken(token);
      showToast("Đăng nhập thành công!", "success");
      setTimeout(() => {
        router.push({ name: "Home" });
      }, 1000);
    } else {
      error.value = res.data.message || "Đăng nhập thất bại. Vui lòng thử lại.";
    }
  } catch (err) {
    error.value = "Không thể kết nối máy chủ.";
  } finally {
    loading.value = false;
  }
};
</script>
<style>
@import "@/assets/styles/toast.css";
</style>

<template>
  <!-- Toast -->
  <transition name="slide-fade">
    <div
      v-if="toast.show"
      :class="[
        'fixed top-5 right-5 min-w-[250px] px-4 py-3 rounded-lg shadow-md text-gray-800 bg-white border-l-4 z-50',
        toast.type === 'success' ? 'border-green-500' : 'border-red-500',
      ]"
    >
      {{ toast.message }}
    </div>
  </transition>
  <div class="min-h-screen w-full bg-white flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-6 select-none">
        <div class="text-4xl font-extrabold leading-none">
          <span class="text-red-600">VN</span><span class="text-blue-600">PAY</span>
        </div>
        <p class="mt-2 text-sm text-black/80 tracking-wide">ĐĂNG NHẬP VÀO HỆ THỐNG</p>
      </div>

      <!-- Card -->
      <div class="bg-white/95 rounded-md shadow-lg p-6">
        <form @submit.prevent="onSubmit">
          <!-- Error -->
          <div
            v-if="error"
            class="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {{ error }}
          </div>

          <!-- Email -->
          <label class="block text-sm font-medium text-gray-700">
            Email
            <input
              v-model.trim="email"
              type="email"
              placeholder="email@domain.com"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              autocomplete="username"
            />
          </label>

          <!-- Password -->
          <label class="block text-sm font-medium text-gray-700 mt-4">
            Mật khẩu
            <div
              class="mt-1 relative flex items-center rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent"
            >
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full rounded-md px-3 py-2 pr-10 text-gray-900 placeholder:text-gray-400 focus:outline-none"
                autocomplete="current-password"
              />

              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-2 inline-flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 text-gray-500"
              >
                <svg
                  v-if="!showPassword"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7
                           -1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>

                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7
                          a10.05 10.05 0 012.873-4.28M6.1 6.1A9.957 9.957 0 0112 5c4.477 0 8.268
                          2.943 9.542 7a10.05 10.05 0 01-4.201 5.315M3 3l18 18"
                  />
                </svg>
              </button>
            </div>
          </label>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="mt-6 w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-md disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {{ loading ? "Đang đăng nhập..." : "ĐĂNG NHẬP" }}
          </button>

          <p class="mt-4 text-sm text-gray-600 text-center">
            Bạn chưa có tài khoản?
            <a href="/register" class="text-blue-700 hover:underline">Đăng ký</a>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
