<script setup>
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex">
    <Sidebar />
    <div class="flex-1 min-w-0 flex flex-col">
      <Topbar />
      <main class="p-4 md:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import Sidebar from '../components/Sidebar.vue'
import Topbar from '../components/Topbar.vue'
export default {
  components: { Sidebar, Topbar },
}
</script>