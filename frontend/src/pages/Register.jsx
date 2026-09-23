import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try { await register(form); navigate("/dashboard"); }
    catch (err) { setError(err.response?.data?.error || "Could not register"); }
  };

  return (
    <AuthLayout title="Create your account">
      <form onSubmit={submit}>
        <label>Name <input required value={form.name} onChange={set("name")} /></label>
        <label>Email <input type="email" required value={form.email} onChange={set("email")} /></label>
        <label>Phone <input value={form.phone} onChange={set("phone")} /></label>
        <label>Password <input type="password" required minLength={6} value={form.password} onChange={set("password")} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-lg">Create account</button>
      </form>
      <p>Already booked before? <Link to="/login">Log in</Link></p>
    </AuthLayout>
  );
}
