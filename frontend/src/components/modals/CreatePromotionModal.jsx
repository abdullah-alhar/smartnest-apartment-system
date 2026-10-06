import { useState, useEffect } from "react";
import { Building2, User, Tag, Percent, Calendar, Star, Send } from "lucide-react";
import { createPromotion, updatePromotion } from "../../api/promotionApi";
import { getApprovedApartments } from "../../api/apartmentApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../utils/errors";
import { Button, Input, Modal, Select, Textarea } from "../ui";

const MAX_DURATION_YEARS = 2;
const MAX_DISCOUNT_PERCENTAGE = 90;

function CreatePromotionModal({ onClose, editTarget }) {
  const { userId } = useAuth();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const isEdit = !!editTarget;

  const [form, setForm] = useState({
    apartmentId:        editTarget?.apartmentId ?? "",
    salesStaffId:       editTarget?.salesStaffId ?? userId ?? "",
    title:              editTarget?.title ?? "",
    discountDetails:    editTarget?.discountDetails ?? "",
    discountPercentage: editTarget?.discountPercentage ?? "",
    startDate:          editTarget?.startDate ?? "",
    endDate:            editTarget?.endDate ?? "",
    isFeatured:         editTarget?.isFeatured ?? false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apartments, setApartments] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getApprovedApartments().then((rows) => { if (!cancelled) setApartments(rows); }).catch(() => { if (!cancelled) setApartments([]); });
    return () => { cancelled = true; };
  }, []);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setFieldErrors((p) => ({ ...p, [name]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!(parseFloat(form.discountPercentage) >= 1)) {
      errors.discountPercentage = "Discount percentage must be at least 1%.";
    } else if (parseFloat(form.discountPercentage) > MAX_DISCOUNT_PERCENTAGE) {
      errors.discountPercentage = `Discount percentage cannot exceed ${MAX_DISCOUNT_PERCENTAGE}%.`;
    }
    if (form.startDate && form.startDate < today) {
      errors.startDate = "Start date cannot be in the past.";
    }
    if (form.endDate && form.startDate && form.endDate <= form.startDate) {
      errors.endDate = "End date must be after start date.";
    } else if (form.endDate && form.startDate) {
      const maxEnd = new Date(form.startDate);
      maxEnd.setFullYear(maxEnd.getFullYear() + MAX_DURATION_YEARS);
      if (new Date(form.endDate) > maxEnd) {
        errors.endDate = `A promotion cannot run for more than ${MAX_DURATION_YEARS} years.`;
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const payload = {
      ...form,
      apartmentId:        parseInt(form.apartmentId, 10),
      salesStaffId:       parseInt(userId, 10),
      discountPercentage: parseFloat(form.discountPercentage),
    };

    try {
      if (isEdit) {
        await updatePromotion(editTarget.id, payload);
        toast.success("Promotion resubmitted! It's now pending approval.");
      } else {
        await createPromotion(payload);
        toast.success("Promotion submitted! It's now pending approval.");
      }
      onClose();
    } catch (err) {
      toast.error(extractErrorMessage(err, `Failed to ${isEdit ? "resubmit" : "create"} promotion. Please check your inputs.`));
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} size="lg" icon={Tag}
      title={isEdit ? "Edit Promotion" : "Create Promotion"}
      description={isEdit ? "Update the details below and resubmit for Operations Manager review." : "Submit a new promotion for Operations Manager review."}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button id="cp-submit-btn" type="submit" form="promotion-form" icon={Send} loading={loading}>
            {isEdit ? "Resubmit Promotion" : "Submit Promotion"}
          </Button>
        </>
      )}>
      <form id="promotion-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select id="cp-apt" label="Apartment" icon={Building2} name="apartmentId" value={form.apartmentId} onChange={handle} required disabled={apartments === null}
            hint={apartments?.length === 0 ? "No approved apartments yet — list and approve one first." : undefined}>
            <option value="">{apartments === null ? "Loading apartments…" : "Select an apartment"}</option>
            {apartments?.map((a) => (
              <option key={a.apartmentId} value={a.apartmentId}>{a.title} — LKR {Number(a.price).toLocaleString("en-US")}</option>
            ))}
          </Select>
          <Input id="cp-staff" label="Sales Staff ID" icon={User} name="salesStaffId" type="number" value={form.salesStaffId} readOnly disabled
            hint="Your account ID — cannot be changed" />
        </div>

        <Input id="cp-title" label="Promotion Title" icon={Tag} name="title" maxLength={255} placeholder="e.g. Year-End Move-In Special"
          value={form.title} onChange={handle} required />

        <Textarea id="cp-details" label="Discount Details" name="discountDetails" maxLength={1000} placeholder="Describe the promotion offer…"
          value={form.discountDetails} onChange={handle} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input id="cp-pct" label="Discount %" icon={Percent} name="discountPercentage" type="number"
            placeholder={`1–${MAX_DISCOUNT_PERCENTAGE}`} min="1" max={MAX_DISCOUNT_PERCENTAGE} step="0.01"
            value={form.discountPercentage} onChange={handle} error={fieldErrors.discountPercentage} required />
          <Input id="cp-start" label="Start Date" icon={Calendar} name="startDate" type="date" min={today}
            value={form.startDate} onChange={handle} error={fieldErrors.startDate} required />
          <Input id="cp-end" label="End Date" icon={Calendar} name="endDate" type="date"
            value={form.endDate} onChange={handle} error={fieldErrors.endDate} required />
        </div>

        <label className="flex items-center justify-between gap-4 bg-off-white rounded-xl px-4 py-3 cursor-pointer">
          <span className="flex items-center gap-2 text-sm font-medium text-primary"><Star size={15} className="text-accent" /> Mark as featured</span>
          <span className="relative inline-flex">
            <input type="checkbox" name="isFeatured" className="peer sr-only" checked={form.isFeatured} onChange={handle} />
            <span className="w-10 h-6 rounded-full bg-grey-200 peer-checked:bg-accent transition-colors" />
            <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
          </span>
        </label>
      </form>
    </Modal>
  );
}

export default CreatePromotionModal;
