import { useEffect, useState } from "react";
import { getCoupons, addCoupon, updateCoupon, deleteCoupon } from "../../api/admin";

const BLANK = { code: "", percent_off: 10, expires_on: "" };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState("");

  const load = () => getCoupons().then(setCoupons).catch(() => setError("Could not load coupons."));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await addCoupon({ ...form, percent_off: Number(form.percent_off) });
      setForm(BLANK);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not create coupon.");
    }
  };

  const onToggle = (c) => updateCoupon(c.id, { is_active: !c.is_active }).then(load);
  const onDelete = (id) => deleteCoupon(id).then(load);

  return (
    <div>
      <h2 className="admin-subheading">New coupon</h2>
      <form className="admin-form" onSubmit={submit}>
        <label>Code
          <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </label>
        <label>Discount %
          <input required type="number" min="1" max="100" value={form.percent_off}
                 onChange={(e) => setForm({ ...form, percent_off: e.target.value })} />
        </label>
        <label>Expires on
          <input type="date" value={form.expires_on} onChange={(e) => setForm({ ...form, expires_on: e.target.value })} />
        </label>
        {error && <p className="error admin-form-full">{error}</p>}
        <div className="admin-form-full"><button className="btn">Create coupon</button></div>
      </form>

      <h2 className="admin-subheading">All coupons</h2>
      <table className="admin-table">
        <thead><tr><th>Code</th><th>Discount</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id}>
              <td>{c.code}</td>
              <td>{c.percent_off}%</td>
              <td>{c.expires_on || "No expiry"}</td>
              <td>
                <span className={`admin-badge ${c.is_active ? "admin-badge-on" : "admin-badge-off"}`}>
                  {c.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="admin-actions">
                <button className="btn btn-small btn-outline" onClick={() => onToggle(c)}>
                  {c.is_active ? "Deactivate" : "Activate"}
                </button>
                <button className="btn btn-small btn-outline" onClick={() => onDelete(c.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {!coupons.length && <tr><td colSpan="5" className="muted">No coupons yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}