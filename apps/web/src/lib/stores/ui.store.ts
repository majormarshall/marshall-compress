import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  uploadModalOpen: boolean;
  activePanel: 'overview' | 'compress' | 'files' | 'settings' | 'meetings' | 'notes' | 'ai';
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setUploadModalOpen: (open: boolean) => void;
  setActivePanel: (panel: UiState['activePanel']) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  uploadModalOpen: false,
  activePanel: 'overview',
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setUploadModalOpen: (open) => set({ uploadModalOpen: open }),
  setActivePanel: (panel) => set({ activePanel: panel }),
}));
