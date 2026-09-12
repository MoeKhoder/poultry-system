import { useState } from "react";
import Modal from "../Modal/Modal";
import "./ConfirmDeleteModal.css";

export default function ConfirmDeleteModal({ message, onConfirm, onCancel }) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal title="" onClose={onCancel}>
      <div className="confirm-delete">
        <div className="confirm-delete-icon">🗑️</div>
        <p className="confirm-delete-message">{message}</p>
        <div className="confirm-delete-warning">
          ⚠️ هذا الإجراء نهائي ولا يمكن التراجع عنه بعد الآن
        </div>
        <div className="modal-actions confirm-delete-actions">
          <button type="button" className="btn-outline" onClick={onCancel} disabled={deleting}>
            إلغاء
          </button>
          <button type="button" className="confirm-delete-btn" onClick={handleConfirm} disabled={deleting}>
            {deleting ? "جارٍ الحذف..." : "🗑️ حذف نهائي"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
