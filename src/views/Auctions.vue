<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const auctions = ref([]);
const loading = ref(true);
const search = ref("");

const isPopupOpen = ref(false);
const selectedAuction = ref(null);

const fetchAuctions = async () => {
  loading.value = true;
  try {
    const res = await axios.get("http://localhost:8082/api/auctions/find-all");
    auctions.value = res.data.result || [];
  } catch (err) {
    console.error("Lỗi API phiên đấu giá:", err);
  } finally {
    loading.value = false;
  }
};

const fullName = (u) => `${u.ho} ${u.tenlot} ${u.ten}`.trim();

const filteredAuctions = computed(() => {
  if (!search.value) return auctions.value;
  return auctions.value.filter(
    (a) =>
      a.maphiendg.toLowerCase().includes(search.value.toLowerCase()) ||
      a.sanPham.tensp.toLowerCase().includes(search.value.toLowerCase())
  );
});

const openPopup = (auction) => {
  selectedAuction.value = auction;
  isPopupOpen.value = true;
};

const closePopup = () => {
  isPopupOpen.value = false;
};
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("vi-VN");
};
onMounted(fetchAuctions);
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold text-gray-800">Quản lý phiên đấu giá</h1>

      <input
        v-model="search"
        type="text"
        placeholder="Tìm kiếm phiên đấu giá..."
        class="px-3 py-2 border rounded-md text-sm bg-white w-64 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-300"
      />
    </div>

    <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div v-if="loading" class="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>

      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="px-4 py-3 text-left font-medium">Mã phiên</th>
            <th class="px-4 py-3 text-left font-medium">Sản phẩm</th>
            <th class="px-4 py-3 text-left font-medium">Người bán</th>
            <th class="px-4 py-3 text-left font-medium">Thành phố</th>
            <th class="px-4 py-3 text-left font-medium">Giá khởi điểm</th>
            <th class="px-4 py-3 text-left font-medium">Trạng thái</th>
            <th class="px-4 py-3 text-center font-medium">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="a in filteredAuctions"
            :key="a.maphiendg"
            class="border-t hover:bg-gray-50"
          >
            <td class="px-4 py-3 font-medium text-gray-800">
              {{ a.maphiendg }}
            </td>

            <td class="px-4 py-3">
              {{ a.sanPham.tensp }}
            </td>

            <td class="px-4 py-3">
              {{ fullName(a.taiKhoanNguoiBan) }}
            </td>

            <td class="px-4 py-3">
              {{ a.sanPham.thanhpho?.tentp }}
            </td>

            <td class="px-4 py-3">{{ a.giakhoidiem.toLocaleString() }} đ</td>

            <td class="px-4 py-3">
              <span
                class="px-2 py-1 text-xs rounded-full"
                :class="
                  a.trangthai === 'Chờ thanh toán'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                "
              >
                {{ a.trangthai }}
              </span>
            </td>

            <td class="px-4 py-3 text-center">
              <button
                @click="openPopup(a)"
                class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Xem chi tiết
              </button>
            </td>
          </tr>

          <tr v-if="filteredAuctions.length === 0">
            <td colspan="7" class="text-center py-4 text-gray-500">
              Không tìm thấy phiên đấu giá nào.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Popup chi tiết phiên đấu giá -->
    <div
      v-if="isPopupOpen"
      class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4"
    >
      <div class="bg-white w-96 p-5 rounded-xl shadow-lg">
        <h2 class="text-lg font-semibold mb-3 text-gray-800">Chi tiết phiên đấu giá</h2>

        <div class="space-y-2 text-sm">
          <p><strong>Mã phiên:</strong> {{ selectedAuction.maphiendg }}</p>

          <p>
            <strong>Người bán:</strong>
            {{ selectedAuction.taiKhoanNguoiBan?.ho }}
            {{ selectedAuction.taiKhoanNguoiBan?.tenlot }}
            {{ selectedAuction.taiKhoanNguoiBan?.ten }}
            ({{ selectedAuction.taiKhoanNguoiBan?.email }})
          </p>

          <p><strong>Sản phẩm:</strong> {{ selectedAuction.sanPham?.tensp }}</p>

          <p><strong>Trạng thái:</strong> {{ selectedAuction.trangthai }}</p>

          <p>
            <strong>Thời gian bắt đầu:</strong>
            {{ formatDate(selectedAuction.thoigianbd) }}
          </p>
          <p>
            <strong>Thời gian kết thúc:</strong>
            {{ formatDate(selectedAuction.thoigiankt) }}
          </p>

          <p>
            <strong>Giá khởi điểm:</strong>
            {{ selectedAuction.giakhoidiem.toLocaleString() }}đ
          </p>
          <p>
            <strong>Giá trần:</strong> {{ selectedAuction.giatran.toLocaleString() }}đ
          </p>
          <p>
            <strong>Bước giá:</strong> {{ selectedAuction.buocgia.toLocaleString() }}đ
          </p>
          <p>
            <strong>Tiền cọc:</strong> {{ selectedAuction.tiencoc.toLocaleString() }}đ
          </p>
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
