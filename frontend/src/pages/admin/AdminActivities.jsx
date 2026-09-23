import { useEffect, useState } from "react";
import { getActivities } from "../../api/activities";
import { addActivity, updateActivity, toggleActivity, deleteActivity } from "../../api/admin";

const BLANK = {
  title: "", slug: "", price: "", duration_minutes: 30, location: "",
  difficulty: "Easy", description: "", safety_notes: "", image_url: "",
};

export default function AdminActivities() {
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = () => getActivities().then(setActivities);
  useEffect(() => { load(); }, []);

  const startEdit = (a) => {
    setEditingId(a.id);
    setForm({
      title: a.title, slug: a.slug, price: a.price, duration_minutes: a.duration_minutes,
      location: a.location || "", difficulty: a.difficulty || "Easy",
      description: a.description || "", safety_notes: a.safety_notes || "",
      image_url: a.image_url || "",
    });
  };

  const cancelEdit = () => { setEditingId(null); setForm(BLANK); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, price: Number(form.price), duration_minutes: Number(form.duration_minutes) };
      if (editingId) {
        await updateActivity(editingId, payload);
      } else {
        await addActivity(payload);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not save activity.");
    }
  };

  const onToggle = (id) => toggleActivity(id).then(load);

  const onDelete = (id) => {
    if (!confirm("Delete this activity? This cannot be undone.")) return;
    deleteActivity(id).then(load).catch((err) =>
      setError(err.response?.data?.error || "Could not delete activity.")
    );
  };

  return (
    <div>
      <h2 className="admin-subheading">{editingId ? "Edit activity" : "Add activity"}</h2>
      <form className="admin-form" onSubmit={submit}>
        <label>Title
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label>Slug
          <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </label>
        <label>Price (₹)
          <input required type="number" min="0" step="1" value={form.price}
                 onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </label>
        <label>Duration (minutes)
          <input required type="number" min="1" value={form.duration_minutes}
                 onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
        </label>
        <label>Location
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </label>
        <label>Difficulty
          <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
        </label>
        <label>Image URL
          <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        </label>
        <label className="admin-form-full">Description
          <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label className="admin-form-full">Safety notes
          <textarea rows="2" value={form.safety_notes} onChange={(e) => setForm({ ...form, safety_notes: e.target.value })} />
        </label>
        {error && <p className="error admin-form-full">{error}</p>}
        <div className="admin-form-full">
          <button className="btn">{editingId ? "Save changes" : "Add activity"}</button>{" "}
          {editingId && <button type="button" className="btn btn-outline" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      <h2 className="admin-subheading">All activities</h2>
      <table className="admin-table">
        <thead>
          <tr><th>Activity</th><th>Price</th><th>Duration</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {activities.map((a) => (
            <tr key={a.id}>
              <td>{a.title}<div className="muted">{a.location}</div></td>
              <td>₹{a.price}</td>
              <td>{a.duration_minutes} min</td>
              <td>
                <span className={`admin-badge ${a.is_active === false ? "admin-badge-off" : "admin-badge-on"}`}>
                  {a.is_active === false ? "Disabled" : "Active"}
                </span>
              </td>
              <td className="admin-actions">
                <button className="btn btn-small btn-outline" onClick={() => startEdit(a)}>Edit</button>
                <button className="btn btn-small btn-outline" onClick={() => onToggle(a.id)}>
                  {a.is_active === false ? "Enable" : "Disable"}
                </button>
                <button className="btn btn-small btn-outline" onClick={() => onDelete(a.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {!activities.length && <tr><td colSpan="5" className="muted">No activities yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}