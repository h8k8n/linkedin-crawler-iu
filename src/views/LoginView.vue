<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import authService from '@/services/AuthService'
import { MainUtil } from '@/util/MainUtil'
import Toast from 'primevue/toast'

const router = useRouter()
const toast = useToast()

const loading = ref(false)
const formData = ref({
  username: '',
  password: '',
})

const errors = ref({})

const validateForm = data => {
  const newErrors = {}

  if (!data.username) {
    newErrors.username = 'Kullanıcı adı zorunludur'
  }

  if (!data.password) {
    newErrors.password = 'Şifre zorunludur'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleLogin = async () => {
  if (!validateForm(formData.value)) {
    MainUtil.showToast(toast, 'error', 'Lütfen zorunlu alanları doldurun')
    return
  }

  loading.value = true

  try {
    const response = await authService.login(
      formData.value.username,
      formData.value.password,
    )
    console.log(response)
    router.push('/')
  } catch (error) {
    MainUtil.showToast(
      toast,
      'error',
      'Giriş yapılmadı, lütfen kullanıcı ve şifre bilgileriniz kontrol ediniz',
    )
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="flex align-items-center justify-content-center min-h-screen bg-blue-50"
  >
    <div
      class="surface-card p-4 shadow-2 border-round w-full max-w-sm"
      style="max-width: 500px"
    >
      <div class="text-center mb-5">
        <div class="text-900 text-2xl font-medium mb-3">Login</div>
      </div>

      <div class="flex flex-column gap-4">
        <div class="flex flex-column gap-2">
          <label for="username" class="text-900">Kullanıcı Adı</label>
          <InputText
            id="username"
            v-model="formData.username"
            :class="{ 'p-invalid': errors.username }"
          />
          <small class="p-error">{{ errors.username }}</small>
        </div>

        <div class="flex flex-column gap-2">
          <label for="password" class="text-900">Şifre</label>
          <Password
            id="password"
            v-model="formData.password"
            :feedback="false"
            toggleMask
            :class="{ 'p-invalid': errors.password }"
          />
          <small class="p-error">{{ errors.password }}</small>
        </div>

        <Button
          label="Login"
          class="w-full"
          :loading="loading"
          @click="handleLogin"
        />
      </div>
    </div>
  </div>

  <Toast position="bottom-right" />
</template>

<style scoped>
:deep(.p-password input) {
  width: 100%;
}

:deep(.p-password-input) {
  width: 100%;
}
</style>
