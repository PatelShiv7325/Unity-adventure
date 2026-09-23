import { useEffect, useState } from "react";
import { getAllUsers, deleteUser } from "../../api/admin";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  const load = () => getAllUsers().then(setUsers).catch(() => setError("Could not load users."));
  useEffect(() => { load(); }, []);

  const onDelete = (id) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    deleteUser(id).then(load).catch((err) =>
      setError(err.response?.data?.error || "Could not delete user.")
    );
  };

  return (
    <div>
      <p className="muted">Total users: {users.length}</p>
      {error && <p className="error">{error}</p>}
      <table className="admin-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phone || "-"}</td>
              <td><span className={`admin-badge ${u.role === "admin" ? "admin-badge-on" : ""}`}>{u.role}</span></td>
              <td className="admin-actions">
                {u.role !== "admin" && (
                  <button className="btn btn-small btn-outline" onClick={() => onDelete(u.id)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
          {!users.length && <tr><td colSpan="5" className="muted">No users yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}