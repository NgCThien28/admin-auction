<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

const users = ref([]);
const loading = ref(true);
const search = ref("");

// --- Popup state ---
const isPopupOpen = ref(false);
const selectedUser = ref(null);

// busy per matk to avoid duplicate requests
const busy = ref({}); // busy.value[matk] = true/false
const setBusy = (matk, val) => {
  busy.value = { ...busy.value, [matk]: val };
};
const isBusy = (matk) => !!busy.value[matk];

// mở popup
const openPopup = (user) => {
  selectedUser.value = { ...(user || {}) };
  isPopupOpen.value = true;
};

// đóng popup
const closePopup = () => {
  isPopupOpen.value = false;
  selectedUser.value = null;
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await axios.get("http://localhost:8082/api/users/find-all");
    users.value = res.data.result || [];
  } catch (err) {
    console.error("Lỗi API:", err);
    alert("Không thể tải danh sách người dùng. Kiểm tra kết nối tới server.");
  } finally {
    loading.value = false;
  }
};

const fullName = (u) => {
  if (!u) return "";
  return `${u.ho || ""} ${u.tenlot || ""} ${u.ten || ""}`.trim();
};

const filteredUsers = computed(() => {
  if (!search.value) return users.value;
  const q = search.value.toLowerCase();
  return users.value.filter((u) => {
    return (
      fullName(u).toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.matk || "").toLowerCase().includes(q)
    );
  });
});

// helper to replace single user in users list and update selectedUser if matches
const replaceUser = (newUser) => {
  if (!newUser || !newUser.matk) return;
  users.value = users.value.map((u) => (u.matk === newUser.matk ? { ...newUser } : u));
  if (selectedUser.value && selectedUser.value.matk === newUser.matk) {
    selectedUser.value = { ...newUser };
  }
};

// khoá tài khoản: dùng response.data.result để cập nhật UI
const banUser = async (matk) => {
  if (!matk) return;
  const ok = confirm("Bạn có chắc muốn khoá tài khoản này không?");
  if (!ok) return;

  setBusy(matk, true);
  try {
    const res = await axios.put(`http://localhost:8082/api/admins/banned-user/${matk}`);
    const updated = res.data?.result;
    if (updated) {
      replaceUser(updated);
      alert(res.data?.message);
    } else {
      // nếu backend không trả result, fallback: cập nhật trạng thái thủ công
      replaceUser({ matk, trangthaidangnhap: "Đã bị khoá" });
      alert(res.data?.message);
    }
  } catch (err) {
    console.error("Lỗi khi khoá tài khoản:", err);
    const msg =
      err?.response?.data?.message || "Khoá tài khoản thất bại. Vui lòng thử lại sau.";
    alert(msg);
  } finally {
    setBusy(matk, false);
  }
};

// mở khoá tài khoản: dùng response.data.result để cập nhật UI
const unbanUser = async (matk) => {
  if (!matk) return;
  const ok = confirm("Bạn có chắc muốn mở khoá tài khoản này không?");
  if (!ok) return;

  setBusy(matk, true);
  try {
    const res = await axios.put(`http://localhost:8082/api/admins/unban-user/${matk}`);
    const updated = res.data?.result;
    if (updated) {
      replaceUser(updated);
      alert(res.data?.message || "Mở khoá tài khoản thành công.");
    } else {
      replaceUser({ matk, trangthaidangnhap: "Đang hoạt động" });
      alert(res.data?.message || "Mở khoá tài khoản thành công.");
    }
  } catch (err) {
    console.error("Lỗi khi mở khoá tài khoản:", err);
    const msg =
      err?.response?.data?.message || "Mở khoá tài khoản thất bại. Vui lòng thử lại sau.";
    alert(msg);
  } finally {
    setBusy(matk, false);
  }
};

// toggle tiện lợi: quyết định theo trạng thái hiện tại
const toggleBan = (u) => {
  if (!u || !u.matk) return;
  // backend trả "Đã bị khoá" khi đã khoá trong ví dụ bạn gửi
  if (u.trangthaidangnhap === "Đang hoạt động" || u.trangthaidangnhap === "Ngoại tuyến") {
    banUser(u.matk);
  } else {
    unbanUser(u.matk);
  }
};

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
      <!-- Loading -->
      <div v-if="loading" class="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>

      <!-- Table -->
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="px-4 py-3 text-left font-medium">Họ tên</th>
            <th class="px-4 py-3 text-left font-medium">Email</th>
            <th class="px-4 py-3 text-left font-medium">SĐT</th>
            <th class="px-4 py-3 text-left font-medium">Tình trạng xác thực</th>
            <th class="px-4 py-3 text-left font-medium">Trạng thái</th>
            <th class="px-4 py-3 text-left font-medium">Hành động</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="u in filteredUsers" :key="u.matk" class="border-t hover:bg-gray-50">
            <td class="px-4 py-3">{{ fullName(u) }}</td>
            <td class="px-4 py-3">{{ u.email }}</td>
            <td class="px-4 py-3">{{ u.sdt }}</td>

            <!-- Xác thực -->
            <td class="px-4 py-3">
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

            <!-- Hoạt động -->
            <td class="px-4 py-3">
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

            <!-- Button hành động: Chi tiết + Khoá/Mở khoá -->
            <td class="px-4 py-3 flex items-center gap-2">
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

    <!-- Popup chi tiết user -->
    <div
      v-if="isPopupOpen"
      class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center"
    >
      <div
        class="bg-white w-[460px] rounded-xl border border-gray-200 shadow-xl rounded-2xl p-6"
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

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div class="bg-gray-50 rounded-lg p-3">
            <span class="text-xs text-gray-500">Mã tài khoản</span>
            <p class="text-sm font-medium text-gray-900">
              {{ selectedUser.matk }}
            </p>
          </div>

          <div class="bg-gray-50 rounded-lg p-3">
            <span class="text-xs text-gray-500">Họ tên</span>
            <p class="text-sm font-medium text-gray-900">
              {{ fullName(selectedUser) }}
            </p>
          </div>

          <div class="bg-gray-50 rounded-lg p-3">
            <span class="text-xs text-gray-500">Email</span>
            <p class="text-sm font-medium text-gray-900">
              {{ selectedUser.email }}
            </p>
          </div>

          <div class="bg-gray-50 rounded-lg p-3">
            <span class="text-xs text-gray-500">SĐT</span>
            <p class="text-sm font-medium text-gray-900">
              {{ selectedUser.sdt }}
            </p>
          </div>

          <div class="bg-gray-50 rounded-lg p-3">
            <span class="text-xs text-gray-500">Thành phố</span>
            <p class="text-sm font-medium text-gray-900">
              {{ selectedUser.thanhPho?.tentp }}
            </p>
          </div>

          <div class="bg-gray-50 rounded-lg p-3">
            <span class="text-xs text-gray-500">Địa chỉ</span>
            <p class="text-sm font-medium text-gray-900">
              {{ selectedUser.diachi }}
            </p>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <span class="text-xs text-gray-500">Địac chỉ giao hàng</span>
            <p class="text-sm font-medium text-gray-900">
              {{ selectedUser.diachigiaohang }}
            </p>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <span class="text-xs text-gray-500">Trạng thái đăng nhập</span>
            <p class="text-sm font-medium text-gray-900">
              {{ selectedUser.trangthaidangnhap }}
            </p>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <span class="text-xs text-gray-500">Trạng thái xác thực</span>
            <p class="text-sm font-medium text-gray-900">
              {{ selectedUser.xacthuctaikhoan }}
            </p>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button
            @click="toggleBan(selectedUser)"
            :disabled="isBusy(selectedUser.matk)"
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
