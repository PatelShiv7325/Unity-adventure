import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import { errMsg } from "../utils/format";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(errMsg(err, "Login failed"));
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Welcome back">
      <form onSubmit={submit}>
        <label>Email <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password
          <div className="pw-field">
            <input type={show ? "text" : "password"} required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
          </div>
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className={`btn btn-lg btn-block${busy ? " loading" : ""}`} disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
      <p>New here? <Link to="/register" state={location.state}>Create an account</Link></p>
    </AuthLayout>
  );
}