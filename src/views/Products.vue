<script setup>
import { ref, onMounted, computed, reactive } from "vue";
import axios from "axios";
import Cookies from "js-cookie";

const products = ref([]);
const loading = ref(true);
const search = ref("");
const selectedStatus = ref("ALL"); // ALL | PENDING_APPROVAL | APPROVED | AUCTION_CREATED | CANCELLED

// Popup / gallery state
const isPopupOpen = ref(false);
const selectedProduct = ref(null);
const galleryIndex = ref(0);

// Image loading state keyed by product id (masp)
const imgState = reactive({}); // values: 'loading' | 'loaded' | 'error'
// Action loading state keyed by product id for approve/reject
const actionLoading = reactive({});

// Base API
const API = "http://localhost:8082/api";
const getImageUrl = (tenanh) => `${API}/imgs/${tenanh}`;

// Helpers for hinhAnh format compatibility
function extractImageName(entry) {
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  if (typeof entry === "object") return entry.tenanh || entry.url || null;
  return null;
}
function productImages(p) {
  if (!p || !Array.isArray(p.hinhAnh)) return [];
  return p.hinhAnh
    .map(extractImageName)
    .filter(Boolean)
    .map((name) => getImageUrl(name));
}
function firstProductImage(p) {
  const imgs = productImages(p);
  return imgs.length ? imgs[0] : null;
}

const fetchProducts = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`${API}/products/find-all`);
    products.value = res.data?.result || [];
    // init image and action states
    products.value.forEach((p) => {
      imgState[p.masp] = firstProductImage(p) ? "loading" : "error";
      actionLoading[p.masp] = false;
    });
  } catch (err) {
    console.error("Lỗi API sản phẩm:", err);
    products.value = [];
  } finally {
    loading.value = false;
  }
};

const fullName = (u) =>
  u ? `${u.ho || ""} ${u.tenlot || ""} ${u.ten || ""}`.trim() : "";

const STATUS = {
  PENDING_APPROVAL: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  AUCTION_CREATED: "Đã tạo phiên",
  CANCELLED: "Đã huỷ",
};

// Map product.trangthai text to internal keys (tolerant)
function statusKey(trangthai) {
  if (!trangthai) return "OTHER";

  const map = {
    "Chờ duyệt": "PENDING_APPROVAL",
    "Đã duyệt": "APPROVED",
    "Đã tạo phiên": "AUCTION_CREATED",
    "Đã huỷ": "CANCELLED",
  };

  return map[trangthai] || "OTHER";
}

const filteredProducts = computed(() => {
  const q = (search.value || "").toLowerCase();
  return products.value.filter((p) => {
    // Lọc theo trạng thái
    if (selectedStatus.value !== "ALL") {
      if (statusKey(p.trangthai) !== selectedStatus.value) return false;
    }
    // Search
    if (!q) return true;
    return (
      p.masp?.toLowerCase().includes(q) ||
      p.tensp?.toLowerCase().includes(q) ||
      p.tinhtrangsp?.toLowerCase().includes(q) ||
      p.taiKhoanNguoiBan?.matk?.toLowerCase().includes(q) ||
      fullName(p.taiKhoanNguoiBan).toLowerCase().includes(q)
    );
  });
});

const statusCounts = computed(() => {
  const c = {
    ALL: products.value.length,
    PENDING_APPROVAL: 0,
    APPROVED: 0,
    AUCTION_CREATED: 0,
    CANCELLED: 0,
  };

  products.value.forEach((p) => {
    const key = statusKey(p.trangthai);
    if (c[key] !== undefined) c[key]++;
  });

  return c;
});

// Card actions
function openPopup(p, startIndex = 0) {
  selectedProduct.value = p;
  galleryIndex.value = startIndex;
  isPopupOpen.value = true;
}
function closePopup() {
  isPopupOpen.value = false;
  selectedProduct.value = null;
  galleryIndex.value = 0;
}

// gallery controls
function prevImage() {
  const imgs = productImages(selectedProduct.value);
  if (!imgs.length) return;
  galleryIndex.value = (galleryIndex.value - 1 + imgs.length) % imgs.length;
}
function nextImage() {
  const imgs = productImages(selectedProduct.value);
  if (!imgs.length) return;
  galleryIndex.value = (galleryIndex.value + 1) % imgs.length;
}

function onImgLoad(masp) {
  imgState[masp] = "loaded";
}
function onImgError(masp) {
  imgState[masp] = "error";
}
const token = Cookies.get("jwt_token");

// Approve / Reject actions
// Thêm state cho modal chỉnh sửa
const isEditModalOpen = ref(false);
const selectedProductForEdit = ref(null);
const editedProduct = reactive({
  tensp: "",
  tinhtrangsp: "",
  giamongdoi: "",
  hoahong: "",
  tieude: "",
  noidung: "",
});

function openEditModal(p) {
  selectedProductForEdit.value = { ...p };
  Object.assign(editedProduct, {
    tensp: p.tensp || "",
    tinhtrangsp: p.tinhtrangsp || "",
    giamongdoi: p.giamongdoi || "",
    hoahong: p.hoahong || "",
    tieude: "",
    noidung: "",
  });
  isEditModalOpen.value = true;
}

// Cập nhật closeEditModal để reset
function closeEditModal() {
  isEditModalOpen.value = false;
  selectedProductForEdit.value = null;
  Object.assign(editedProduct, {
    tensp: "",
    tinhtrangsp: "",
    giamongdoi: "",
    hoahong: "",
    tieude: "",
    noidung: "",
  });
}

async function saveAndApproveProduct() {
  const masp = selectedProductForEdit.value.masp;
  if (!masp) return;
  if (
    !confirm(
      `Bạn chắc chắn muốn lưu thay đổi và duyệt sản phẩm "${editedProduct.tensp}" (${masp})?`
    )
  )
    return;
  actionLoading[masp] = true;
  try {
    const updateData = { ...editedProduct };
    await axios.put(`${API}/products/approve/${masp}`, updateData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Cập nhật dữ liệu local
    Object.assign(selectedProductForEdit.value, editedProduct);
    selectedProductForEdit.value.trangthai = "Đã duyệt";
    const index = products.value.findIndex((p) => p.masp === masp);
    if (index !== -1) {
      Object.assign(products.value[index], selectedProductForEdit.value);
    }
    alert("Lưu và duyệt sản phẩm thành công.");
    closeEditModal();
  } catch (err) {
    console.error("Lỗi khi lưu và duyệt sản phẩm:", err);
    alert("Lưu và duyệt sản phẩm thất bại. Vui lòng thử lại.");
  } finally {
    actionLoading[masp] = false;
  }
}

// Thêm state cho modal reject
const isRejectModalOpen = ref(false);
const selectedProductForReject = ref(null);
const rejectData = reactive({
  tieude: "",
  noidung: "",
});

function openRejectModal(p) {
  selectedProductForReject.value = { ...p };
  Object.assign(rejectData, { tieude: "", noidung: "" });
  isRejectModalOpen.value = true;
}

function closeRejectModal() {
  isRejectModalOpen.value = false;
  selectedProductForReject.value = null;
  Object.assign(rejectData, { tieude: "", noidung: "" });
}

async function submitReject() {
  const masp = selectedProductForReject.value.masp;
  if (!masp) return;
  if (
    !confirm(
      `Bạn chắc chắn muốn huỷ sản phẩm "${selectedProductForReject.value.tensp}" (${masp}) với lý do này?`
    )
  )
    return;

  actionLoading[masp] = true;
  try {
    const rejectBody = { ...rejectData };
    await axios.put(`${API}/products/reject/${masp}`, rejectBody, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Cập nhật dữ liệu local
    selectedProductForReject.value.trangthai = "Đã huỷ";
    // Cập nhật trong products array
    const index = products.value.findIndex((p) => p.masp === masp);
    if (index !== -1) {
      Object.assign(products.value[index], selectedProductForReject.value);
    }
    alert("Huỷ sản phẩm thành công.");
    closeRejectModal();
  } catch (err) {
    console.error("Lỗi khi huỷ sản phẩm:", err);
    alert("Huỷ sản phẩm thất bại. Vui lòng thử lại.");
  } finally {
    actionLoading[masp] = false;
  }
}

onMounted(fetchProducts);
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-semibold text-gray-800">Quản lý sản phẩm</h1>

      <div class="flex items-center gap-3">
        <input
          v-model="search"
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          class="px-3 py-2 border rounded-md text-sm bg-white shadow-sm w-64 focus:border-blue-600 focus:ring-2 focus:ring-blue-300"
        />
      </div>
    </div>

    <!-- Status filter bar -->
    <div class="mb-4">
      <div class="flex flex-wrap gap-2 items-center">
        <button
          @click="selectedStatus = 'ALL'"
          :class="
            selectedStatus === 'ALL'
              ? 'bg-sky-600 text-white'
              : 'bg-gray-100 text-slate-700'
          "
          class="px-3 py-1.5 rounded-full text-sm font-medium transition"
        >
          Tất cả ({{ statusCounts.ALL }})
        </button>

        <button
          @click="selectedStatus = 'PENDING_APPROVAL'"
          :class="
            selectedStatus === 'PENDING_APPROVAL'
              ? 'bg-amber-500 text-white'
              : 'bg-amber-50 text-amber-700'
          "
          class="px-3 py-1.5 rounded-full text-sm font-medium transition"
        >
          Chờ duyệt ({{ statusCounts.PENDING_APPROVAL }})
        </button>

        <button
          @click="selectedStatus = 'APPROVED'"
          :class="
            selectedStatus === 'APPROVED'
              ? 'bg-green-600 text-white'
              : 'bg-green-50 text-green-700'
          "
          class="px-3 py-1.5 rounded-full text-sm font-medium transition"
        >
          Đã duyệt ({{ statusCounts.APPROVED }})
        </button>

        <button
          @click="selectedStatus = 'AUCTION_CREATED'"
          :class="
            selectedStatus === 'AUCTION_CREATED'
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-50 text-indigo-700'
          "
          class="px-3 py-1.5 rounded-full text-sm font-medium transition"
        >
          Đã tạo phiên ({{ statusCounts.AUCTION_CREATED }})
        </button>

        <button
          @click="selectedStatus = 'CANCELLED'"
          :class="
            selectedStatus === 'CANCELLED'
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-700'
          "
          class="px-3 py-1.5 rounded-full text-sm font-medium transition"
        >
          Đã huỷ ({{ statusCounts.CANCELLED }})
        </button>

        <div class="ml-auto text-sm text-gray-500">
          Hiển thị:
          <span class="font-medium text-gray-700">{{ filteredProducts.length }}</span> sản
          phẩm
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden p-4">
      <div v-if="loading" class="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>

      <div v-else>
        <div v-if="filteredProducts.length === 0" class="text-center py-8 text-gray-500">
          Không tìm thấy sản phẩm nào.
        </div>

        <!-- Grid of cards -->
        <div
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <article
            v-for="p in filteredProducts"
            :key="p.masp"
            class="card group relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div class="relative">
              <div
                class="h-44 bg-gray-50 overflow-hidden flex items-center justify-center"
              >
                <!-- image or placeholder -->
                <div class="w-full h-full relative">
                  <div
                    v-if="imgState[p.masp] !== 'loaded'"
                    class="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse text-gray-400"
                  >
                    <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 3h18v18H3z"
                        stroke="currentColor"
                        stroke-width="1.2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>

                  <img
                    v-if="firstProductImage(p) && imgState[p.masp] !== 'error'"
                    :src="firstProductImage(p)"
                    :alt="p.tensp"
                    class="object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    @load="onImgLoad(p.masp)"
                    @error="onImgError(p.masp)"
                  />

                  <div
                    v-if="imgState[p.masp] === 'error'"
                    class="w-full h-full flex items-center justify-center text-gray-400"
                  >
                    Không có ảnh
                  </div>

                  <!-- status badge -->
                  <div class="absolute left-3 top-3">
                    <span
                      class="px-2 py-1 text-xs rounded-full font-medium"
                      :class="
                        statusKey(p.trangthai) === 'AUCTION_CREATED'
                          ? 'bg-indigo-100 text-indigo-800'
                          : statusKey(p.trangthai) === 'PENDING_APPROVAL'
                          ? 'bg-amber-100 text-amber-800'
                          : statusKey(p.trangthai) === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : statusKey(p.trangthai) === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      "
                    >
                      {{ p.trangthai || "Chưa rõ" }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-4 flex flex-col gap-2">
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-semibold text-gray-800 text-sm line-clamp-2">
                  {{ p.tensp }}
                </h3>
                <div class="text-xs text-gray-500">{{ p.masp }}</div>
              </div>

              <div class="text-xs text-gray-500">
                <div>{{ fullName(p.taiKhoanNguoiBan) }}</div>
                <div class="mt-1 inline-flex items-center gap-2">
                  <svg class="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2a7 7 0 017 7c0 6-7 13-7 13S5 15 5 9a7 7 0 017-7z"
                      stroke="currentColor"
                      stroke-width="1.2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span>{{ p.thanhpho?.tentp || "Không rõ" }}</span>
                </div>
              </div>

              <div class="mt-3 flex items-center gap-2">
                <button
                  @click.stop="openPopup(p, 0)"
                  class="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Xem
                </button>

                <template v-if="statusKey(p.trangthai) === 'PENDING_APPROVAL'">
                  <button
                    @click.stop="openEditModal(p)"
                    :disabled="actionLoading[p.masp]"
                    class="px-3 py-1.5 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-60"
                  >
                    <span v-if="actionLoading[p.masp]">Đang xử lý...</span>
                    <span v-else>Duyệt</span>
                  </button>

                  <button
                    @click.stop="openRejectModal(p)"
                    :disabled="actionLoading[p.masp]"
                    class="px-3 py-1.5 text-xs rounded-md border border-red-300 text-red-600 hover:bg-red-50 transition disabled:opacity-60"
                  >
                    <span v-if="actionLoading[p.masp]">Đang xử lý...</span>
                    <span v-else>Huỷ</span>
                  </button>
                </template>
                <div class="ml-auto text-xs text-gray-400">
                  SP: {{ p.tinhtrangsp || "-" }}
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <!-- Popup / Lightbox gallery -->
    <div
      v-if="isPopupOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        class="bg-white rounded-xl w-full max-w-4xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-3"
      >
        <!-- Gallery column -->
        <div class="md:col-span-1 md:order-1 p-4 flex flex-col items-center gap-3">
          <div class="relative w-full">
            <div
              class="h-64 bg-gray-100 flex items-center justify-center overflow-hidden rounded-lg"
            >
              <img
                v-if="selectedProduct && productImages(selectedProduct).length"
                :src="productImages(selectedProduct)[galleryIndex]"
                class="max-h-full object-contain"
                alt="product image"
                loading="lazy"
              />
              <div v-else class="text-gray-400">Không có ảnh</div>
            </div>

            <!-- nav arrows -->
            <button
              v-if="selectedProduct && productImages(selectedProduct).length > 1"
              @click="prevImage"
              class="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow hover:bg-white"
              aria-label="Prev"
            >
              ‹
            </button>
            <button
              v-if="selectedProduct && productImages(selectedProduct).length > 1"
              @click="nextImage"
              class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow hover:bg-white"
              aria-label="Next"
            >
              ›
            </button>
          </div>

          <!-- thumbnails -->
          <div
            v-if="selectedProduct && productImages(selectedProduct).length"
            class="w-full grid grid-cols-5 gap-2 mt-3"
          >
            <button
              v-for="(u, i) in productImages(selectedProduct)"
              :key="i"
              @click="galleryIndex = i"
              :class="[
                'rounded overflow-hidden',
                i === galleryIndex ? 'ring-2 ring-blue-500' : 'ring-1 ring-transparent',
              ]"
            >
              <img :src="u" class="h-16 w-full object-cover" />
            </button>
          </div>
        </div>

        <!-- Details column -->
        <div class="col-span-2 p-5 md:order-2">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-bold text-gray-800">
                {{ selectedProduct?.tensp }}
              </h2>
              <div class="text-sm text-gray-500 mt-1">{{ selectedProduct?.masp }}</div>
              <div class="mt-3 text-sm text-gray-600">
                Người bán:
                <span class="font-medium text-gray-800">{{
                  fullName(selectedProduct?.taiKhoanNguoiBan)
                }}</span>
                <span class="text-gray-400"> • </span>
                <span>{{ selectedProduct?.taiKhoanNguoiBan?.email }}</span>
              </div>
            </div>

            <div class="text-right">
              <div class="text-sm text-gray-500">Thành phố</div>
              <div class="font-medium text-gray-800">
                {{ selectedProduct?.thanhpho?.tentp || "-" }}
              </div>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            <div>
              <div class="text-xs text-gray-500">Tình trạng</div>
              <div class="font-medium">{{ selectedProduct?.tinhtrangsp || "-" }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Trạng thái</div>
              <div class="font-medium">{{ selectedProduct?.trangthai || "-" }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Giá mong đợi</div>
              <div class="font-medium">
                {{ selectedProduct?.giamongdoi || "Chưa có" }}
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Mức hoa hồng</div>
              <div class="font-medium">{{ selectedProduct?.hoahong || "Chưa có" }}</div>
            </div>
          </div>

          <div class="mt-5 flex items-center gap-2">
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
    <!-- Modal duyệt sản phẩm -->
    <div
      v-if="isEditModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div class="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
          Chỉnh sửa và duyệt sản phẩm:
          {{ selectedProductForEdit?.tensp }} ({{ selectedProductForEdit?.masp }})
        </h3>

        <form @submit.prevent="saveAndApproveProduct" class="space-y-4">
          <!-- Các trường form giữ nguyên như trước -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
            <input
              v-model="editedProduct.tensp"
              type="text"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Tình trạng sản phẩm</label
            >
            <input
              v-model="editedProduct.tinhtrangsp"
              type="text"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Giá mong đợi</label>
            <input
              v-model="editedProduct.giamongdoi"
              type="number"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Mức hoa hồng</label>
            <input
              v-model="editedProduct.hoahong"
              type="number"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Tiêu đề</label>
            <input
              v-model="editedProduct.tieude"
              type="text"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Ví dụ: Sản phẩm không hợp lệ"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Nội dung</label>
            <textarea
              v-model="editedProduct.noidung"
              rows="4"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Ví dụ: Sản phẩm vi phạm quy định của chúng tôi về..."
            ></textarea>
          </div>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              @click="closeEditModal"
              class="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="actionLoading[selectedProductForEdit?.masp]"
              class="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            >
              <span v-if="actionLoading[selectedProductForEdit?.masp]"
                >Đang xử lý...</span
              >
              <span v-else>Lưu và Duyệt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- Modal huỷ sản phẩm -->
    <div
      v-if="isRejectModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div class="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
          Lý do huỷ sản phẩm: {{ selectedProductForReject?.tensp }} ({{
            selectedProductForReject?.masp
          }})
        </h3>

        <form @submit.prevent="submitReject" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Tiêu đề</label>
            <input
              v-model="rejectData.tieude"
              type="text"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              placeholder="Ví dụ: Sản phẩm không hợp lệ"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Nội dung</label>
            <textarea
              v-model="rejectData.noidung"
              rows="4"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              placeholder="Ví dụ: Sản phẩm vi phạm quy định của chúng tôi về..."
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
              :disabled="actionLoading[selectedProductForReject?.masp]"
              class="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              <span v-if="actionLoading[selectedProductForReject?.masp]"
                >Đang xử lý...</span
              >
              <span v-else>Gửi và Huỷ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card .line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
