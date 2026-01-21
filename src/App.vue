<template>
  <div>
    <router-view />
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Toast from './components/Toast.vue'; // Đường dẫn đến Toast.vue
import { toastRef } from './stores/useToast.js';

const toast = ref(null);

onMounted(() => {
  // Gán ref của Toast vào composable
  toastRef.value = toast.value;
});
</script>

<style scoped></style>
