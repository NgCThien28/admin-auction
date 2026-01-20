<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const items = [
  {
    label: "Màn hình chính",
    name: "Home",
    icon:
      "m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z",
  },
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
  {
    label: "Sản phẩm",
    name: "Products",
    icon:
      "M20 6h-3V4a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM9 5h6v1H9zm11 14H4V9h16z",
  },
  {
    label: "Danh mục",
    name: "Categories",
    icon: "M3 5h8v6H3zm10 0h8v6h-8zM3 13h8v6H3zm10 0h8v6h-8z",
  },
  {
    label: "Thành phố",
    name: "Cities",
    icon: "M12 2 3 7v15h6v-6h6v6h6V7z",
  },
];

// Dropdown state cho "Báo cáo"
const reportOpen = ref(false);

const reportItems = [
  {
    label: "Phiếu thanh toán",
    name: "Payments",
  },
  {
    label: "Phiếu tiền cọc",
    name: "Deposits", // đổi thành route name thật của mày nếu khác
  },
];

const isActive = (name) => computed(() => route.name === name);
const isReportActive = computed(() => reportItems.some((x) => x.name === route.name));

const toggleReport = () => {
  reportOpen.value = !reportOpen.value;
};
</script>

<template>
  <aside class="w-64 shrink-0 bg-white border-r border-gray-200 min-h-screen">
    <!-- Logo -->
    <div class="px-4 py-5 border-b">
      <div class="text-3xl font-extrabold select-none">
        <img src="/logo.png" alt="Logo" class="w-48 object-contain mx-auto" />
      </div>
    </div>

    <!-- Nav -->
    <nav class="p-3">
      <h3
        class="px-2 text-[11px] tracking-wide text-gray-500 font-semibold uppercase mb-2"
      >
        Thông tin chung
      </h3>

      <ul class="space-y-1">
        <!-- Các mục thường -->
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

        <!-- Báo cáo (Dropdown) -->
        <li>
          <button
            type="button"
            @click="toggleReport"
            class="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm"
            :class="
              isReportActive
                ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                : 'text-gray-700 hover:bg-gray-50'
            "
          >
            <div class="flex items-center gap-3">
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <!-- Icon "báo cáo" kiểu chart -->
                <path d="M4 19h16v2H4zM6 17V9h2v8H6zm5 0V5h2v12h-2zm5 0v-6h2v6h-2z" />
              </svg>
              <span>Báo cáo</span>
            </div>

            <svg
              class="h-4 w-4 transition-transform"
              :class="reportOpen ? 'rotate-180' : ''"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <ul v-show="reportOpen" class="mt-1 ml-6 space-y-1">
            <li v-for="r in reportItems" :key="r.name">
              <router-link :to="{ name: r.name }" custom v-slot="{ href, navigate }">
                <a
                  :href="href"
                  @click.prevent="navigate()"
                  class="flex items-center gap-2 px-3 py-2 rounded-md text-sm"
                  :class="
                    isActive(r.name).value
                      ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  "
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                  <span>{{ r.label }}</span>
                </a>
              </router-link>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  </aside>
</template>
