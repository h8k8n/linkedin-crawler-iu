import axios from 'axios'
import router from '@/router'

axios.interceptors.request.use(
  config => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user && user.token) {
      config.headers.Authorization = 'Bearer ' + user.token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  },
)

axios.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response.status === 401) {
      localStorage.removeItem('user')
      router.push('/login')
    }
    return Promise.reject(error)
  },
)
