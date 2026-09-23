import client from "./client";

// Overview
export const getOverview = () => client.get("/admin/overview").then((r) => r.data);

// Activities
export const addActivity = (payload) => client.post("/admin/activities", payload).then((r) => r.data);
export const updateActivity = (id, payload) => client.put(`/admin/activities/${id}`, payload).then((r) => r.data);
export const toggleActivity = (id) => client.patch(`/admin/activities/${id}/toggle`).then((r) => r.data);
export const deleteActivity = (id) => client.delete(`/admin/activities/${id}`).then((r) => r.data);

// Bookings
export const getAllBookings = () => client.get("/admin/bookings").then((r) => r.data);
export const updateBookingStatus = (id, status) =>
  client.patch(`/admin/bookings/${id}/status`, { status }).then((r) => r.data);
export const refundBooking = (id) => client.patch(`/admin/bookings/${id}/refund`).then((r) => r.data);

// Users
export const getAllUsers = () => client.get("/admin/users").then((r) => r.data);
export const deleteUser = (id) => client.delete(`/admin/users/${id}`).then((r) => r.data);

// Revenue
export const getRevenue = () => client.get("/admin/revenue").then((r) => r.data);

// Coupons
export const getCoupons = () => client.get("/admin/coupons").then((r) => r.data);
export const addCoupon = (payload) => client.post("/admin/coupons", payload).then((r) => r.data);
export const updateCoupon = (id, payload) => client.put(`/admin/coupons/${id}`, payload).then((r) => r.data);
export const deleteCoupon = (id) => client.delete(`/admin/coupons/${id}`).then((r) => r.data);