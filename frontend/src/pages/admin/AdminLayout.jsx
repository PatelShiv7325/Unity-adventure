import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <section className="section">
      <h1>Admin</h1>
      <nav className="subnav">
        <NavLink end to="/admin">Overview</NavLink>
        <NavLink to="/admin/activities">Activities</NavLink>
        <NavLink to="/admin/bookings">Bookings</NavLink>
        <NavLink to="/admin/users">Users</NavLink>
        <NavLink to="/admin/revenue">Revenue</NavLink>
        <NavLink to="/admin/coupons">Coupons</NavLink>
      </nav>
      <Outlet />
    </section>
  );
}
