import { useState, useEffect } from "react";
import { Building2, Banknote, CreditCard, ArrowRight, ArrowLeft, CheckCircle2, MapPin, ShieldCheck, KeyRound, Check, FileText } from "lucide-react";
import { createReservation, uploadPaymentProof } from "../../api/reservationApi";
import { getApprovedApartments, getApartmentById } from "../../api/apartmentApi";
import { extractErrorMessage } from "../../utils/errors";
import { fmtPrice, fmtPercent } from "../../utils/format";
import { SkeletonBlock } from "../Skeleton";
import PdfPicker from "../PdfPicker";
import { ApartmentVisual } from "../ApartmentCard";
import { checkPdf } from "../../utils/pdf";
import { Alert, Button, Input, Modal, Select } from "../ui";
import { cx } from "../styles";

const METHODS = [
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ONLINE", label: "Online Payment" },
  { value: "CASH", label: "Cash" },
];
const methodLabel = (v) => METHODS.find((m) => m.value === v)?.label ?? v;

function ApartmentSummary({ apt }) {
  return (
    <div className="bg-off-white rounded-xl p-4 flex items-center gap-4">
      <ApartmentVisual apartment={apt} className="w-16 h-14 rounded-xl flex-shrink-0 [&_svg]:w-5 [&_svg]:h-5 [&_p]:hidden" />
      <div className="min-w-0">
        <p className="font-medium text-primary truncate">{apt.title}</p>
        <p className="text-xs text-grey-400 flex items-center gap-1"><MapPin size={12} /> {[apt.address?.street, apt.address?.city].filter(Boolean).join(", ")}</p>
        <p className="text-sm mt-0.5">
          {apt.discountedPrice
            ? <><b className="text-accent-dark">{fmtPrice(apt.discountedPrice)}</b> <s className="text-grey-400 text-xs ml-1">{fmtPrice(apt.price)}</s> <span className="text-xs text-green-600 font-medium ml-1">{fmtPercent(apt.discountPercentage)}% off</span></>
            : <b className="text-primary">{fmtPrice(apt.price)}</b>}
        </p>
      </div>
    </div>
  );
}

function Line({ label, value, strong, good }) {
  return (
    <div className={cx("flex items-center justify-between gap-4 py-2 text-sm", strong && "font-semibold", good && "text-green-600")}>
      <span className={cx(!good && "text-grey-500")}>{label}</span>
      <b className={cx(good ? "text-green-600" : "text-primary", !strong && "font-medium")}>{value}</b>
    </div>
  );
}

function Steps({ index }) {
  const steps = ["Payment", "Review", "Done"];
  return (
    <ol className="flex items-center gap-2 mb-6" aria-label="Progress">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-2 flex-1">
          <span className={cx("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
            i < index ? "bg-green-500 text-white" : i === index ? "bg-primary text-white" : "bg-grey-100 text-grey-400")}>
            {i < index ? <Check size={14} /> : i + 1}
          </span>
          <span className={cx("text-xs font-medium", i === index ? "text-primary" : "text-grey-400")}>{label}</span>
          {i < steps.length - 1 && <span className="flex-1 h-px bg-grey-200" />}
        </li>
      ))}
    </ol>
  );
}

function ReserveApartmentModal({ onClose, presetApartmentId }) {
  const [step, setStep] = useState("form");
  const [apartments, setApartments] = useState(null);
  const [apartmentId, setApartmentId] = useState(presetApartmentId ? String(presetApartmentId) : "");
  const [apt, setApt] = useState(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CARD");
  const [proof, setProof] = useState(null);
  const [proofError, setProofError] = useState("");
  const [uploadWarning, setUploadWarning] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (presetApartmentId) return undefined;
    let cancelled = false;
    getApprovedApartments().then((rows) => {
      if (!cancelled) setApartments(rows.filter((a) => a.availabilityStatus === "AVAILABLE"));
    }).catch(() => { if (!cancelled) setApartments([]); });
    return () => { cancelled = true; };
  }, [presetApartmentId]);

  useEffect(() => {
    if (!apartmentId) { setApt(null); return undefined; }
    let cancelled = false;
    setApt(null);
    setError("");
    getApartmentById(apartmentId)
      .then((d) => {
        if (cancelled) return;
        setApt(d);
        setAmount(String(d.advancePaymentAmount ?? ""));
      })
      .catch((err) => { if (!cancelled) setError(extractErrorMessage(err, "Could not load this apartment.")); });
    return () => { cancelled = true; };
  }, [apartmentId]);

  const finalPrice = apt ? Number(apt.discountedPrice ?? apt.price) : 0;
  const advance = parseFloat(amount);

  const review = (e) => {
    e.preventDefault();
    if (!apt) { setError("Please select an apartment."); return; }
    if (apt.availabilityStatus !== "AVAILABLE") { setError("This apartment is no longer available to reserve."); return; }
    if (!(advance > 0)) { setError("Please enter a valid advance payment amount."); return; }
    if (advance > finalPrice) { setError("The advance payment can't be more than the apartment's final price."); return; }
    const pdfProblem = checkPdf(proof);
    if (pdfProblem) { setProofError(pdfProblem); return; }
    setError("");
    setStep("confirm");
  };

  const confirm = async () => {
    setLoading(true);
    setError("");
    try {
      const reservation = await createReservation({ apartmentId: apt.apartmentId, initialPaymentAmount: advance, paymentMethod: method });
      try {
        setResult(await uploadPaymentProof(reservation.reservationId, proof));
        setUploadWarning("");
      } catch (uploadErr) {
        // The reservation exists; the customer can retry the upload from My Reservations.
        setResult(reservation);
        setUploadWarning(extractErrorMessage(uploadErr, "Your payment proof couldn't be uploaded."));
      }
      setStep("success");
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to submit reservation."));
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <Modal onClose={onClose} size="md">
        <div className="text-center py-4">
          <span className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={36} strokeWidth={1.75} /></span>
          <h2 className="font-serif text-2xl font-bold text-primary mb-2">Reservation Submitted</h2>
          <p className="text-sm text-grey-500 max-w-sm mx-auto mb-6">
            Thank you! An Operations Manager will verify your advance payment and approve the reservation. We'll notify you as soon as that happens.
          </p>
          <div className="bg-off-white rounded-xl px-4 py-2 text-left mb-6 divide-y divide-grey-200">
            <Line label="Reservation no." value={`RES-${result?.reservationId ?? "—"}`} />
            <Line label="Apartment" value={apt?.title} />
            <Line label="Advance paid" value={fmtPrice(advance)} strong />
            <Line label="Payment proof" value={uploadWarning ? "Not uploaded" : proof?.name} />
            <Line label="Status" value="Pending approval" />
          </div>
          {uploadWarning && (
            <Alert tone="warning" className="text-left mb-6">
              {uploadWarning} Your reservation was saved — open <b>My Reservations</b> and use <b>Upload proof</b> to attach the PDF.
            </Alert>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button to="/reservations" onClick={onClose}>View My Reservations <ArrowRight size={15} /></Button>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </Modal>
    );
  }

  const formFooter = (
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button type="submit" form="reserve-form" disabled={!apt}>Review Reservation <ArrowRight size={15} /></Button>
    </>
  );
  const confirmFooter = (
    <>
      <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep("form")} disabled={loading}>Back</Button>
      <Button variant="accent" icon={KeyRound} loading={loading} onClick={confirm}>Confirm Reservation</Button>
    </>
  );

  return (
    <Modal onClose={onClose} dismissable={!loading} title="Reserve Apartment" icon={KeyRound} footer={step === "form" ? formFooter : confirmFooter}>
      <Steps index={step === "form" ? 0 : 1} />

      {step === "form" && (
        <form id="reserve-form" onSubmit={review} className="flex flex-col gap-5">
          {!presetApartmentId && (
            <Select id="rs-apt" label="Apartment" icon={Building2} value={apartmentId} onChange={(e) => setApartmentId(e.target.value)} disabled={apartments === null} required
              hint={apartments?.length === 0 ? "No apartments are currently available to reserve." : undefined}>
              <option value="">{apartments === null ? "Loading apartments…" : "Select an available apartment"}</option>
              {apartments?.map((a) => <option key={a.apartmentId} value={a.apartmentId}>{a.title} — {fmtPrice(a.discountedPrice || a.price)}</option>)}
            </Select>
          )}

          {apartmentId && !apt && !error && <SkeletonBlock height={84} radius={12} />}
          {apt && <ApartmentSummary apt={apt} />}

          {apt && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="rs-amount" label="Advance payment (LKR)" icon={Banknote} type="number" min="0" step="1000"
                value={amount} onChange={(e) => setAmount(e.target.value)} required
                hint={`Suggested: ${fmtPrice(apt.advancePaymentAmount)} (10% of the final price)`} />
              <Select id="rs-method" label="Payment method" icon={CreditCard} value={method} onChange={(e) => setMethod(e.target.value)}>
                {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
            </div>
          )}

          {apt && (
            <PdfPicker id="rs-proof" file={proof} error={proofError}
              onChange={(f) => { setProof(f); setProofError(""); }} />
          )}

          {error && <Alert>{error}</Alert>}
        </form>
      )}

      {step === "confirm" && apt && (
        <div className="flex flex-col gap-5">
          <ApartmentSummary apt={apt} />
          <div className="rounded-xl border border-grey-100 px-4 py-2">
            <Line label="Listed price" value={fmtPrice(apt.price)} />
            {apt.discountedPrice && <Line label={`Promotion (${fmtPercent(apt.discountPercentage)}% off)`} value={`− ${fmtPrice(Number(apt.price) - Number(apt.discountedPrice))}`} good />}
            <Line label="Final price" value={fmtPrice(finalPrice)} strong />
            <hr className="my-1 border-grey-100" />
            <Line label={`Advance payment · ${methodLabel(method)}`} value={fmtPrice(advance)} strong />
            <Line label="Balance after advance" value={fmtPrice(finalPrice - advance)} />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-grey-100 px-4 py-3">
            <FileText size={18} className="text-accent flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-grey-400">Payment proof</p>
              <p className="text-sm font-medium text-primary truncate">{proof?.name}</p>
            </div>
          </div>
          <p className="flex gap-2 text-xs text-grey-500 bg-blue-50 rounded-xl p-3">
            <ShieldCheck size={16} className="text-blue-600 flex-shrink-0" />
            <span>Your reservation stays <b>pending</b> until an Operations Manager checks your payment proof and approves it. You can cancel a pending reservation from My Reservations.</span>
          </p>
          {error && <Alert>{error}</Alert>}
        </div>
      )}
    </Modal>
  );
}

export default ReserveApartmentModal;
