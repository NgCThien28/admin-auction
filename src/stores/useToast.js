import { ref } from 'vue';

// Ref để lưu tham chiếu đến component Toast
const toastRef = ref(null);

export const useToast = () => {
  const addToast = (message, type = 'info', duration = 3000) => {
    if (toastRef.value) {
      toastRef.value.addToast(message, type, duration);
    }
  };
  return { addToast };
};

// Export toastRef để gán trong App.vue
export { toastRef };