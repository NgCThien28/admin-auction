<script setup>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";

const users = ref([]);
const loading = ref(false);
const search = ref("");

// pagination state
const page = ref(0);
const size = ref(10);
const totalPages = ref(0);
const totalElements = ref(0);

// popup
const isPopupOpen = ref(false);
const selectedUser = ref(null);
const loadingDetail = ref(false);

// busy map
const busy = ref({});
const setBusy = (matk, val) => {
  busy.value = { ...busy.value, [matk]: val };
};
const isBusy = (matk) => !!busy.value[matk];
const fullName = (u) => `${u?.ho || ""} ${u?.tenlot || ""} ${u?.ten || ""}`.trim();

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await axios.get("http://localhost:8082/api/users/find-all", {
      params: {
        page: page.value,
        size: size.value,
      },
    });

    const result = res.data.result;
    users.value = result.content;
    totalPages.value = result.page.totalPages;
    totalElements.value = result.page.totalElements;
  } catch (e) {
    console.error(e);
    alert("Không tải được danh sách user.");
  } finally {
    loading.value = false;
  }
};

const fetchUserDetail = async (matk) => {
  loadingDetail.value = true;
  try {
    const res = await axios.get(`http://localhost:8082/api/users/${matk}`);
    selectedUser.value = res.data.result;
  } catch (e) {
    console.error(e);
    alert("Không tải được chi tiết user.");
  } finally {
    loadingDetail.value = false;
  }
};

const banUser = async (matk) => {
  if (!confirm("Khoá tài khoản này?")) return;
  setBusy(matk, true);
  try {
    const res = await axios.put(`http://localhost:8082/api/admins/banned-user/${matk}`);
    replaceUser(res.data.result);
  } finally {
    setBusy(matk, false);
  }
};

const unbanUser = async (matk) => {
  if (!confirm("Mở khoá tài khoản này?")) return;
  setBusy(matk, true);
  try {
    const res = await axios.put(`http://localhost:8082/api/admins/unban-user/${matk}`);
    replaceUser(res.data.result);
  } finally {
    setBusy(matk, false);
  }
};

const filteredUsers = computed(() => {
  if (!search.value) return users.value;
  const q = search.value.toLowerCase();
  return users.value.filter(
    (u) =>
      fullName(u).toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.matk || "").toLowerCase().includes(q)
  );
});

const goToPage = (p) => {
  if (p < 0 || p >= totalPages.value) return;
  page.value = p;
};
const nextPage = () => goToPage(page.value + 1);
const prevPage = () => goToPage(page.value - 1);

const openPopup = async (u) => {
  isPopupOpen.value = true;
  await fetchUserDetail(u.matk);
};
const closePopup = () => {
  isPopupOpen.value = false;
  selectedUser.value = null;
};

const replaceUser = (newUser) => {
  users.value = users.value.map((u) =>
    u.matk === newUser.matk ? { ...u, ...newUser } : u
  );
  if (selectedUser.value?.matk === newUser.matk) {
    selectedUser.value = { ...selectedUser.value, ...newUser };
  }
};
const toggleBan = (u) => {
  if (u.trangthaidangnhap === "Đang hoạt động" || u.trangthaidangnhap === "Ngoại tuyến") {
    banUser(u.matk);
  } else {
    unbanUser(u.matk);
  }
};

watch(page, fetchUsers);
onMounted(fetchUsers);
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold text-gray-800">Quản lý người dùng</h1>

      <input
        v-model="search"
        type="text"
        placeholder="Tìm kiếm người dùng..."
        class="px-3 py-2 border rounded-md text-sm bg-white shadow-sm w-64 focus:border-blue-600 focus:ring-2 focus:ring-blue-300"
      />
    </div>

    <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div v-if="loading" class="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>

      <!-- Table -->
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="px-4 py-3 text-center font-medium">Mã tài khoản</th>
            <th class="px-4 py-3 text-center font-medium">Họ tên</th>
            <th class="px-4 py-3 text-center font-medium">Tình trạng xác thực</th>
            <th class="px-4 py-3 text-center font-medium">Trạng thái</th>
            <th class="px-4 py-3 text-center font-medium">Hành động</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="u in filteredUsers" :key="u.matk" class="border-t hover:bg-gray-50">
            <td class="px-4 py-3 text-center font-medium">{{ u.matk }}</td>
            <td class="px-4 py-3 text-center font-medium">{{ fullName(u) }}</td>

            <td class="px-4 py-3 text-center">
              <span
                class="px-2 py-1 text-xs rounded-full"
                :class="
                  u.xacthuctaikhoan === 'Đã xác thực'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                "
              >
                {{ u.xacthuctaikhoan }}
              </span>
            </td>

            <td class="px-4 py-3 text-center">
              <span
                class="px-2 py-1 text-xs rounded-full"
                :class="
                  u.trangthaidangnhap === 'Đang hoạt động' ||
                  u.trangthaidangnhap === 'Ngoại tuyến'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-700'
                "
              >
                {{ u.trangthaidangnhap }}
              </span>
            </td>

            <td class="px-4 py-3 flex items-center justify-center gap-2">
              <button
                @click="openPopup(u)"
                class="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Chi tiết
              </button>
              <button
                @click="toggleBan(u)"
                :disabled="isBusy(u.matk)"
                :title="
                  u.trangthaidangnhap === 'Đang hoạt động' ||
                  u.trangthaidangnhap === 'Ngoại tuyến'
                    ? 'Khoá tài khoản'
                    : 'Mở khoá tài khoản'
                "
                class="px-3 py-1 text-xs rounded-md text-white"
                :class="
                  u.trangthaidangnhap === 'Đang hoạt động' ||
                  u.trangthaidangnhap === 'Ngoại tuyến'
                    ? 'bg-red-600 hover:bg-red-700 disabled:opacity-50'
                    : 'bg-green-600 hover:bg-green-700 disabled:opacity-50'
                "
              >
                <span v-if="isBusy(u.matk)">...</span>
                <span v-else>
                  {{
                    u.trangthaidangnhap === "Đang hoạt động" ||
                    u.trangthaidangnhap === "Ngoại tuyến"
                      ? "Khoá"
                      : "Mở khoá"
                  }}
                </span>
              </button>
            </td>
          </tr>

          <tr v-if="filteredUsers.length === 0">
            <td colspan="8" class="text-center py-4 text-gray-500">
              Không tìm thấy người dùng nào.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Pagination -->
    <div class="flex items-center justify-center mt-4 text-sm">
      <div class="flex items-center gap-1">
        <button
          @click="prevPage"
          :disabled="page === 0"
          class="px-3 py-1 border rounded disabled:opacity-40"
        >
          ‹
        </button>

        <button
          v-for="p in totalPages"
          :key="p"
          @click="goToPage(p - 1)"
          class="px-3 py-1 border rounded"
          :class="page === p - 1 ? 'bg-blue-600 text-white' : ''"
        >
          {{ p }}
        </button>

        <button
          @click="nextPage"
          :disabled="page >= totalPages - 1"
          class="px-3 py-1 border rounded disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>

    <!-- Popup detail user -->
    <div
      v-if="isPopupOpen"
      class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center"
    >
      <div
        class="bg-white w-[460px] rounded-xl border border-gray-200 shadow-xl p-6"
      >
        <div class="flex justify-between items-center mb-4 border-b pb-2">
          <h2 class="text-lg font-semibold text-gray-800">Thông tin người dùng</h2>
          <button
            @click="closePopup"
            class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>

        <div v-if="loadingDetail" class="p-6 text-center text-gray-500">Đang tải...</div>

        <div
          v-else-if="selectedUser"
          class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"
        >
          <div class="bg-gray-50 rounded-lg p-3 min-w-0">
            <span class="text-xs text-gray-800">Mã tài khoản</span>
            <p class="text-sm font-medium text-gray-900 whitespace-normal wrap-break-word">
              {{ selectedUser.matk }}
            </p>
          </div>

          <div class="bg-gray-50 rounded-lg p-3 min-w-0">
            <span class="text-xs text-gray-800">Họ tên</span>
            <p class="text-sm font-medium text-gray-900 whitespace-normal wrap-break-word">
              {{ fullName(selectedUser) }}
            </p>
          </div>

          <div class="bg-gray-50 rounded-lg p-3 min-w-0">
            <span class="text-xs text-gray-800">Email</span>
            <p class="text-sm font-medium text-gray-900 whitespace-normal wrap-break-word">
              {{ selectedUser.email }}
            </p>
          </div>

          <div class="bg-gray-50 rounded-lg p-3 min-w-0">
            <span class="text-xs text-gray-800">SĐT</span>
            <p class="text-sm font-medium text-gray-900 whitespace-normal wrap-break-word">
              {{ selectedUser.sdt }}
            </p>
          </div>

          <div class="bg-gray-50 rounded-lg p-3 min-w-0">
            <span class="text-xs text-gray-800">Thành phố</span>
            <p class="text-sm font-medium text-gray-900 whitespace-normal wrap-break-word">
              {{ selectedUser.thanhPho?.tentp }}
            </p>
          </div>

          <div class="bg-gray-50 rounded-lg p-3 min-w-0">
            <span class="text-xs text-gray-800">Địa chỉ</span>
            <p class="text-sm font-medium text-gray-900 whitespace-normal wrap-break-word">
              {{ selectedUser.diachi }}
            </p>
          </div>
          <div class="bg-gray-50 rounded-lg p-3 min-w-0">
            <span class="text-xs text-gray-800">Địa chỉ giao hàng</span>
            <p class="text-sm font-medium text-gray-900 whitespace-normal wrap-break-word">
              {{ selectedUser.diachigiaohang }}
            </p>
          </div>

          <div class="bg-gray-50 rounded-lg p-3 min-w-0">
            <span class="text-xs text-gray-800">Trạng thái đăng nhập</span>
            <p class="text-sm font-medium text-gray-900 whitespace-normal wrap-break-word">
              {{ selectedUser.trangthaidangnhap }}
            </p>
          </div>
          <div class="bg-gray-50 rounded-lg p-3 min-w-0">
            <span class="text-xs text-gray-800">Trạng thái xác thực</span>
            <p class="text-sm font-medium text-gray-900 whitespace-normal wrap-break-word">
              {{ selectedUser.xacthuctaikhoan }}
            </p>
          </div>
          <div class="bg-gray-50 rounded-lg p-3 min-w-0">
            <span class="text-xs text-gray-800">Trạng thái xác thực căn cước</span>
            <p class="text-sm font-medium text-gray-900 whitespace-normal wrap-break-word">
              {{ selectedUser.xacthuckyc }}
            </p>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button
            @click="toggleBan(selectedUser)"
            :disabled="isBusy(selectedUser?.matk)"
            class="px-4 py-2 rounded-md text-sm text-white bg-black hover:bg-gray-800 disabled:opacity-50"
          >
            {{
              selectedUser?.trangthaidangnhap === "Đang hoạt động" ||
              selectedUser?.trangthaidangnhap === "Ngoại tuyến"
                ? "Khoá tài khoản"
                : "Mở khoá tài khoản"
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
