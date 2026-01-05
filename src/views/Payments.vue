<script setup>
import { ref, onMounted, computed, reactive } from "vue";
import axios from "axios";
import Cookies from "js-cookie";

const payments = ref([]);
const loading = ref(true);
const search = ref("");
const selectedType = ref("ALL");

const isPopupOpen = ref(false);
const selectedPayment = ref(null);

const isRejectModalOpen = ref(false);
const selectedPaymentForReject = ref(null);
const rejectData = reactive({
  tieude: "",
  noidung: "",
});

function openRejectModal(payment) {
  selectedPaymentForReject.value = { ...payment };
  Object.assign(rejectData, { tieude: "", noidung: "" });
  isRejectModalOpen.value = true;
}

function closeRejectModal() {
  isRejectModalOpen.value = false;
  selectedPaymentForReject.value = null;
  Object.assign(rejectData, { tieude: "", noidung: "" });
}
const fetchPayments = async () => {
  loading.value = true;
  try {
    payments.value = [];
    if (selectedType.value === "ALL" || selectedType.value === "AUCTION_PAYMENT") {
      const resAuction = await axios.get("http://localhost:8082/api/payments/find-all");
      const auctionPayments = (resAuction.data.result || []).map((p) => ({
        ...p,
        loai: "AUCTION_PAYMENT",
        id: p.matt,
      }));
      payments.value.push(...auctionPayments);
    }
    if (selectedType.value === "ALL" || selectedType.value === "DEPOSIT_PAYMENT") {
      const resDeposit = await axios.get(
        "http://localhost:8082/api/deposit-payments/find-all"
      );
      const depositPayments = (resDeposit.data.result || []).map((p) => ({
        ...p,
        loai: "DEPOSIT_PAYMENT",
        id: p.matc,
      }));
      payments.value.push(...depositPayments);
    }
  } catch (err) {
    console.error("Lỗi API phiếu thanh toán:", err);
  } finally {
    loading.value = false;
  }
};

const token = Cookies.get("jwt_admin_token");

async function submitReject() {
  const payment = selectedPaymentForReject.value;
  if (!payment) return;
  if (!confirm(`Bạn chắc chắn muốn huỷ phiếu thanh toán "${payment.id}"?`)) return;

  try {
    const endpoint =
      payment.loai === "AUCTION_PAYMENT"
        ? `http://localhost:8082/api/payments/cancel-payment/${payment.matt}`
        : `http://localhost:8082/api/deposit-payments/cancel-payment/${payment.matc}`;
    const body = { tieude: rejectData.tieude, noidung: rejectData.noidung };
    const res = await axios.put(endpoint, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const index = payments.value.findIndex((p) => p.id === payment.id);
    if (index !== -1)
      payments.value[index].trangthai = res.data.result?.trangthai || "Bị hủy";
    alert(res.data.message);
    closeRejectModal();
    closePopup();
  } catch (err) {
    console.error(err);
    alert("Huỷ thất bại!");
  }
}

const fullName = (u) => `${u?.ho || ""} ${u?.tenlot || ""} ${u?.ten || ""}`.trim();

const filteredPayments = computed(() => {
  if (!search.value) return payments.value;
  return payments.value.filter(
    (p) =>
      p.id.toLowerCase().includes(search.value.toLowerCase()) ||
      fullName(p.taiKhoan).toLowerCase().includes(search.value.toLowerCase())
  );
});

const openPopup = (payment) => {
  selectedPayment.value = payment;
  isPopupOpen.value = true;
};

const closePopup = () => {
  isPopupOpen.value = false;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "Chưa thanh toán";
  return new Date(dateStr).toLocaleString("vi-VN");
};

const formatPrice = (price) => {
  if (!price) return "N/A";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price
  );
};

onMounted(fetchPayments);
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold text-gray-800">Quản lý phiếu thanh toán</h1>
      <input
        v-model="search"
        type="text"
        placeholder="Tìm kiếm phiếu..."
        class="px-3 py-2 border rounded-md text-sm bg-white w-64 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-300"
      />
    </div>

    <!-- Filter -->
    <div class="mb-4">
      <div class="flex gap-2">
        <button
          @click="
            selectedType = 'ALL';
            fetchPayments();
          "
          :class="selectedType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-200'"
          class="px-3 py-1 rounded"
        >
          Tất cả
        </button>
        <button
          @click="
            selectedType = 'AUCTION_PAYMENT';
            fetchPayments();
          "
          :class="
            selectedType === 'AUCTION_PAYMENT' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          "
          class="px-3 py-1 rounded"
        >
          Phiếu thanh toán phiên
        </button>
        <button
          @click="
            selectedType = 'DEPOSIT_PAYMENT';
            fetchPayments();
          "
          :class="
            selectedType === 'DEPOSIT_PAYMENT' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          "
          class="px-3 py-1 rounded"
        >
          Phiếu thanh toán cọc
        </button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div v-if="loading" class="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>

      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="px-4 py-3 text-left font-medium">Mã phiếu</th>
            <th class="px-4 py-3 text-left font-medium">Người thanh toán</th>
            <th class="px-4 py-3 text-left font-medium">Số tiền</th>
            <th class="px-4 py-3 text-left font-medium">Thời gian thanh toán</th>
            <th class="px-4 py-3 text-left font-medium">Loại</th>
            <th class="px-4 py-3 text-left font-medium">Trạng thái</th>
            <th class="px-4 py-3 text-center font-medium">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="p in filteredPayments" :key="p.id" class="border-t hover:bg-gray-50">
            <td class="px-4 py-3 font-medium">{{ p.id }}</td>
            <td class="px-4 py-3">{{ fullName(p.taiKhoanKhachThanhToan) }}</td>
            <td class="px-4 py-3">{{ formatPrice(p.sotien) }}</td>
            <td class="px-4 py-3">{{ formatDate(p.thoigianthanhtoan) }}</td>
            <td class="px-4 py-3">
              {{ p.loai === "AUCTION_PAYMENT" ? "Phiếu phiên" : "Phiếu cọc" }}
            </td>
            <td class="px-4 py-3">
              <span
                :class="
                  p.trangthai === 'Chưa thanh toán'
                    ? 'bg-yellow-100 text-yellow-700'
                    : p.trangthai === 'Đã thanh toán'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                "
                class="px-2 py-1 text-xs rounded-full"
              >
                {{ p.trangthai }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <button
                @click="openPopup(p)"
                class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Chi tiết
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Popup detail -->
    <div
      v-if="isPopupOpen"
      class="fixed inset-0 bg-gray-200/80 flex items-center justify-center p-4"
    >
      <div class="bg-white w-96 p-5 rounded-xl shadow-lg">
        <h2 class="text-lg font-semibold mb-3">Chi tiết phiếu thanh toán</h2>
        <div class="space-y-2 text-sm">
          <p><strong>Mã phiếu:</strong> {{ selectedPayment.id }}</p>
          <p>
            <strong>Người thanh toán:</strong>
            {{ fullName(selectedPayment.taiKhoanKhachThanhToan) }}
          </p>
          <p v-if="selectedPayment.loai === 'AUCTION_PAYMENT'">
            <strong>Số tiền:</strong> {{ formatPrice(selectedPayment.sotien) }}
          </p>
          <p>
            <strong>Thời gian thanh toán:</strong>
            {{ formatDate(selectedPayment.thoigianthanhtoan) }}
          </p>
          <p>
            <strong>Hạn thanh toán:</strong>
            {{ formatDate(selectedPayment.hanthanhtoan) }}
          </p>
          <p>
            <strong>Phiên đấu giá:</strong> {{ selectedPayment.phienDauGia?.maphiendg }}
          </p>
          <p>
            <strong>Loại:</strong>
            {{
              selectedPayment.loai === "AUCTION_PAYMENT"
                ? "Phiếu thanh toán phiên"
                : "Phiếu thanh toán cọc"
            }}
          </p>
          <p><strong>Trạng thái:</strong> {{ selectedPayment.trangthai }}</p>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button
            v-if="selectedPayment.trangthai === 'Chưa thanh toán'"
            @click="openRejectModal(selectedPayment)"
            class="px-4 py-2 bg-red-600 text-white rounded-md"
          >
            Huỷ phiếu
          </button>
          <button @click="closePopup" class="px-4 py-2 bg-gray-200 rounded-md">
            Đóng
          </button>
        </div>

        <!-- Modal reject -->
        <div
          v-if="isRejectModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div class="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">
              Lý do huỷ phiếu: {{ selectedPaymentForReject?.id }}
            </h3>

            <form @submit.prevent="submitReject" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Tiêu đề</label>
                <input
                  v-model="rejectData.tieude"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                  placeholder="Ví dụ: Phiếu thanh toán bị huỷ"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Nội dung</label>
                <textarea
                  v-model="rejectData.noidung"
                  rows="4"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                  placeholder="Ví dụ: Lý do chi tiết tại sao huỷ phiếu."
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
                  Gửi và Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
