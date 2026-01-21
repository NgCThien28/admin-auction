<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold text-gray-800">Quản lý thành phố</h1>

      <div class="flex items-center gap-2">
        <input
          v-model="search"
          type="text"
          placeholder="Tìm kiếm thành phố..."
          class="px-3 py-2 border rounded-md text-sm bg-white shadow-sm w-64 focus:border-blue-600 focus:ring-2 focus:ring-blue-300"
        />

        <button
          @click="openAdd"
          class="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          + Thêm
        </button>
      </div>
    </div>

    <!-- Card -->
    <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <!-- Loading -->
      <div v-if="loading" class="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>

      <!-- Table -->
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="px-4 py-3 text-left font-medium w-48">Mã thành phố</th>
            <th class="px-4 py-3 text-left font-medium">Tên thành phố</th>
            <th class="px-4 py-3 text-left font-medium w-40">Hành động</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="c in filteredCities" :key="c.matp" class="border-t hover:bg-gray-50">
            <td class="px-4 py-3 font-medium">{{ c.matp }}</td>
            <td class="px-4 py-3 font-medium">{{ c.tentp }}</td>
            <td class="px-4 py-3 flex gap-2">
              <button
                @click="openEdit(c)"
                class="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Sửa
              </button>
              <button
                @click="removeCity(c)"
                :disabled="busyId === c.matp"
                class="px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {{ busyId === c.matp ? "..." : "Xóa" }}
              </button>
            </td>
          </tr>

          <tr v-if="filteredCities.length === 0">
            <td colspan="3" class="text-center py-4 text-gray-500">
              Không có thành phố nào.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center"
    >
      <div class="bg-white w-[400px] rounded-xl shadow-xl border p-5">
        <div class="flex justify-between items-center mb-4 border-b pb-2">
          <h2 class="text-lg font-semibold">
            {{ isEdit ? "Sửa thành phố" : "Thêm thành phố" }}
          </h2>
          <button @click="closeModal" class="hover:text-red-600">✕</button>
        </div>

        <div class="space-y-4">
          <div v-if="isEdit">
            <label class="text-xs text-gray-500">Mã thành phố</label>
            <input
              disabled
              v-model="form.matp"
              class="w-full px-3 py-2 border rounded-md text-sm bg-gray-100"
            />
          </div>

          <div>
            <label class="text-xs text-gray-500">Tên thành phố</label>
            <input
              v-model="form.tentp"
              placeholder="Nhập tên thành phố"
              class="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button @click="closeModal" class="px-4 py-2 text-sm">Hủy</button>
          <button
            @click="submit"
            :disabled="saving"
            class="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {{ saving ? "Đang lưu..." : "Lưu" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useToast } from '@/stores/useToast.js';
import { add } from "lodash-es";

const { addToast } = useToast();

const cities = ref([]);
const loading = ref(false);
const saving = ref(false);
const busyId = ref(null);

const search = ref("");

const showModal = ref(false);
const isEdit = ref(false);

const form = ref({
  matp: "",
  tentp: "",
});

const fetchCities = async () => {
  loading.value = true;
  try {
    const res = await axios.get("http://localhost:8082/api/cities/find-all");
    cities.value = res.data.result || [];
  } catch (e) {
    console.error(e);
    addToast("Không tải được danh sách thành phố.", "error");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchCities);

const filteredCities = computed(() =>
  cities.value.filter((c) => c.tentp.toLowerCase().includes(search.value.toLowerCase()))
);

const openAdd = () => {
  isEdit.value = false;
  form.value = { matp: "", tentp: "" };
  showModal.value = true;
};

const openEdit = (c) => {
  isEdit.value = true;
  form.value = { ...c };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const submit = async () => {
  if (!form.value.tentp.trim()) return;

  saving.value = true;
  try {
    if (isEdit.value) {
      await axios.put(`http://localhost:8082/api/cities/${form.value.matp}`, {
        tentp: form.value.tentp,
      });
      addToast("Sửa thành phố thành công!", "success");
    } else {
      const res = await axios.post("http://localhost:8082/api/cities", {
        tentp: form.value.tentp,
      });
      addToast("Thêm thành phố thành công!", "success");
    }
    await fetchCities();
    closeModal();
  } catch (e) {
    console.error(e);
    addToast("Lưu thành phố thất bại.", "error");
  } finally {
    saving.value = false;
  }
};

const removeCity = async (c) => {
  if (!confirm(`Xóa thành phố "${c.tentp}"?`)) return;

  busyId.value = c.matp;
  try {
    await axios.delete(`http://localhost:8082/api/cities/${c.matp}`);
    await fetchCities();
    addToast("Xóa thành phố thành công!", "success");
  } catch (e) {
    console.error(e);
    addToast("Xóa thành phố thất bại.", "error");
  } finally {
    busyId.value = null;
  }
};
</script>
