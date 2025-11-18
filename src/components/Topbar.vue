<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const user = computed(() => auth.user);
const fullName = computed(() => {
  if (!user.value) return "";
  return `${user.value.ho} ${user.value.tenlot} ${user.value.ten}`.trim();
});
function logout() {
  auth.logout();
  router.replace({ name: "Login" });
}
</script>

<template>
  <header
    class="h-14 border-b border-gray-200 bg-white/95 backdrop-blur flex items-center justify-between px-4"
  >
    <!-- Left -->
    <div class="flex items-center gap-2">
      <button class="text-sm rounded border px-3 py-1.5 bg-gray-50 text-gray-700">
        Màn hình chính
      </button>
      <nav class="hidden md:flex items-center gap-4 text-sm text-gray-600">
        <a href="#" class="hover:text-gray-900">Hướng dẫn</a>
        <a href="#" class="hover:text-gray-900">Trợ giúp</a>
      </nav>
    </div>

    <!-- Right -->
    <div class="flex items-center gap-4">
      <!-- Tên admin -->
      <span class="text-sm font-medium text-gray-700"> 👤 {{ fullName }} </span>

      <!-- Logout -->
      <button
        @click="logout"
        class="rounded bg-red-600 text-white text-sm px-3 py-1.5 hover:bg-red-700"
      >
        Đăng xuất
      </button>
    </div>
  </header>
</template>
