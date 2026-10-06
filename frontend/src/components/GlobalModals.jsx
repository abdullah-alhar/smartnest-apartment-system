import { useModal } from "../context/ModalContext";
import CreatePromotionModal from "./modals/CreatePromotionModal";
import CreateStaffModal from "./modals/CreateStaffModal";
import CreateApartmentModal from "./modals/CreateApartmentModal";
import CreateInquiryModal from "./modals/CreateInquiryModal";
import EditInquiryModal from "./modals/EditInquiryModal";
import BookAppointmentModal from "./modals/BookAppointmentModal";
import EditAppointmentModal from "./modals/EditAppointmentModal";
import ReserveApartmentModal from "./modals/ReserveApartmentModal";
import EditReservationModal from "./modals/EditReservationModal";

function GlobalModals() {
  const { activeModal, modalPayload, closeModal } = useModal();

  if (activeModal === "createPromotion") return <CreatePromotionModal editTarget={modalPayload} onClose={closeModal} />;
  if (activeModal === "createStaff") return <CreateStaffModal onClose={closeModal} />;
  if (activeModal === "createApartment") return <CreateApartmentModal editTarget={modalPayload} onClose={closeModal} />;
  if (activeModal === "createInquiry") return <CreateInquiryModal presetApartmentId={modalPayload} onClose={closeModal} />;
  if (activeModal === "editInquiry") return <EditInquiryModal editTarget={modalPayload} onClose={closeModal} />;
  if (activeModal === "bookAppointment") return <BookAppointmentModal presetApartmentId={modalPayload} onClose={closeModal} />;
  if (activeModal === "editAppointment") return <EditAppointmentModal editTarget={modalPayload} onClose={closeModal} />;
  if (activeModal === "reserveApartment") return <ReserveApartmentModal presetApartmentId={modalPayload} onClose={closeModal} />;
  if (activeModal === "editReservation") return <EditReservationModal editTarget={modalPayload} onClose={closeModal} />;
  return null;
}

export default GlobalModals;
