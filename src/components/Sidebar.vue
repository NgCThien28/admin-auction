<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const items = [
  { label: "Màn hình chính", name: "Home", icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" },
  {
    label: "Quản lý người dùng",
    name: "Users",
    icon:
      "M5.5 22a1.5 1.5 0 0 1-1.5-1.5v-1A4.5 4.5 0 0 1 8.5 15h7a4.5 4.5 0 0 1 4.5 4.5v1A1.5 1.5 0 0 1 18.5 22h-13zM12 13a5 5 0 1 1 0-10 5 5 0 0 1 0 10z",
  },
  {
    label: "Phiên đấu giá",
    name: "Auctions",
    icon: "M4 4h16v4H4zm2 6h12v2H6zm0 4h12v2H6zm0 4h8v2H6z",
  },
  { label: "Báo cáo", name: "Reports", icon: "M3 13h6v8H3zm12-6h6v14h-6zM9 3h6v18H9z" },
];

const isActive = (name) => computed(() => route.name === name);
</script>

<template>
  <aside class="w-64 shrink-0 bg-white border-r border-gray-200 min-h-screen">
    <!-- Logo -->
    <div class="px-4 py-5 border-b">
      <div class="text-3xl font-extrabold select-none">
        <span class="text-red-600">VN</span><span class="text-blue-600">PAY</span>
      </div>
      <p class="text-xs text-gray-500 mt-1">Cho cuộc sống đơn giản hơn</p>
    </div>

    <!-- Nav -->
    <nav class="p-3">
      <h3
        class="px-2 text-[11px] tracking-wide text-gray-500 font-semibold uppercase mb-2"
      >
        Thông tin chung
      </h3>
      <ul class="space-y-1">
        <li v-for="it in items" :key="it.name">
          <router-link :to="{ name: it.name }" custom v-slot="{ href, navigate }">
            <a
              :href="href"
              @click.prevent="navigate()"
              class="flex items-center gap-3 px-3 py-2 rounded-md text-sm"
              :class="
                isActive(it.name).value
                  ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
              "
            >
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path :d="it.icon" />
              </svg>
              <span>{{ it.label }}</span>
            </a>
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>
