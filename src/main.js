import './assets/main.css'
import 'primeflex/primeflex.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'

import ConfirmationService from 'primevue/confirmationservice'
import DialogService from 'primevue/dialogservice'
import ToastService from 'primevue/toastservice'

import axios from 'axios'
import './services/axios-interceptor'

axios.defaults.baseURL = 'http://localhost:8888'

const app = createApp(App)

app.config.globalProperties.$axios = axios

app.use(router)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})

app.use(ConfirmationService)
app.use(ToastService)
app.use(DialogService)
app.mount('#app')
