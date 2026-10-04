import { useState, useEffect } from "react";
import { Building2, Calendar, Clock, Send, CalendarDays } from "lucide-react";
import { createAppointment, getAvailableSlots } from "../../api/appointmentApi";
import { getApprovedApartments } from "../../api/apartmentApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../utils/errors";
import { Alert, Button, Field, Input, Modal, Select } from "../ui";
import { cx } from "../styles";

const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function BookAppointmentModal({ onClose, presetApartmentId }) {
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);

  const [apartments, setApartments] = useState(null);
  const [apartmentId, setApartmentId] = useState(presetApartmentId ? String(presetApartmentId) : "");
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getApprovedApartments().then((rows) => { if (!cancelled) setApartments(rows); }).catch(() => { if (!cancelled) setApartments([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!apartmentId || !date) { setSlots(null); return undefined; }
    let cancelled = false;
    setSlots(null);
    setSelectedSlot("");
    getAvailableSlots(apartmentId, date)
      .then((rows) => { if (!cancelled) setSlots(rows); })
      .catch(() => { if (!cancelled) setSlots([]); });
    return () => { cancelled = true; };
  }, [apartmentId, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apartmentId) { setError("Please select an apartment."); return; }
    if (!selectedSlot) { setError("Please pick an available time slot."); return; }
    setLoading(true);
    setError("");
    try {
      await createAppointment({ apartmentId: parseInt(apartmentId, 10), requestedDate: selectedSlot });
      toast.success("Site visit requested! We'll confirm the slot shortly.");
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to request appointment."));
      setLoading(false);
    }
  };

  const open = slots?.filter((s) => s.available) ?? [];

  return (
    <Modal onClose={onClose} title="Book a Site Visit" icon={CalendarDays}
      description="Pick an apartment and an available slot (09:00–17:00) for a guided viewing."
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="book-visit-form" variant="accent" icon={Send} loading={loading}>Request Visit</Button>
        </>
      )}>
      <form id="book-visit-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Select id="ba-apt" label="Apartment" icon={Building2} value={apartmentId} onChange={(e) => setApartmentId(e.target.value)}
          disabled={apartments === null || !!presetApartmentId} required>
          <option value="">{apartments === null ? "Loading apartments…" : "Select an apartment"}</option>
          {apartments?.map((a) => <option key={a.apartmentId} value={a.apartmentId}>{a.title}</option>)}
        </Select>

        <Input id="ba-date" label="Date" icon={Calendar} type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />

        <Field label="Available slots">
          {!apartmentId && <p className="text-xs text-grey-400">Select an apartment first.</p>}
          {apartmentId && slots === null && <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{[1, 2, 3, 4].map((k) => <span key={k} className="skeleton h-10" />)}</div>}
          {apartmentId && slots !== null && open.length === 0 && (
            <p className="text-sm text-grey-500 bg-grey-50 border border-dashed border-grey-200 rounded-xl px-4 py-3">No open slots on this date — try another day.</p>
          )}
          {open.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {open.map((s) => (
                <button type="button" key={s.slot} onClick={() => setSelectedSlot(s.slot)}
                  className={cx("flex items-center justify-center gap-1.5 h-10 rounded-xl text-sm font-medium border transition-colors",
                    selectedSlot === s.slot ? "bg-primary border-primary text-white" : "bg-green-50 border-green-500/60 text-green-700 hover:bg-green-100")}>
                  <Clock size={13} /> {fmtTime(s.slot)}
                </button>
              ))}
            </div>
          )}
        </Field>

        {error && <Alert>{error}</Alert>}
      </form>
    </Modal>
  );
}

export default BookAppointmentModal;
