import { useModal } from "../context/ModalContext";
import CreatePromotionModal from "./modals/CreatePromotionModal";
import CreateStaffModal from "./modals/CreateStaffModal";

// single mount point for every globally-triggered creation/edit modal
function GlobalModals() {
  const { activeModal, modalPayload, closeModal } = useModal();

  if (activeModal === "createPromotion") return <CreatePromotionModal editTarget={modalPayload} onClose={closeModal} />;
  if (activeModal === "createStaff") return <CreateStaffModal onClose={closeModal} />;
  return null;
}

export default GlobalModals;
