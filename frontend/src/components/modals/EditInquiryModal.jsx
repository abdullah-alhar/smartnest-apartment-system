import { useState } from "react";
import { Save, Pencil } from "lucide-react";
import { updateInquiry } from "../../api/inquiryApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../utils/errors";
import { Alert, Button, Modal, Textarea } from "../ui";

function EditInquiryModal({ onClose, editTarget }) {
  const toast = useToast();
  const [question, setQuestion] = useState(editTarget?.question ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) { setError("Please enter your question."); return; }
    setLoading(true);
    setError("");
    try {
      await updateInquiry(editTarget.inquiryId, question.trim());
      toast.success("Inquiry updated.");
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to update inquiry."));
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Edit Question" icon={Pencil} description={editTarget?.apartmentTitle || `Apartment #${editTarget?.apartmentId}`}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="edit-inquiry-form" icon={Save} loading={loading}>Save Changes</Button>
        </>
      )}>
      <form id="edit-inquiry-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Textarea id="eq-question" label="Your Question" rows={5} maxLength={2000} required autoFocus
          value={question} onChange={(e) => setQuestion(e.target.value)} />
        {error && <Alert>{error}</Alert>}
      </form>
    </Modal>
  );
}

export default EditInquiryModal;
