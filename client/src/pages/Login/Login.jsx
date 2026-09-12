import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BrandCredit from "../../components/BrandCredit/BrandCredit";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      const redirectTo = location.state?.from || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.isNetworkError) {
        setError("تعذر الاتصال بالخادم — تحقق من تشغيل الخادم والاتصال بالشبكة");
      } else if (err.status === 429) {
        setError("محاولات كثيرة، حاول لاحقاً");
      } else if (err.status === 401) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
      } else {
        setError("حدث خطأ غير متوقع، حاول مرة أخرى");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <BrandCredit onDark />
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div className="login-brand-icon">🐓</div>
          <div>
            <p className="login-brand-title">الشيخ تشيكن</p>
            <p className="login-brand-subtitle">تسجيل الدخول للوحة التحكم</p>
          </div>
        </div>

        <div className="login-field">
          <label>اسم المستخدم</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </div>

        <div className="login-field">
          <label>كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="btn-primary login-submit" disabled={loading}>
          {loading ? "جارٍ الدخول..." : "دخول"}
        </button>
      </form>
    </div>
  );
}
