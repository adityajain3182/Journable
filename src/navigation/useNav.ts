import { useState } from 'react';
import { ModalId, getPageComponent, getModalForRoute } from './routes';

export type NavState = {
  currentPage: string;
  openModal: ModalId | null;
  isDrawerOpen: boolean;
};

export type NavActions = {
  /** Navigate to any registered route by its id. Silently ignores unknown ids. */
  navigate: (id: string) => void;
  /** Return to the dashboard from any page. */
  goBack: () => void;
  closeModal: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

export function useNav(): NavState & NavActions {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [openModal, setOpenModal] = useState<ModalId | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navigate = (id: string) => {
    // Check modal routes first.
    const modal = getModalForRoute(id);
    if (modal) {
      setOpenModal(modal);
      setIsDrawerOpen(false);
      return;
    }

    // Check page routes.
    if (id === 'dashboard' || getPageComponent(id)) {
      setCurrentPage(id);
      setIsDrawerOpen(false);
      return;
    }

    // Unknown id (feature not yet built) — silently ignore so unfinished
    // branches merged into main can't crash the app.
  };

  const goBack = () => setCurrentPage('dashboard');
  const closeModal = () => setOpenModal(null);
  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return {
    currentPage,
    openModal,
    isDrawerOpen,
    navigate,
    goBack,
    closeModal,
    openDrawer,
    closeDrawer,
  };
}
