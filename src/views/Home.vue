<script setup>
const stats = [
  { label: 'Giao dịch thành công', value: '0 VND' },
  { label: 'Giao dịch lỗi', value: '0 VND' },
  { label: 'Giao dịch đang thực hiện', value: '0 VND' },
  { label: 'Tổng', value: '0 VND' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Stat bar giống dải xanh -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="s in stats"
        :key="s.label"
        class="rounded-md bg-blue-600 text-white p-4"
      >
        <div class="text-2xl font-bold">{{ s.value }}</div>
        <div class="text-white/90">{{ s.label }}</div>
      </div>
    </section>

    <h2 class="text-lg font-semibold text-gray-800">Màn hình chính</h2>

    <!-- Khối biểu đồ mô phỏng -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-3 rounded-md border bg-white p-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Tổng tiền giao dịch</h3>
          <span class="text-sm text-gray-500">Tổng: 0 VND</span>
        </div>
        <div class="mt-3 h-44 rounded bg-gradient-to-b from-blue-50 to-white border border-dashed"></div>
      </div>

      <div class="rounded-md border bg-white p-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Giao dịch thành công</h3>
          <span class="text-sm text-gray-500">Tổng: 0 VND</span>
        </div>
        <div class="mt-3 h-40 rounded bg-gradient-to-b from-blue-50 to-white border border-dashed"></div>
      </div>

      <div class="rounded-md border bg-white p-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Giao dịch đang thực hiện</h3>
          <span class="text-sm text-gray-500">Tổng: 0 VND</span>
        </div>
        <div class="mt-3 h-40 rounded bg-gradient-to-b from-blue-50 to-white border border-dashed"></div>
      </div>
    </section>
  </div>
</template>