<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import Cookies from "js-cookie";

/* ===== State ===== */
const loading = ref(false);
const paymentsRaw = ref([]);

const fromDate = ref("");
const toDate = ref("");
const status = ref("ALL");

const token = Cookies.get("jwt_admin_token");

/* ===== Helpers ===== */
const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
};

const formatMoney = (v) => {
  if (v === undefined || v === null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
};

const parseYmdToTime = (ymd) => {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).getTime();
};

const toDateOnlyTime = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

const badgeClass = (s) => {
  if (s === "Đã thanh toán") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "Chưa thanh toán") return "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "Bị hủy" || s === "Đã huỷ" || s === "Hủy")
    return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
};

/* ===== API ===== */
const fetchPayments = async () => {
  loading.value = true;
  try {
    const res = await axios.get("http://localhost:8082/api/payments/find-all", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    paymentsRaw.value = Array.isArray(res.data?.result) ? res.data.result : [];
  } catch (err) {
    console.error("Lỗi API payments:", err);
    paymentsRaw.value = [];
  } finally {
    loading.value = false;
  }
};

const rows = computed(() => {
  return (paymentsRaw.value || []).map((p, idx) => ({
    stt: idx + 1,
    matt: p.matt,
    thoigianthanhtoan: p.thoigianthanhtoan,
    hanthanhtoan: p.hanthanhtoan,
    sotien: p.sotien,
    trangthai: p.trangthai,
    _raw: p,
  }));
});

/* Lọc theo form (từ ngày / đến ngày / trạng thái) */
const filteredRows = computed(() => {
  const f = parseYmdToTime(fromDate.value);
  const t = parseYmdToTime(toDate.value);

  return rows.value.filter((r) => {
    if (status.value !== "ALL" && r.trangthai !== status.value) return false;

    const created = toDateOnlyTime(r.thoigianthanhtoan);
    if (created === null) return true;

    if (f !== null && created < f) return false;
    if (t !== null && created > t) return false;
    return true;
  });
});

const onSearch = async () => {
  await fetchPayments();
};

const exportExcel = async () => {
  try {
    const params = {};

    // LocalDate ISO: yyyy-MM-dd
    if (fromDate.value) params.from = fromDate.value;
    if (toDate.value) params.to = toDate.value;

    if (status.value && status.value !== "ALL") params.status = status.value;

    const res = await axios.get("http://localhost:8082/api/payments/export-excel", {
      params,
      responseType: "blob",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    // Lấy filename từ header nếu có
    const disposition = res.headers?.["content-disposition"] || "";
    let filename = "thongke.xlsx";
    const match = disposition.match(/filename=([^;]+)/i);
    if (match?.[1]) filename = match[1].trim().replaceAll('"', "");

    const blob = new Blob([res.data], {
      type:
        res.headers?.["content-type"] ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export excel lỗi:", err);
    alert("Xuất Excel thất bại!");
  }
};

onMounted(fetchPayments);
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-sm">
    <div class="px-4 py-3 border-b border-slate-200">
      <h1 class="text-lg font-semibold text-blue-700">
        Báo cáo chi tiết phiếu thanh toán
      </h1>
    </div>

    <div class="px-4 py-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 max-w-4xl">
        <div class="grid grid-cols-[120px_1fr] items-center gap-3">
          <label class="text-sm text-slate-700">Từ ngày</label>
          <input
            v-model="fromDate"
            type="date"
            class="h-9 px-3 border border-slate-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
        </div>

        <div class="grid grid-cols-[120px_1fr] items-center gap-3">
          <label class="text-sm text-slate-700">Đến ngày</label>
          <input
            v-model="toDate"
            type="date"
            class="h-9 px-3 border border-slate-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
        </div>

        <div class="grid grid-cols-[120px_1fr] items-center gap-3">
          <label class="text-sm text-slate-700">Trạng thái</label>
          <select
            v-model="status"
            class="h-9 px-3 border border-slate-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          >
            <option value="ALL">Tất cả</option>
            <option value="Đã thanh toán">Đã thanh toán</option>
            <option value="Chưa thanh toán">Chưa thanh toán</option>
            <option value="Bị hủy">Bị hủy</option>
          </select>
        </div>

        <div class="hidden md:block"></div>
      </div>

      <div class="mt-4 flex items-center justify-center gap-3">
        <button
          @click="onSearch"
          class="inline-flex items-center gap-2 h-9 px-4 rounded-sm bg-blue-700 text-white text-sm hover:bg-blue-800"
        >
          Tìm kiếm
        </button>

        <button
          @click="exportExcel"
          class="inline-flex items-center gap-2 h-9 px-4 rounded-sm bg-emerald-600 text-white text-sm hover:bg-emerald-700"
        >
          Xuất excel
        </button>
      </div>
    </div>

    <div class="border-t border-slate-200">
      <div v-if="loading" class="p-6 text-center text-slate-500 text-sm">
        Đang tải dữ liệu...
      </div>

      <template v-else>
        <div
          v-if="filteredRows.length === 0"
          class="mx-4 my-4 px-4 py-3 bg-sky-50 border border-sky-100 text-slate-700 text-sm"
        >
          Không có kết quả phù hợp với dữ liệu tìm kiếm
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-slate-600 border-t border-slate-200">
              <tr>
                <th class="px-4 py-3 text-left font-medium">Mã phiếu</th>
                <th class="px-4 py-3 text-left font-medium">Ngày thanh toán</th>
                <th class="px-4 py-3 text-left font-medium">Hạn thanh toán</th>
                <th class="px-4 py-3 text-left font-medium">Số tiền</th>
                <th class="px-4 py-3 text-left font-medium">Trạng thái</th>
                <th class="px-4 py-3 text-left font-medium">Hành động</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="r in filteredRows"
                :key="r.matt"
                class="border-t border-slate-200 hover:bg-slate-50"
              >
                <td class="px-4 py-3 font-medium">{{ r.matt }}</td>
                <td class="px-4 py-3">{{ formatDateTime(r.thoigianthanhtoan) }}</td>
                <td class="px-4 py-3">{{ formatDateTime(r.hanthanhtoan) }}</td>
                <td class="px-4 py-3">{{ formatMoney(r.sotien) }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full border text-xs"
                    :class="badgeClass(r.trangthai)"
                  >
                    {{ r.trangthai }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <button
                    class="h-8 px-3 rounded-sm bg-blue-700 text-white text-sm hover:bg-blue-800"
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>
