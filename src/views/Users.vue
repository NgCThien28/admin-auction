<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

const users = ref([]);
const loading = ref(true);
const search = ref("");

// --- Popup state ---
const isPopupOpen = ref(false);
const selectedUser = ref(null);

// mở popup
const openPopup = (user) => {
  selectedUser.value = user;
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
  } finally {
    loading.value = false;
  }
};

const fullName = (u) => `${u.ho} ${u.tenlot} ${u.ten}`.trim();

const filteredUsers = computed(() => {
  if (!search.value) return users.value;
  return users.value.filter(
    (u) =>
      fullName(u).toLowerCase().includes(search.value.toLowerCase()) ||
      u.email.toLowerCase().includes(search.value.toLowerCase()) ||
      u.matk.toLowerCase().includes(search.value.toLowerCase())
  );
});

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
            <th class="px-4 py-3 text-left font-medium">Mã TK</th>
            <th class="px-4 py-3 text-left font-medium">Họ tên</th>
            <th class="px-4 py-3 text-left font-medium">Email</th>
            <th class="px-4 py-3 text-left font-medium">SĐT</th>
            <!-- <th class="px-4 py-3 text-left font-medium">Thành phố</th> -->
            <th class="px-4 py-3 text-left font-medium">TT xác thực</th>
            <th class="px-4 py-3 text-left font-medium">Trạng thái</th>
            <th class="px-4 py-3 text-left font-medium">Hành động</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="u in filteredUsers" :key="u.matk" class="border-t hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">
              {{ u.matk }}
            </td>

            <td class="px-4 py-3">{{ fullName(u) }}</td>

            <td class="px-4 py-3">{{ u.email }}</td>

            <td class="px-4 py-3">{{ u.sdt }}</td>

            <!-- <td class="px-4 py-3">{{ u.thanhPho?.tentp }}</td> -->

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
                  u.trangthaidangnhap === 'Đang hoạt động'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-200 text-gray-600'
                "
              >
                {{ u.trangthaidangnhap }}
              </span>
            </td>

            <!-- Button xem -->
            <td class="px-4 py-3">
              <button
                @click="openPopup(u)"
                class="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Xem
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
      class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4"
    >
      <div class="bg-white w-96 p-5 rounded-xl shadow-lg">
        <h2 class="text-lg font-semibold mb-3 text-gray-800">Thông tin chi tiết</h2>

        <div class="space-y-2 text-sm">
          <p><strong>Mã tài khoản:</strong> {{ selectedUser.matk }}</p>
          <p><strong>Họ tên:</strong> {{ fullName(selectedUser) }}</p>
          <p><strong>Email:</strong> {{ selectedUser.email }}</p>
          <p><strong>SĐT:</strong> {{ selectedUser.sdt }}</p>
          <p><strong>Thành phố:</strong> {{ selectedUser.thanhPho?.tentp }}</p>
          <p><strong>Địa chỉ:</strong> {{ selectedUser.diachi }}</p>
          <p><strong>Địa chỉ giao hàng:</strong> {{ selectedUser.diachigiaohang }}</p>
          <p>
            <strong>Trạng thái đăng nhập:</strong> {{ selectedUser.trangthaidangnhap }}
          </p>
          <p><strong>Trạng thái xác thực:</strong> {{ selectedUser.xacthuctaikhoan }}</p>
        </div>

        <div class="mt-4 text-right">
          <button
            @click="closePopup"
            class="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
