// api/axios.jsx
import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token  // getState() fuera de componentes
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api