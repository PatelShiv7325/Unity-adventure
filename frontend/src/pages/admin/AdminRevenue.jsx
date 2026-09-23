import { useEffect, useState } from "react";
import { getRevenue } from "../../api/admin";

export default function AdminRevenue() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getRevenue().then(setData).catch(() => setError("Could not load revenue report."));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading...</p>;

  const maxActivity = Math.max(1, ...data.by_activity.map((r) => r.revenue));
  const maxMonth = Math.max(1, ...data.by_month.map((r) => r.revenue));

  return (
    <div>
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-value">₹{data.total_revenue.toLocaleString("en-IN")}</div>
          <div className="admin-stat-label">Total Revenue (paid bookings)</div>
        </div>
      </div>

      <h2 className="admin-subheading">Revenue by activity</h2>
      <div className="admin-bars">
        {data.by_activity.map((r) => (
          <div key={r.activity} className="admin-bar-row">
            <div className="admin-bar-label">{r.activity}</div>
            <div className="admin-bar-track">
              <div className="admin-bar-fill" style={{ width: `${(r.revenue / maxActivity) * 100}%` }} />
            </div>
            <div className="admin-bar-value">₹{r.revenue.toLocaleString("en-IN")}</div>
          </div>
        ))}
        {!data.by_activity.length && <p className="muted">No paid bookings yet.</p>}
      </div>

      <h2 className="admin-subheading">Revenue by month</h2>
      <div className="admin-bars">
        {data.by_month.map((r) => (
          <div key={r.month} className="admin-bar-row">
            <div className="admin-bar-label">{r.month}</div>
            <div className="admin-bar-track">
              <div className="admin-bar-fill" style={{ width: `${(r.revenue / maxMonth) * 100}%` }} />
            </div>
            <div className="admin-bar-value">₹{r.revenue.toLocaleString("en-IN")}</div>
          </div>
        ))}
        {!data.by_month.length && <p className="muted">No paid bookings yet.</p>}
      </div>
    </div>
  );
}