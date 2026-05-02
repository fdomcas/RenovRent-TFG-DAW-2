import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAdmin: false,
      setAuth: (user, token) => set({
        user,
        token,
        isAdmin: user?.is_staff || user?.is_superuser || false,
      }),
      logout: () => set({ user: null, token: null, isAdmin: false }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
      },
    }
  )
)

export default useAuthStore