import { useEffect, useState } from "react";
import { Home, FileText, Banknote, Ruler, MapPin, Send, BedDouble, Building2 } from "lucide-react";
import {
  createApartment, updateApartment, getApartmentForEdit, uploadApartmentImage, removeApartmentImage, apartmentImageSrc,
} from "../../api/apartmentApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../utils/errors";
import { SkeletonBlock } from "../Skeleton";
import ImagePicker from "../ImagePicker";
import { Alert, Button, Input, Modal, Textarea } from "../ui";

const EMPTY = {
  title: "", description: "", price: "", roomCount: "", size: "", street: "", city: "", postalCode: "",
};

function Section({ title, children }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-grey-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </section>
  );
}

function CreateApartmentModal({ onClose, editTarget }) {
  const toast = useToast();
  const isEdit = !!editTarget;

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [removeCurrent, setRemoveCurrent] = useState(false);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    getApartmentForEdit(editTarget.apartmentId)
      .then((d) => {
        if (cancelled) return;
        setForm({
          title: d.title ?? "", description: d.description ?? "", price: d.price ?? "", roomCount: d.roomCount ?? "",
          size: d.size ?? "", street: d.address?.street ?? "", city: d.address?.city ?? "", postalCode: d.address?.postalCode ?? "",
        });
        setCurrentImage(apartmentImageSrc(d.imageUrl));
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(extractErrorMessage(err, "Could not load this listing."));
        onClose();
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!(parseFloat(form.price) > 0)) e.price = "Price must be greater than 0.";
    if (!(parseInt(form.roomCount, 10) > 0)) e.roomCount = "Room count must be greater than 0.";
    if (!(parseFloat(form.size) > 0)) e.size = "Size must be greater than 0.";
    if (!form.street.trim()) e.street = "Street is required.";
    if (!form.city.trim()) e.city = "City is required.";
    if (!form.postalCode.trim()) e.postalCode = "Postal code is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /** Uploads a newly chosen photo, or removes the saved one. Returns false (after telling the user) if it failed. */
  const savePhoto = async (apartmentId) => {
    try {
      if (imageFile) await uploadApartmentImage(apartmentId, imageFile);
      else if (removeCurrent && currentImage) await removeApartmentImage(apartmentId);
      return true;
    } catch (err) {
      toast.error(`Listing saved, but the photo couldn't be updated: ${extractErrorMessage(err, "please try again from Edit Listing.")}`);
      return false;
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError("");
    if (!validate()) {
      setFormError("Some details are missing or invalid — please check the highlighted fields.");
      return;
    }

    const data = {
      title: form.title.trim(),
      description: form.description,
      price: parseFloat(form.price),
      roomCount: parseInt(form.roomCount, 10),
      size: parseFloat(form.size),
      address: { street: form.street.trim(), city: form.city.trim(), postalCode: form.postalCode.trim() },
    };

    setSaving(true);
    try {
      const saved = isEdit ? await updateApartment(editTarget.apartmentId, data) : await createApartment(data);
      const apartmentId = saved?.apartmentId ?? editTarget?.apartmentId;
      const photoOk = await savePhoto(apartmentId);
      if (photoOk) {
        toast.success(isEdit ? "Listing resubmitted! It's now pending approval." : "Listing submitted! It's now pending approval.");
      }
      onClose();
    } catch (err) {
      const message = extractErrorMessage(err, `Failed to ${isEdit ? "resubmit" : "create"} listing. Please check your inputs.`);
      setFormError(message);
      toast.error(message);
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} dismissable={!saving} size="lg" icon={Building2}
      title={isEdit ? "Edit Listing" : "List New Apartment"}
      description={isEdit
        ? "Update the details below. It goes back to the Operations Manager for review."
        : "Fill in every field. An Operations Manager reviews the listing before it goes live."}
      footer={!loading && (
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button id="ca-submit-btn" type="submit" form="apartment-form" icon={Send} loading={saving}>
            {isEdit ? "Resubmit Listing" : "Submit Listing"}
          </Button>
        </>
      )}>
      {loading ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          <SkeletonBlock height={40} /><SkeletonBlock height={90} /><SkeletonBlock height={40} />
        </div>
      ) : (
        <form id="apartment-form" onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
          <Section title="Basics">
            <div className="flex flex-col gap-4">
              <Input id="ca-title" label="Title" icon={Home} name="title" maxLength={255} placeholder="e.g. Sunset Heights 3B"
                value={form.title} onChange={handle} error={errors.title} />
              <Textarea id="ca-desc" label="Description" icon={FileText} name="description" maxLength={2000} rows={4}
                placeholder="Describe the apartment, the building and the neighbourhood…" value={form.description} onChange={handle} />
            </div>
          </Section>

          <Section title="Details">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input id="ca-price" label="Price (LKR)" icon={Banknote} name="price" type="number" min="0" step="1000"
                value={form.price} onChange={handle} error={errors.price} />
              <Input id="ca-size" label="Size (sq ft)" icon={Ruler} name="size" type="number" min="0" step="0.1"
                value={form.size} onChange={handle} error={errors.size} />
              <Input id="ca-rooms" label="Total rooms" icon={BedDouble} name="roomCount" type="number" min="1" step="1"
                value={form.roomCount} onChange={handle} error={errors.roomCount} />
            </div>
          </Section>

          <Section title="Location">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input id="ca-street" label="Street" icon={MapPin} name="street" value={form.street} onChange={handle} error={errors.street} />
              <Input id="ca-city" label="City" name="city" value={form.city} onChange={handle} error={errors.city} />
              <Input id="ca-postal" label="Postal code" name="postalCode" value={form.postalCode} onChange={handle} error={errors.postalCode} />
            </div>
          </Section>

          <Section title="Photo">
            <ImagePicker id="ca-image" file={imageFile} onChange={setImageFile}
              currentSrc={removeCurrent ? null : currentImage} onRemoveCurrent={() => setRemoveCurrent(true)} />
          </Section>

          {formError && <Alert>{formError}</Alert>}
        </form>
      )}
    </Modal>
  );
}

export default CreateApartmentModal;
