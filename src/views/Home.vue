<script setup>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
);

/* ===== Date range (UI) ===== */
const from = ref("2025-12-27");
const to = ref("2026-01-03");

/* ===== Data ===== */
const successfulSeries = ref([]);
const totalAmountSeries = ref([]);
const commissionSeries = ref([]);
const loading = ref(false);
const loadingTotal = ref(false);
const loadingCommission = ref(false);
const error = ref("");
const errorTotal = ref("");
const errorCommission = ref("");

/* ===== Chart refs ===== */
const successChartRef = ref(null);
let successChart = null;

const totalChartRef = ref(null);
let totalChart = null;

const commissionChartRef = ref(null);
let commissionChart = null;

/* ===== Derived ===== */
const successTotalCount = computed(() =>
  successfulSeries.value.reduce((sum, x) => sum + (Number(x.count) || 0), 0)
);

const totalAmountSum = computed(() =>
  totalAmountSeries.value.reduce((sum, x) => sum + (Number(x.total) || 0), 0)
);

const commissionSum = computed(() =>
  commissionSeries.value.reduce((sum, x) => sum + (Number(x.total) || 0), 0)
);

const stats = computed(() => [
  { label: "Giao dịch thành công", value: `${successTotalCount.value}` },
  { label: "Doanh thu", value:  new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(commissionSum.value), },
  {
    label: "Tổng",
    value: new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(totalAmountSum.value),
  },
]);

const buildParams = () => {
  return {
    from: from.value,
    to: to.value,
  };
};

const formatLabelDDMM = (isoDate) => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

const ensureCanvas = (refEl) => {
  if (!refEl.value) return false;
  const ctx = refEl.value.getContext?.("2d");
  return !!ctx;
};

const fetchSuccessful = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await axios.get("http://localhost:8082/api/payments/successful", {
      params: buildParams(),
    });

    successfulSeries.value = (res.data?.result ?? []).map((x) => ({
      date: x.date,
      count: x.count || 0,
    }));

    const labels = successfulSeries.value.map((x) => formatLabelDDMM(x.date));
    const data = successfulSeries.value.map((x) => x.count);

    renderSuccessChart(labels, data);
  } catch (e) {
    console.error("fetchSuccessful error", e);
    error.value =
      e?.response?.data?.message ||
      e?.message ||
      "Lỗi không rõ khi lấy giao dịch thành công";
    successfulSeries.value = [];
    renderSuccessChart([], []);
  } finally {
    loading.value = false;
  }
};

const renderSuccessChart = (labels, data) => {
  if (!ensureCanvas(successChartRef)) return;

  if (successChart) successChart.destroy();

  successChart = new Chart(successChartRef.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Số giao dịch thành công",
          data,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.14)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBackgroundColor: "#2563eb",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y} giao dịch`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0, stepSize: 1 },
          title: { display: true, text: "Số lượng" },
        },
        x: {
          title: { display: true, text: "Ngày" },
        },
      },
    },
  });
};

const renderTotalChart = (labels, data) => {
  if (!ensureCanvas(totalChartRef)) return;

  if (totalChart) totalChart.destroy();

  const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

  totalChart = new Chart(totalChartRef.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Tổng tiền giao dịch",
          data,
          borderColor: "#059669",
          backgroundColor: "rgba(5,150,105,0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "#059669",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${currencyFormatter.format(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => currencyFormatter.format(value),
            maxTicksLimit: 6,
          },
          title: { display: true, text: "Tổng tiền (VND)" },
        },
        x: {
          title: { display: true, text: "Ngày" },
        },
      },
    },
  });
};

const fetchTotalAmount = async () => {
  loadingTotal.value = true;
  errorTotal.value = "";
  try {
    const res = await axios.get("http://localhost:8082/api/payments/total-amount", {
      params: buildParams(),
    });

    totalAmountSeries.value = (res.data?.result ?? []).map((x) => ({
      date: x.date,
      total: x.total || 0,
    }));

    const labels = totalAmountSeries.value.map((x) => formatLabelDDMM(x.date));
    const data = totalAmountSeries.value.map((x) => x.total);

    renderTotalChart(labels, data);
  } catch (e) {
    errorTotal.value =
      e?.response?.data?.message || e?.message || "Lỗi khi lấy tổng tiền giao dịch";
    totalAmountSeries.value = [];
    renderTotalChart([], []);
  } finally {
    loadingTotal.value = false;
  }
};

const fetchCommission = async () => {
  loadingCommission.value = true;
  errorCommission.value = "";
  try {
    const res = await axios.get("http://localhost:8082/api/payments/commission", {
      params: buildParams(),
    });

    commissionSeries.value = (res.data?.result ?? []).map((x) => ({
      date: x.date,
      total: x.total || 0,
    }));

    const labels = commissionSeries.value.map((x) => formatLabelDDMM(x.date));
    const data = commissionSeries.value.map((x) => x.total);

    renderCommissionChart(labels, data);
  } catch (e) {
    errorCommission.value =
      e?.response?.data?.message || e?.message || "Lỗi khi lấy hoa hồng";
    commissionSeries.value = [];
    renderCommissionChart([], []);
  } finally {
    loadingCommission.value = false;
  }
};

const renderCommissionChart = (labels, data) => {
  if (!ensureCanvas(commissionChartRef)) return;

  if (commissionChart) commissionChart.destroy();

  const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

  commissionChart = new Chart(commissionChartRef.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Doanh thu sàn (hoa hồng)",
          data,
          borderColor: "#dc2626",
          backgroundColor: "rgba(220,38,38,0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "#dc2626",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${currencyFormatter.format(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => currencyFormatter.format(value),
            maxTicksLimit: 6,
          },
          title: { display: true, text: "Hoa hồng (VND)" },
        },
        x: {
          title: { display: true, text: "Ngày" },
        },
      },
    },
  });
};

/* ===== Lifecycle & watch ===== */
onMounted(async () => {
  await Promise.all([fetchSuccessful(), fetchTotalAmount(), fetchCommission()]);
});

let t = null;
watch([from, to], () => {
  clearTimeout(t);
  t = setTimeout(() => {
    fetchSuccessful();
    fetchTotalAmount();
    fetchCommission();
  }, 350);
});
</script>

<template>
  <div class="min-h-screen bg-gray-200">
    <!-- Top stats bar -->
    <section class="bg-blue-700">
      <div class="mx-auto max-w-6xl px-4">
        <div class="grid grid-cols-2 md:grid-cols-3">
          <div v-for="s in stats" :key="s.label" class="py-5 text-center text-white">
            <div class="text-2xl font-bold leading-none">{{ s.value }}</div>
            <div class="mt-1 text-sm text-white/90">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Content -->
    <main class="mx-auto max-w-6xl px-4 py-4">
      <!-- Title + date filters -->
      <div
        class="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-800">Màn hình chính</h2>
          <div class="hidden h-px w-80 bg-gray-300 md:block"></div>
        </div>

        <div class="flex items-center gap-3">
          <!-- From -->
          <div class="relative">
            <span
              class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
              aria-hidden="true"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 2v3M17 2v3M3 9h18M6 6h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <input
              v-model="from"
              type="date"
              class="h-9 w-44 rounded border border-gray-300 bg-white pl-8 pr-2 text-sm shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <span class="text-sm text-gray-700">Đến</span>

          <!-- To -->
          <div class="relative">
            <span
              class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
              aria-hidden="true"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 2v3M17 2v3M3 9h18M6 6h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <input
              v-model="to"
              type="date"
              class="h-9 w-44 rounded border border-gray-300 bg-white pl-8 pr-2 text-sm shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      </div>

      <!-- Dashboard cards -->
      <section class="grid grid-cols-1 gap-4">
        <!-- Big card: Tổng giá trị giao dịch (GMV) theo thời gian -->
        <div class="rounded bg-white shadow-sm ring-1 ring-gray-200">
          <div class="flex items-center justify-between px-4 py-3">
            <h3 class="text-sm font-semibold text-gray-800">
              Tổng giá trị giao dịch (GMV)
            </h3>
            <span class="text-sm font-semibold text-blue-600">
              Tổng:
              {{
                new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(totalAmountSum)
              }}
            </span>
          </div>
          <div class="px-4 pb-4">
            <div class="h-44 rounded border border-gray-200 bg-white p-3">
              <div class="h-full w-full rounded">
                <canvas ref="totalChartRef" style="width: 100%; height: 100%"></canvas>
              </div>
            </div>
            <div class="mt-2 text-xs text-gray-500">
              <span v-if="loadingTotal">Đang tải tổng tiền...</span>
              <span v-else-if="errorTotal" class="text-red-600">{{ errorTotal }}</span>
              <!-- <span v-else>{{
                totalAmountSeries.length ? "Theo ngày" : "Không có dữ liệu"
              }}</span> -->
            </div>
          </div>
        </div>

        <!-- Bottom row -->
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <!-- Successful transactions (REAL CHART) -->
          <div class="rounded bg-white shadow-sm ring-1 ring-gray-200">
            <div class="flex items-center justify-between px-4 py-3">
              <h3 class="text-sm font-semibold text-gray-800">Số giao dịch thành công</h3>

              <span class="text-sm font-semibold text-blue-600">
                Tổng: {{ successTotalCount }} giao dịch
              </span>
            </div>

            <div class="px-4 pb-4">
              <div class="mb-2 flex items-center justify-between text-xs">
                <span v-if="loading" class="text-gray-500">Đang tải...</span>
                <span v-else class="text-gray-500">
                  {{ successfulSeries.length ? "Theo ngày" : "Không có dữ liệu" }}
                </span>

                <span v-if="error" class="text-red-600">
                  {{ error }}
                </span>
              </div>

              <div class="h-40 rounded border border-gray-200 bg-white p-2">
                <canvas ref="successChartRef"></canvas>
              </div>
            </div>
          </div>

          <!-- Commission chart -->
          <div class="rounded bg-white shadow-sm ring-1 ring-gray-200">
            <div class="flex items-center justify-between px-4 py-3">
              <h3 class="text-sm font-semibold text-gray-800">
                Doanh thu sàn (hoa hồng)
              </h3>
              <span class="text-sm font-semibold text-blue-600">
                Tổng:
                {{
                  new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  }).format(commissionSum)
                }}
              </span>
            </div>
            <div class="px-4 pb-4">
              <div class="mb-2 flex items-center justify-between text-xs">
                <span v-if="loadingCommission" class="text-gray-500">Đang tải...</span>
                <span v-else class="text-gray-500">
                  {{ commissionSeries.length ? "Theo ngày" : "Không có dữ liệu" }}
                </span>
                <span v-if="errorCommission" class="text-red-600">
                  {{ errorCommission }}
                </span>
              </div>
              <div class="h-40 rounded border border-gray-200 bg-white p-2">
                <canvas ref="commissionChartRef"></canvas>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
