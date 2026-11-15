import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  uploadModalOpen: boolean;
  theme: 'dark' | 'light' | 'system';
  activePanel: 'overview' | 'compress' | 'files' | 'settings' | 'meetings' | 'notes' | 'ai';
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setUploadModalOpen: (open: boolean) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  toggleTheme: () => void;
  setActivePanel: (panel: UiState['activePanel']) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  uploadModalOpen: false,
  theme: 'dark',
  activePanel: 'overview',
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setUploadModalOpen: (open) => set({ uploadModalOpen: open }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),
  setActivePanel: (panel) => set({ activePanel: panel }),
}));
