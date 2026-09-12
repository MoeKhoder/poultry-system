import { useRef, useState } from "react";
import "./PhotoUpload.css";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

export default function PhotoUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("الصيغ المسموحة: PNG, SVG, JPG");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("الحجم الأقصى 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="photo-upload">
      <button type="button" className="photo-upload-box" onClick={() => inputRef.current?.click()}>
        {value ? (
          <img src={value} alt="" className="photo-upload-preview" />
        ) : (
          <>
            <span className="photo-upload-icon">📤</span>
            <span className="photo-upload-hint">PNG, SVG, JPG up to 5MB</span>
          </>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleFile} hidden />
      {value && (
        <button type="button" className="photo-upload-remove" onClick={() => onChange(null)}>
          إزالة الصورة
        </button>
      )}
      {error && <p className="modal-error">{error}</p>}
    </div>
  );
}
