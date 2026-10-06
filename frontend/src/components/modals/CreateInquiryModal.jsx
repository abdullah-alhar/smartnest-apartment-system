import { useState, useEffect } from "react";
import { Building2, Send, MessageCircle } from "lucide-react";
import { createInquiry } from "../../api/inquiryApi";
import { getApprovedApartments } from "../../api/apartmentApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../utils/errors";
import { Alert, Button, Modal, Select, Textarea } from "../ui";

function CreateInquiryModal({ onClose, presetApartmentId }) {
  const toast = useToast();
  const [apartments, setApartments] = useState(null);
  const [apartmentId, setApartmentId] = useState(presetApartmentId ? String(presetApartmentId) : "");
  const [question, setQuestion] = useState("");
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
    if (!question.trim()) { setError("Please enter your question."); return; }
    setLoading(true);
    setError("");
    try {
      await createInquiry({ apartmentId: parseInt(apartmentId, 10), question: question.trim() });
      toast.success("Inquiry submitted! A relations officer will respond soon.");
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to submit inquiry."));
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Ask a Question" icon={MessageCircle} description="Send a question to our Customer Relations team about a listing."
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="inquiry-form" icon={Send} loading={loading}>Send Inquiry</Button>
        </>
      )}>
      <form id="inquiry-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Select id="iq-apt" label="Apartment" icon={Building2} value={apartmentId} onChange={(e) => setApartmentId(e.target.value)}
          disabled={apartments === null || !!presetApartmentId} required>
          <option value="">{apartments === null ? "Loading apartments…" : "Select an apartment"}</option>
          {apartments?.map((a) => <option key={a.apartmentId} value={a.apartmentId}>{a.title}</option>)}
        </Select>
        <Textarea id="iq-question" label="Your Question" rows={5} maxLength={2000} required
          placeholder="e.g. Is parking included, and what are the payment plan options?"
          value={question} onChange={(e) => setQuestion(e.target.value)} hint="Our team usually replies within 24 hours." />
        {error && <Alert>{error}</Alert>}
      </form>
    </Modal>
  );
}

export default CreateInquiryModal;
