<script setup>
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div
    class="flex flex-column align-items-center justify-content-center min-h-screen"
  >
    <div class="text-center">
      <h1 class="text-9xl font-bold mb-4">404</h1>
      <h2 class="text-4xl mb-4">Sayfa Bulunamadı</h2>
      <p class="text-xl mb-6">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Button
        label="Ana Sayfaya Dön"
        icon="pi pi-home"
        @click="goHome"
        severity="primary"
      />
    </div>
  </div>
</template>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>
