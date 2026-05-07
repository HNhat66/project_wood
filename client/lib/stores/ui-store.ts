import { create } from 'zustand';

import { UIStore } from '@/lib/types';

export const useUIStore = create<UIStore>((set, get) => ({
  // Sidebar state
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  
  // Loading states
  isLoading: false,
  loadingText: undefined,
  
  // Modal states
  modals: {
    authModal: false,
    productModal: false,
    customOrderModal: false,
    confirmDialog: false,
  },
  
  // Confirmation dialog
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: undefined,
    onCancel: undefined,
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
  },
  
  // Toast notifications
  toast: {
    isVisible: false,
    type: 'info',
    message: '',
    duration: 3000,
  },
  
  // Mobile menu
  isMobileMenuOpen: false,
  
  // Error handling
  error: null,
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
  
  // Actions
  setLoading: (loading: boolean, text?: string) => {
    set({ isLoading: loading, loadingText: text })
  },
  
  openModal: (modal) => {
    set(state => ({
      modals: {
        ...state.modals,
        [modal]: true
      }
    }))
  },
  
  closeModal: (modal) => {
    set(state => ({
      modals: {
        ...state.modals,
        [modal]: false
      }
    }))
  },
  
  closeAllModals: () => {
    set({
      modals: {
        authModal: false,
        productModal: false,
        customOrderModal: false,
        confirmDialog: false,
      }
    })
  },
  
  showConfirmDialog: (config) => {
    set({
      confirmDialog: {
        isOpen: true,
        title: config.title,
        message: config.message,
        onConfirm: config.onConfirm,
        onCancel: config.onCancel,
        confirmText: config.confirmText || 'Xác nhận',
        cancelText: config.cancelText || 'Hủy',
      }
    })
  },
  
  hideConfirmDialog: () => {
    set({
      confirmDialog: {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: undefined,
        onCancel: undefined,
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
      }
    })
  },
  
  
  toggleMobileMenu: () => {
    set(state => ({ isMobileMenuOpen: !state.isMobileMenuOpen }))
  },
  
  closeMobileMenu: () => {
    set({ isMobileMenuOpen: false })
  },
})) 