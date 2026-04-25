import { create } from 'zustand'

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  usuario: null,
  setAuth: (token, usuario) => {
    localStorage.setItem('token', token)
    set({ token, usuario })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, usuario: null })
  },
}))

export default useAuthStore
