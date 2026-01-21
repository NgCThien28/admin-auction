<script setup>
import { ref, onMounted, computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import Cookies from "js-cookie";
import { useToast } from '@/stores/useToast.js';
import { add } from "lodash-es";

const { addToast } = useToast();
const router = useRouter();
const auctions = ref([]);
const loading = ref(true);
const search = ref("");

// Filter status
const statusOptions = [
  { label: "Chờ duyệt", value: "PENDING_APPROVAL" },
  { label: "Chưa bắt đầu", value: "NOT_STARTED" },
  { label: "Đang diễn ra", value: "IN_PROGRESS" },
  { label: "Thành công", value: "SUCCESS" },
  { label: "Thất bại", value: "FAILED" },
  { label: "Đã huỷ", value: "CANCELLED" },
];
const selectedStatuses = ref([]);
const page = ref(0);
const size = ref(10);
const totalPages = ref(0);
const totalElements = ref(0);

const isPopupOpen = ref(false);
const selectedAuction = ref(null);

const token = Cookies.get("jwt_admin_token");

const fetchAuctions = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      size: size.value,
    };
    if (selectedStatuses.value.length > 0) {
      params.status = selectedStatuses.value;
    }
    const res = await axios.get("http://localhost:8082/api/auctions/find-by-status", {
      params,
      paramsSerializer: (params) =>
        Object.entries(params)
          .map(([k, v]) =>
            Array.isArray(v)
              ? v
                  .map((item) => `${encodeURIComponent(k)}=${encodeURIComponent(item)}`)
                  .join("&")
              : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
          )
          .join("&"),
    });
    const pageData = res.data.result;
    auctions.value = pageData.content || [];
    totalPages.value = pageData.page.totalPages ?? 0;
    totalElements.value = pageData.page.totalElements ?? 0;
  } catch (err) {
    console.error("Lỗi API phiên đấu giá:", err);
  } finally {
    loading.value = false;
  }
};

// Giữ lại search cục bộ trên trang hiện tại
const filteredAuctions = computed(() => {
  const q = (search.value || "").toLowerCase();
  return auctions.value.filter((a) => {
    if (!q) return true;
    return (
      a.maphiendg?.toLowerCase().includes(q) ||
      a.sanPham?.tensp?.toLowerCase().includes(q)
    );
  });
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

// Formatted refs for price inputs
const formattedGiakhoidiem = ref("");
const formattedBuocgia = ref("");
const formattedTiencoc = ref("");

const isRejectModalOpen = ref(false);
const selectedAuctionForReject = ref(null);
const rejectData = reactive({
  tieude: "",
  noidung: "",
});

const errors = reactive({
  thoigianbd: "",
  thoigiankt: "",
  thoigianbddk: "",
  thoigianktdk: "",
  giakhoidiem: "",
  buocgia: "",
  tiencoc: "",
});

const actionLoading = reactive({});

const validateTimes = () => {
  const now = new Date();
  const startAuction = new Date(approveData.thoigianbd);
  const endAuction = new Date(approveData.thoigiankt);
  const startReg = new Date(approveData.thoigianbddk);
  const endReg = new Date(approveData.thoigianktdk);

  Object.keys(errors).forEach((key) => (errors[key] = ""));

  if (!approveData.thoigianbd) errors.thoigianbd = "Chưa chọn thời gian bắt đầu phiên.";
  else if (startAuction < now) errors.thoigianbd = "Bắt đầu phiên phải ở tương lai.";

  if (!approveData.thoigiankt) errors.thoigiankt = "Chưa chọn thời gian kết thúc phiên.";
  else if (endAuction <= startAuction)
    errors.thoigiankt = "Kết thúc phiên phải > bắt đầu phiên.";

  if (!approveData.thoigianbddk)
    errors.thoigianbddk = "Chưa chọn thời gian bắt đầu đăng ký.";
  else if (startReg < now) errors.thoigianbddk = "Bắt đầu đăng ký phải ở tương lai.";
  else if (startReg >= startAuction)
    errors.thoigianbddk = "Bắt đầu đăng ký phải < bắt đầu phiên.";

  if (!approveData.thoigianktdk)
    errors.thoigianktdk = "Chưa chọn thời gian kết thúc đăng ký.";
  else if (endReg <= startReg)
    errors.thoigianktdk = "Kết thúc đăng ký phải > bắt đầu đăng ký.";
  else if (endReg >= startAuction)
    errors.thoigianktdk = "Kết thúc đăng ký phải < bắt đầu phiên.";

  if (!approveData.giakhoidiem || approveData.giakhoidiem <= 0)
    errors.giakhoidiem = "Giá khởi điểm phải > 0.";
  if (!approveData.buocgia || approveData.buocgia <= 0)
    errors.buocgia = "Bước giá phải > 0.";
  if (!approveData.tiencoc || approveData.tiencoc < 10000)
    errors.tiencoc = "Tiền cọc phải ≥ 10.000.";
};

function validateNumberField(field) {
  const val = approveData[field];
  if (val === "" || val === null || val === undefined) {
    errors[field] = "Vui lòng nhập số.";
    return;
  }
  const n = Number(val);
  if (Number.isNaN(n)) {
    errors[field] = "Giá trị không hợp lệ.";
  } else if (field === "tiencoc" && n < 10000) {
    errors[field] = "Tiền cọc phải ≥ 10.000.";
  } else if (n <= 0) {
    errors[field] = "Phải > 0.";
  } else {
    errors[field] = "";
  }
}

watch(
  () => approveData.thoigianbd,
  () => validateTimes()
);
watch(
  () => approveData.thoigiankt,
  () => validateTimes()
);
watch(
  () => approveData.thoigianbddk,
  () => validateTimes()
);
watch(
  () => approveData.thoigianktdk,
  () => validateTimes()
);
watch(
  () => approveData.giakhoidiem,
  () => validateNumberField("giakhoidiem")
);
watch(
  () => approveData.buocgia,
  () => validateNumberField("buocgia")
);
watch(
  () => approveData.tiencoc,
  () => validateNumberField("tiencoc")
);

const toLocalInput = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
};

function openApproveModal(auction) {
  closePopup();
  selectedAuctionForApprove.value = { ...auction };
  Object.assign(approveData, {
    thoigianbd: toLocalInput(auction.thoigianbd),
    thoigiankt: toLocalInput(auction.thoigiankt),
    thoigianbddk: toLocalInput(auction.thoigianbddk),
    thoigianktdk: toLocalInput(auction.thoigianktdk),
    giakhoidiem: auction.giakhoidiem || "",
    buocgia: auction.buocgia || "",
    tiencoc: auction.tiencoc || "",
  });
  // Initialize formatted values
  formattedGiakhoidiem.value = approveData.giakhoidiem ? new Intl.NumberFormat("vi-VN").format(approveData.giakhoidiem) : "";
  formattedBuocgia.value = approveData.buocgia ? new Intl.NumberFormat("vi-VN").format(approveData.buocgia) : "";
  formattedTiencoc.value = approveData.tiencoc ? new Intl.NumberFormat("vi-VN").format(approveData.tiencoc) : "";
  validateTimes();
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
  formattedGiakhoidiem.value = "";
  formattedBuocgia.value = "";
  formattedTiencoc.value = "";
}

async function submitApprove() {
  validateTimes();
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

  actionLoading[id] = true;
  try {
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

    const index = auctions.value.findIndex((a) => a.maphiendg === id);
    if (index !== -1) {
      if (res.data.result) {
        Object.assign(auctions.value[index], res.data.result);
      } else {
        Object.assign(auctions.value[index], {
          thoigianbd: body.thoigianbd,
          thoigiankt: body.thoigiankt,
          thoigianbddk: body.thoigianbddk,
          thoigianktdk: body.thoigianktdk,
          giakhoidiem: body.giakhoidiem,
          buocgia: body.buocgia,
          tiencoc: body.tiencoc,
          trangthai: "Đã duyệt",
        });
      }
    }
    addToast("Duyệt thành công!", 'success');
    closeApproveModal();
  } catch (err) {
    console.error(err);
    addToast("Duyệt thất bại!", "error");
  } finally {
    actionLoading[id] = false;
  }
}

function openRejectModal(auction) {
  closePopup();
  selectedAuctionForReject.value = { ...auction };
  Object.assign(rejectData, { tieude: "", noidung: "" });
  isRejectModalOpen.value = true;
}

function closeRejectModal() {
  isRejectModalOpen.value = false;
  selectedAuctionForReject.value = null;
  Object.assign(rejectData, { tieude: "", noidung: "" });
}

async function submitReject() {
  const id = selectedAuctionForReject.value.maphiendg;
  if (!id) return;
  if (
    !confirm(
      `Bạn chắc chắn muốn từ chối phiên đấu giá "${selectedAuctionForReject.value.maphiendg}"?`
    )
  )
    return;

  actionLoading[id] = true;
  try {
    const body = { ...rejectData };
    const res = await axios.put(`http://localhost:8082/api/auctions/reject/${id}`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const index = auctions.value.findIndex((a) => a.maphiendg === id);
    if (index !== -1) {
      auctions.value[index].trangthai = res.data.result?.trangthai || "Đã từ chối";
    }
    addToast("Từ chối thành công!", "success");
    closeRejectModal();
  } catch (err) {
    console.error(err);
    addToast("Từ chối thất bại!", "error");
  } finally {
    actionLoading[id] = false;
  }
}

const goToAuctionRoom = (auction) => {
  const id = auction?.maphiendg;
  if (!id) return;
  router.push({ name: "AuctionRoom", params: { id } });
};

watch(selectedStatuses, () => {
  page.value = 0;
  fetchAuctions();
});
watch(size, () => {
  page.value = 0;
  fetchAuctions();
});

onMounted(fetchAuctions);

// Hàm format VNĐ
const formatCurrency = (n) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
};

// Hàm xử lý format giá (tái sử dụng từ product-management.vue)
function onPriceInput(field, e) {
  let val = e.target.value.replace(/[^\d]/g, ""); // Chỉ giữ số
  approveData[field] = val ? Number(val) : null;
  if (field === "giakhoidiem") {
    formattedGiakhoidiem.value = val ? new Intl.NumberFormat("vi-VN").format(Number(val)) : "";
  } else if (field === "buocgia") {
    formattedBuocgia.value = val ? new Intl.NumberFormat("vi-VN").format(Number(val)) : "";
  } else if (field === "tiencoc") {
    formattedTiencoc.value = val ? new Intl.NumberFormat("vi-VN").format(Number(val)) : "";
  }
}
</script>

<template>
  <div>
    <!-- Header + Filters -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h1 class="text-xl font-semibold text-gray-800">Quản lý phiên đấu giá</h1>

      <div class="flex items-center gap-2">
        <div class="flex flex-wrap gap-2">
          <label
            v-for="opt in statusOptions"
            :key="opt.value"
            class="flex items-center gap-1 text-sm px-2 py-1 border rounded"
          >
            <input
              type="checkbox"
              :value="opt.value"
              v-model="selectedStatuses"
              class="h-4 w-4"
            />
            <span>{{ opt.label }}</span>
          </label>
        </div>

        <input
          v-model="search"
          type="text"
          placeholder="Tìm kiếm phiên đấu giá..."
          class="px-3 py-2 border rounded-md text-sm bg-white w-64 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-300"
        />

        <select
          v-model.number="size"
          class="px-2 py-2 border rounded-md text-sm bg-white shadow-sm"
        >
          <option :value="5">5 / trang</option>
          <option :value="10">10 / trang</option>
          <option :value="20">20 / trang</option>
        </select>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div v-if="loading" class="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="px-4 py-3 text-center font-medium">Mã phiên</th>
            <th class="px-4 py-3 text-center font-medium">Sản phẩm</th>
            <th class="px-4 py-3 text-center font-medium">Thời gian bắt đầu</th>
            <th class="px-4 py-3 text-center font-medium">Thành phố</th>
            <th class="px-4 py-3 text-center font-medium">Trạng thái</th>
            <th class="px-4 py-3 text-center font-medium">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="a in filteredAuctions"
            :key="a.maphiendg"
            class="border-t hover:bg-gray-50"
          >
            <td class="px-4 py-3 font-medium text-center">
              {{ a.maphiendg }}
            </td>

            <td class="px-4 py-3 font-medium text-center">
              {{ a.sanPham.tensp }}
            </td>

            <td class="px-4 py-3 font-medium text-center">
              {{ formatDate(a.thoigianbd) }}
            </td>

            <td class="px-4 py-3 font-medium text-center">
              {{ a.sanPham.thanhpho?.tentp }}
            </td>

            <td class="px-4 py-3 font-medium text-center">
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

            <td class="px-4 py-3 text-center space-x-2">
              <template v-if="a.trangthai === 'Chờ duyệt'">
                <button
                  @click.stop="openApproveModal(a)"
                  :disabled="actionLoading[a.maphiendg]"
                  class="px-3 py-1.5 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                >
                  <span v-if="actionLoading[a.maphiendg]">Đang...</span>
                  <span v-else>Duyệt</span>
                </button>

                <button
                  @click.stop="openRejectModal(a)"
                  :disabled="actionLoading[a.maphiendg]"
                  class="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  <span v-if="actionLoading[a.maphiendg]">Đang...</span>
                  <span v-else>Từ chối</span>
                </button>
              </template>

              <button
                v-if="a.trangthai === 'Đang diễn ra'"
                @click.stop="goToAuctionRoom(a)"
                class="px-3 py-1.5 text-xs rounded-md bg-purple-600 text-white hover:bg-purple-700"
              >
                Truy cập phiên
              </button>

              <button
                @click.stop="openPopup(a)"
                class="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
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

    <!-- Pagination -->
    <div class="flex items-center justify-between mt-3 text-sm text-gray-600">
      <div>
        Trang {{ page + 1 }} / {{ totalPages || 1 }} — Tổng: {{ totalElements }} phiên
      </div>
      <div class="flex gap-2">
        <button
          class="px-3 py-1 border rounded disabled:opacity-50"
          :disabled="page === 0"
          @click="
            page = Math.max(0, page - 1);
            fetchAuctions();
          "
        >
          Trước
        </button>
        <button
          class="px-3 py-1 border rounded disabled:opacity-50"
          :disabled="page + 1 >= totalPages"
          @click="
            page = page + 1;
            fetchAuctions();
          "
        >
          Sau
        </button>
      </div>
    </div>

    <!-- Popup -->
    <div
      v-if="isPopupOpen"
      class="fixed inset-0 bg-gray-200/80 flex items-center justify-center p-4"
    >
      <div class="bg-white w-96 p-5 rounded-xl shadow-lg">
        <h2 class="text-lg font-semibold mb-3 text-gray-800 text-center">Chi tiết phiên đấu giá</h2>

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
            {{ formatCurrency(selectedAuction.giakhoidiem) }}
          </p>
          <p>
            <strong>Giá cao nhất đạt được:</strong>
            {{ formatCurrency(selectedAuction.giacaonhatdatduoc) }}
          </p>
          <p><strong>Bước giá:</strong> {{ formatCurrency(selectedAuction.buocgia) }}</p>
          <p><strong>Tiền cọc:</strong> {{ formatCurrency(selectedAuction.tiencoc) }}</p>
          <p>
            <strong>Số lượng người tham gia:</strong> {{ selectedAuction.slnguoithamgia }}
          </p>
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button
            v-if="selectedAuction.trangthai === 'Đang diễn ra'"
            @click="goToAuctionRoom(selectedAuction)"
            class="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
          >
            Truy cập phiên
          </button>
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
      </div>
    </div>

    <!-- MODAL APPROVE -->
    <div
      v-if="isApproveModalOpen"
      class="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
    >
      <div class="bg-white rounded-xl w-full max-w-3xl shadow-xl overflow-hidden p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
          Chỉnh sửa và duyệt phiên đấu giá: {{ selectedAuctionForApprove?.maphiendg }}
        </h3>

        <form @submit.prevent="submitApprove" class="space-y-4">
          <!-- Form 2 cột -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label class="block text-sm font-medium text-gray-700">Giá khởi điểm</label>
              <input
                v-model="formattedGiakhoidiem"
                type="text"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Ví dụ: 1.000.000"
                @input="onPriceInput('giakhoidiem', $event)"
                :class="{ 'border-red-500': errors.giakhoidiem }"
              />
              <small v-if="errors.giakhoidiem" class="text-red-500 text-sm mt-1">{{
                errors.giakhoidiem
              }}</small>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Bước giá</label>
              <input
                v-model="formattedBuocgia"
                type="text"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Ví dụ: 100.000"
                @input="onPriceInput('buocgia', $event)"
                :class="{ 'border-red-500': errors.buocgia }"
              />
              <small v-if="errors.buocgia" class="text-red-500 text-sm mt-1">{{
                errors.buocgia
              }}</small>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Tiền cọc</label>
              <input
                v-model="formattedTiencoc"
                type="text"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Ví dụ: 500.000"
                @input="onPriceInput('tiencoc', $event)"
                :class="{ 'border-red-500': errors.tiencoc }"
              />
              <small v-if="errors.tiencoc" class="text-red-500 text-sm mt-1">{{
                errors.tiencoc
              }}</small>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="closeApproveModal"
              class="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="actionLoading[selectedAuctionForApprove?.maphiendg]"
              class="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            >
              Lưu và Duyệt
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL REJECT -->
    <div
      v-if="isRejectModalOpen"
      class="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
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
              :disabled="actionLoading[selectedAuctionForReject?.maphiendg]"
              class="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              Gửi và Từ chối
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>