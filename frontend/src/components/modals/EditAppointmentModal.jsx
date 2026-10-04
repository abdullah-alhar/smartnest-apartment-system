import { useState, useEffect } from "react";
import { Building2, Calendar, Save, CalendarClock } from "lucide-react";
import { updateAppointment } from "../../api/appointmentApi";
import { getApprovedApartments } from "../../api/apartmentApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../utils/errors";
import { toBackendLocalDateTime } from "../../utils/time";
import { Alert, Button, Input, Modal, Select } from "../ui";

const toLocalInputValue = (localDateTime) => {
  if (!localDateTime) return "";
  const d = new Date(localDateTime);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function EditAppointmentModal({ onClose, editTarget }) {
  const toast = useToast();
  const [apartments, setApartments] = useState(null);
  const [apartmentId, setApartmentId] = useState(editTarget?.apartmentId ? String(editTarget.apartmentId) : "");
  const [value, setValue] = useState(toLocalInputValue(editTarget?.requestedDate));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getApprovedApartments().then((rows) => { if (!cancelled) setApartments(rows); }).catch(() => { if (!cancelled) setApartments([]); });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apartmentId) { setError("Please select an apartment."); return; }
    if (!value) { setError("Please pick a date and time."); return; }
    setLoading(true);
    setError("");
    try {
      await updateAppointment(editTarget.appointmentId, {
        apartmentId: parseInt(apartmentId, 10),
        requestedDate: toBackendLocalDateTime(value),
      });
      toast.success("Appointment updated.");
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to update appointment."));
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Edit Site Visit" icon={CalendarClock} description="Change the apartment or your preferred date and time (09:00–17:00)."
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="edit-appt-form" icon={Save} loading={loading}>Save Changes</Button>
        </>
      )}>
      <form id="edit-appt-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Select id="ea-apt" label="Apartment" icon={Building2} value={apartmentId} onChange={(e) => setApartmentId(e.target.value)} disabled={apartments === null} required>
          <option value="">{apartments === null ? "Loading apartments…" : "Select an apartment"}</option>
          {apartments?.map((a) => <option key={a.apartmentId} value={a.apartmentId}>{a.title}</option>)}
        </Select>
        <Input id="ea-datetime" label="Preferred Date & Time" icon={Calendar} type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} required />
        {error && <Alert>{error}</Alert>}
      </form>
    </Modal>
  );
}

export default EditAppointmentModal;
