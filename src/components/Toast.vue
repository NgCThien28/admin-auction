<script setup>
import { ref, onMounted } from "vue";

const toasts = ref([]);

// Function to add a toast
const addToast = (message, type = "info", duration = 3000) => {
  const id = Date.now();
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    removeToast(id);
  }, duration);
};

// Function to remove a toast
const removeToast = (id) => {
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
};

// Expose addToast for external use
defineExpose({ addToast });

// Toast types with styles
const getToastClasses = (type) => {
  switch (type) {
    case "success":
      return "bg-green-500 text-white";
    case "error":
      return "bg-red-500 text-white";
    case "warning":
      return "bg-yellow-500 text-black";
    case "info":
    default:
      return "bg-blue-500 text-white";
  }
};
</script>

<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'px-4 py-2 rounded-md shadow-lg max-w-sm w-full flex items-center justify-between',
          getToastClasses(toast.type)
        ]"
      >
        <span>{{ toast.message }}</span>
        <button
          @click="removeToast(toast.id)"
          class="ml-2 text-white hover:text-gray-200"
        >
          &times;
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>