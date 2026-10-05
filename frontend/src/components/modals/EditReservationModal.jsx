import { useState, useEffect } from "react";
import { Banknote, CreditCard, Save, KeyRound, Building2 } from "lucide-react";
import { getPayments, updateReservation } from "../../api/reservationApi";
import { getApprovedApartments, getApartmentById } from "../../api/apartmentApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../utils/errors";
import { fmtPrice } from "../../utils/format";
import { Alert, Button, Input, Modal, Select } from "../ui";

const METHODS = [
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ONLINE", label: "Online Payment" },
  { value: "CASH", label: "Cash" },
];

function EditReservationModal({ onClose, editTarget }) {
  const toast = useToast();
  const [apartments, setApartments] = useState(null);
  const [apartmentId, setApartmentId] = useState(String(editTarget.apartmentId));
  const [apt, setApt] = useState(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CARD");
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // The current payment details.
  useEffect(() => {
    let cancelled = false;
    getPayments(editTarget.reservationId)
      .then((rows) => {
        if (cancelled) return;
        const advance = [...rows].sort((a, b) => a.paymentNo - b.paymentNo)[0];
        if (advance) {
          setAmount(String(advance.amount));
          setMethod(advance.paymentMethod);
        }
      })
      .catch(() => { if (!cancelled) setError("Could not load the current advance payment details."); })
      .finally(() => { if (!cancelled) setLoadingPayment(false); });
    return () => { cancelled = true; };
  }, [editTarget.reservationId]);

  // Apartments the reservation can move to: available ones, plus the one it's on now.
  useEffect(() => {
    let cancelled = false;
    getApprovedApartments()
      .then((rows) => {
        if (cancelled) return;
        setApartments(rows.filter((a) => a.availabilityStatus === "AVAILABLE" || String(a.apartmentId) === String(editTarget.apartmentId)));
      })
      .catch(() => { if (!cancelled) setApartments([]); });
    return () => { cancelled = true; };
  }, [editTarget.apartmentId]);

  // Price details of the chosen apartment, for the suggested advance and the limit check.
  useEffect(() => {
    let cancelled = false;
    getApartmentById(apartmentId).then((d) => { if (!cancelled) setApt(d); }).catch(() => { if (!cancelled) setApt(null); });
    return () => { cancelled = true; };
  }, [apartmentId]);

  const changed = String(apartmentId) !== String(editTarget.apartmentId);
  const finalPrice = apt ? Number(apt.discountedPrice ?? apt.price) : null;

  const chooseApartment = (id) => {
    setApartmentId(id);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!(value > 0)) { setError("Please enter a valid advance payment amount."); return; }
    if (finalPrice != null && value > finalPrice) { setError("The advance payment can't be more than the apartment's final price."); return; }
    setLoading(true);
    setError("");
    try {
      await updateReservation(editTarget.reservationId, {
        amount: value, paymentMethod: method, apartmentId: parseInt(apartmentId, 10),
      });
      toast.success(changed ? "Reservation moved to the new apartment." : "Reservation updated.");
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to update reservation."));
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Edit Reservation" icon={KeyRound}
      description="Change the apartment or your advance payment details while the reservation is pending."
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="edit-res-form" icon={Save} loading={loading} disabled={loadingPayment || apartments === null}>Save Changes</Button>
        </>
      )}>
      <form id="edit-res-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select id="er-apartment" label="Apartment" icon={Building2} value={apartmentId}
          onChange={(e) => chooseApartment(e.target.value)} disabled={apartments === null}
          hint={apt ? `Final price ${fmtPrice(finalPrice)} · suggested advance ${fmtPrice(apt.advancePaymentAmount)} (10%)` : undefined}>
          {apartments === null && <option value={apartmentId}>Loading apartments…</option>}
          {apartments?.map((a) => (
            <option key={a.apartmentId} value={a.apartmentId}>
              {a.title}{String(a.apartmentId) === String(editTarget.apartmentId) ? " (current)" : ""}
            </option>
          ))}
        </Select>

        {changed && apt && (
          <Alert tone="info">
            Moving to <b>{apt.title}</b>. The suggested advance for this apartment is {fmtPrice(apt.advancePaymentAmount)}.{" "}
            <button type="button" className="underline font-medium" onClick={() => setAmount(String(apt.advancePaymentAmount))}>Use it</button>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="er-amount" label="Advance Payment (LKR)" icon={Banknote} type="number" min="0" step="1000"
            value={amount} onChange={(e) => setAmount(e.target.value)} disabled={loadingPayment} required />
          <Select id="er-method" label="Payment Method" icon={CreditCard} value={method}
            onChange={(e) => setMethod(e.target.value)} disabled={loadingPayment}>
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </div>

        {changed && (
          <p className="text-xs text-grey-500">
            Your uploaded payment proof stays attached. If the amount changes, upload the new transfer slip with <b>Replace</b> on the reservation card.
          </p>
        )}

        {error && <Alert>{error}</Alert>}
      </form>
    </Modal>
  );
}

export default EditReservationModal;
