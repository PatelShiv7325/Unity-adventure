import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import { errMsg } from "../utils/format";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(errMsg(err, "Could not register"));
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Create your account">
      <form onSubmit={submit}>
        <label>Name <input required autoComplete="name" value={form.name} onChange={set("name")} /></label>
        <label>Email <input type="email" required autoComplete="email" value={form.email} onChange={set("email")} /></label>
        <label>Phone <input inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" value={form.phone} onChange={set("phone")} /></label>
        <label>Password
          <div className="pw-field">
            <input type={show ? "text" : "password"} required minLength={6} autoComplete="new-password" value={form.password} onChange={set("password")} />
            <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
          </div>
          <span className="muted small">At least 6 characters</span>
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className={`btn btn-lg btn-block${busy ? " loading" : ""}`} disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p>Already booked before? <Link to="/login" state={location.state}>Log in</Link></p>
    </AuthLayout>
  );
}