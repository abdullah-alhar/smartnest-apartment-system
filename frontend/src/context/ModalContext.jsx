import { createContext, useContext, useState } from "react";

const ModalContext = createContext();

// tracks which single global modal (if any) is open — "createPromotion" | "createStaff" | null
// modalPayload carries optional extra data, e.g. the promotion being edited when reopening "createPromotion" in edit mode
export function ModalProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null);
  const [modalPayload, setModalPayload] = useState(null);

  const openModal = (name, payload = null) => {
    setActiveModal(name);
    setModalPayload(payload);
  };
  const closeModal = () => {
    setActiveModal(null);
    setModalPayload(null);
  };

  return (
    <ModalContext.Provider value={{ activeModal, modalPayload, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
