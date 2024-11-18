import axios from 'axios'

const API_URL = 'http://localhost:8888/api/'

class AuthService {
  async login(username, password) {
    const response = await axios.post(API_URL + 'security/login', {
      username,
      password,
    })
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data))
    }
    return response.data
  }

  logout() {
    localStorage.removeItem('user')
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'))
  }
}

export default new AuthService()
