<script setup>
import { ref, onMounted, computed, reactive } from "vue";
import axios from "axios";
import Cookies from "js-cookie";

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
const token = Cookies.get("jwt_token");

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

const isApproveModalOpen = ref(false);
const selectedAuctionForApprove = ref(null);
const approveData = reactive({
  thoigianbd: "",
  thoigiankt: "",
  thoigianbddk: "",
  thoigianktdk: "",
  giakhoidiem: "",
  buocgia: "",
  tiencoc: "",
});

const isRejectModalOpen = ref(false);
const selectedAuctionForReject = ref(null);
const rejectData = reactive({
  tieude: "",
  noidung: "",
});

// Thêm errors cho validation
const errors = reactive({
  thoigianbd: "",
  thoigiankt: "",
  thoigianbddk: "",
  thoigianktdk: "",
  giakhoidiem: "",
  buocgia: "",
  tiencoc: "",
});

// Thêm hàm validateTimes (tham khảo auction-create.vue)
const validateTimes = () => {
  const now = new Date();
  const startAuction = new Date(approveData.thoigianbd);
  const endAuction = new Date(approveData.thoigiankt);
  const startReg = new Date(approveData.thoigianbddk);
  const endReg = new Date(approveData.thoigianktdk);

  // Reset errors
  Object.keys(errors).forEach((key) => (errors[key] = ""));

  // Kiểm tra bắt đầu phiên
  if (!approveData.thoigianbd) {
    errors.thoigianbd = "Chưa chọn thời gian bắt đầu phiên.";
  } else if (startAuction < now) {
    errors.thoigianbd = "Bắt đầu phiên phải ở tương lai.";
  }

  // Kiểm tra kết thúc phiên
  if (!approveData.thoigiankt) {
    errors.thoigiankt = "Chưa chọn thời gian kết thúc phiên.";
  } else if (endAuction <= startAuction) {
    errors.thoigiankt = "Kết thúc phiên phải > bắt đầu phiên.";
  }

  // Kiểm tra bắt đầu đăng ký
  if (!approveData.thoigianbddk) {
    errors.thoigianbddk = "Chưa chọn thời gian bắt đầu đăng ký.";
  } else if (startReg < now) {
    errors.thoigianbddk = "Bắt đầu đăng ký phải ở tương lai.";
  } else if (startReg >= startAuction) {
    errors.thoigianbddk = "Bắt đầu đăng ký phải < bắt đầu phiên.";
  }

  // Kiểm tra kết thúc đăng ký
  if (!approveData.thoigianktdk) {
    errors.thoigianktdk = "Chưa chọn thời gian kết thúc đăng ký.";
  } else if (endReg <= startReg) {
    errors.thoigianktdk = "Kết thúc đăng ký phải > bắt đầu đăng ký.";
  } else if (endReg >= startAuction) {
    errors.thoigianktdk = "Kết thúc đăng ký phải < bắt đầu phiên.";
  }

  // Kiểm tra số (nếu cần, thêm logic như auction-create)
  if (!approveData.giakhoidiem || approveData.giakhoidiem <= 0) {
    errors.giakhoidiem = "Giá khởi điểm phải > 0.";
  }
  if (!approveData.buocgia || approveData.buocgia <= 0) {
    errors.buocgia = "Bước giá phải > 0.";
  }
  if (!approveData.tiencoc || approveData.tiencoc < 10000) {
    errors.tiencoc = "Tiền cọc phải ≥ 10.000.";
  }
};

function openApproveModal(auction) {
  selectedAuctionForApprove.value = { ...auction };
  Object.assign(approveData, {
    thoigianbd: auction.thoigianbd || "",
    thoigiankt: auction.thoigiankt || "",
    thoigianbddk: auction.thoigianbddk || "",
    thoigianktdk: auction.thoigianktdk || "",
    giakhoidiem: auction.giakhoidiem || "",
    buocgia: auction.buocgia || "",
    tiencoc: auction.tiencoc || "",
  });
  isApproveModalOpen.value = true;
}

function closeApproveModal() {
  isApproveModalOpen.value = false;
  selectedAuctionForApprove.value = null;
  Object.assign(approveData, {
    thoigianbd: "",
    thoigiankt: "",
    thoigianbddk: "",
    thoigianktdk: "",
    giakhoidiem: "",
    buocgia: "",
    tiencoc: "",
  });
}

// Cập nhật submitApprove để merge dữ liệu và validate trước gửi
async function submitApprove() {
  validateTimes(); // Validate lại trước gửi
  if (Object.values(errors).some((e) => e)) {
    alert(
      "Kiểm tra lại dữ liệu: " +
        Object.values(errors)
          .filter((e) => e)
          .join(", ")
    );
    return;
  }

  const id = selectedAuctionForApprove.value.maphiendg;
  if (!id) return;
  if (
    !confirm(
      `Bạn chắc chắn muốn chỉnh sửa và duyệt phiên đấu giá "${selectedAuctionForApprove.value.maphiendg}"?`
    )
  )
    return;

  try {
    // Format datetime (giữ nguyên)
    const formatDateTime = (isoString) => {
      if (!isoString) return "";
      const date = new Date(isoString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const body = {
      thoigianbd: formatDateTime(approveData.thoigianbd),
      thoigiankt: formatDateTime(approveData.thoigiankt),
      thoigianbddk: formatDateTime(approveData.thoigianbddk),
      thoigianktdk: formatDateTime(approveData.thoigianktdk),
      giakhoidiem: approveData.giakhoidiem,
      buocgia: approveData.buocgia,
      tiencoc: approveData.tiencoc,
    };

    const res = await axios.put(
      `http://localhost:8082/api/auctions/approve/${id}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Cập nhật UI đầy đủ: merge dữ liệu từ response (nếu backend trả về result) hoặc optimistic update
    const index = auctions.value.findIndex((a) => a.maphiendg === id);
    if (index !== -1) {
      if (res.data.result) {
        // Nếu backend trả về auction updated, merge
        Object.assign(auctions.value[index], res.data.result);
      } else {
        // Optimistic update với dữ liệu đã gửi (format lại cho UI)
        Object.assign(auctions.value[index], {
          thoigianbd: body.thoigianbd,
          thoigiankt: body.thoigiankt,
          thoigianbddk: body.thoigianbddk,
          thoigianktdk: body.thoigianktdk,
          giakhoidiem: body.giakhoidiem,
          buocgia: body.buocgia,
          tiencoc: body.tiencoc,
          trangthai: "Đã duyệt", // Hoặc từ response
        });
      }
    }
    alert(res.data.message || "Duyệt thành công!");
    closeApproveModal();
    closePopup(); // Đóng popup chi tiết nếu cần
  } catch (err) {
    console.error(err);
    alert("Duyệt thất bại!");
  }
}

// Hàm mở modal reject
function openRejectModal(auction) {
  selectedAuctionForReject.value = { ...auction };
  Object.assign(rejectData, { tieude: "", noidung: "" });
  isRejectModalOpen.value = true;
}

// Hàm đóng modal reject
function closeRejectModal() {
  isRejectModalOpen.value = false;
  selectedAuctionForReject.value = null;
  Object.assign(rejectData, { tieude: "", noidung: "" });
}

// Hàm submit reject
async function submitReject() {
  const id = selectedAuctionForReject.value.maphiendg;
  if (!id) return;
  if (
    !confirm(
      `Bạn chắc chắn muốn từ chối phiên đấu giá "${selectedAuctionForReject.value.maphiendg}"?`
    )
  )
    return;

  try {
    const body = { ...rejectData }; // JSON body với tieude và noidung
    const res = await axios.put(`http://localhost:8082/api/auctions/reject/${id}`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Cập nhật UI
    const index = auctions.value.findIndex((a) => a.maphiendg === id);
    if (index !== -1) {
      auctions.value[index].trangthai = res.data.result?.trangthai || "Đã từ chối";
    }
    alert(res.data.message || "Từ chối thành công!");
    closeRejectModal();
    closePopup(); // Đóng popup chi tiết nếu cần
  } catch (err) {
    console.error(err);
    alert("Từ chối thất bại!");
  }
}

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
            <th class="px-4 py-3 text-left font-medium">Thời gian bắt đầu</th>
            <th class="px-4 py-3 text-left font-medium">Thành phố</th>
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
              {{ formatDate(a.thoigianbd) }}
            </td>

            <td class="px-4 py-3">
              {{ a.sanPham.thanhpho?.tentp }}
            </td>

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
                Chi tiết
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
      class="fixed inset-0 bg-gray-200/80 flex items-center justify-center p-4"
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
            <strong>Thời gian bắt đầu đăng ký:</strong>
            {{ formatDate(selectedAuction.thoigianbddk) }}
          </p>
          <p>
            <strong>Thời gian kết thúc đăng ký:</strong>
            {{ formatDate(selectedAuction.thoigianktdk) }}
          </p>

          <p>
            <strong>Giá khởi điểm:</strong>
            {{ selectedAuction.giakhoidiem }}đ
          </p>
          <p>
            <strong>Giá cao nhất đạt được:</strong>
            {{ selectedAuction.giacaonhatdatduoc }}đ
          </p>
          <p><strong>Bước giá:</strong> {{ selectedAuction.buocgia }}đ</p>
          <p><strong>Tiền cọc:</strong> {{ selectedAuction.tiencoc }}đ</p>
          <p>
            <strong>Số lượng người tham gia:</strong> {{ selectedAuction.slnguoithamgia }}
          </p>
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button
            v-if="selectedAuction.trangthai === 'Chờ duyệt'"
            @click="openApproveModal(selectedAuction)"
            class="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
          >
            Duyệt
          </button>

          <button
            v-if="selectedAuction.trangthai === 'Chờ duyệt'"
            @click="openRejectModal(selectedAuction)"
            class="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Từ chối
          </button>

          <button
            @click="closePopup"
            class="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
          >
            Đóng
          </button>
        </div>

        <!-- Modal approve, thêm lỗi -->
        <div
          v-if="isApproveModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div class="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">
              Chỉnh sửa và duyệt phiên đấu giá: {{ selectedAuctionForApprove?.maphiendg }}
            </h3>

            <form @submit.prevent="submitApprove" class="space-y-4">
              <!-- Các trường với lỗi -->
              <div>
                <label class="block text-sm font-medium text-gray-700"
                  >Thời gian bắt đầu</label
                >
                <input
                  v-model="approveData.thoigianbd"
                  type="datetime-local"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  :class="{ 'border-red-500': errors.thoigianbd }"
                />
                <small v-if="errors.thoigianbd" class="text-red-500 text-sm mt-1">{{
                  errors.thoigianbd
                }}</small>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700"
                  >Thời gian kết thúc</label
                >
                <input
                  v-model="approveData.thoigiankt"
                  type="datetime-local"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  :class="{ 'border-red-500': errors.thoigiankt }"
                />
                <small v-if="errors.thoigiankt" class="text-red-500 text-sm mt-1">{{
                  errors.thoigiankt
                }}</small>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700"
                  >Thời gian bắt đầu đăng ký</label
                >
                <input
                  v-model="approveData.thoigianbddk"
                  type="datetime-local"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  :class="{ 'border-red-500': errors.thoigianbddk }"
                />
                <small v-if="errors.thoigianbddk" class="text-red-500 text-sm mt-1">{{
                  errors.thoigianbddk
                }}</small>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700"
                  >Thời gian kết thúc đăng ký</label
                >
                <input
                  v-model="approveData.thoigianktdk"
                  type="datetime-local"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  :class="{ 'border-red-500': errors.thoigianktdk }"
                />
                <small v-if="errors.thoigianktdk" class="text-red-500 text-sm mt-1">{{
                  errors.thoigianktdk
                }}</small>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700"
                  >Giá khởi điểm</label
                >
                <input
                  v-model="approveData.giakhoidiem"
                  type="number"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  :class="{ 'border-red-500': errors.giakhoidiem }"
                />
                <small v-if="errors.giakhoidiem" class="text-red-500 text-sm mt-1">{{
                  errors.giakhoidiem
                }}</small>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Bước giá</label>
                <input
                  v-model="approveData.buocgia"
                  type="number"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  :class="{ 'border-red-500': errors.buocgia }"
                />
                <small v-if="errors.buocgia" class="text-red-500 text-sm mt-1">{{
                  errors.buocgia
                }}</small>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Tiền cọc</label>
                <input
                  v-model="approveData.tiencoc"
                  type="number"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  :class="{ 'border-red-500': errors.tiencoc }"
                />
                <small v-if="errors.tiencoc" class="text-red-500 text-sm mt-1">{{
                  errors.tiencoc
                }}</small>
              </div>

              <div class="flex justify-end gap-3">
                <button
                  type="button"
                  @click="closeApproveModal"
                  class="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                >
                  Lưu và Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Thêm modal reject -->
        <div
          v-if="isRejectModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div class="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">
              Lý do từ chối phiên đấu giá: {{ selectedAuctionForReject?.maphiendg }}
            </h3>

            <form @submit.prevent="submitReject" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Tiêu đề</label>
                <input
                  v-model="rejectData.tieude"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                  placeholder="Ví dụ: Phiên đấu giá không hợp lệ"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Nội dung</label>
                <textarea
                  v-model="rejectData.noidung"
                  rows="4"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                  placeholder="Ví dụ: Lý do chi tiết tại sao từ chối."
                ></textarea>
              </div>

              <div class="flex justify-end gap-3">
                <button
                  type="button"
                  @click="closeRejectModal"
                  class="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Gửi và Từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
