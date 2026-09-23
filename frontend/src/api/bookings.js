import client from "./client";

export const createBooking = (payload) => client.post("/bookings", payload).then((r) => r.data);
export const getMyBookings = () => client.get("/bookings/mine").then((r) => r.data);
export const getBooking = (id) => client.get(`/bookings/${id}`).then((r) => r.data);
export const cancelBooking = (id) => client.post(`/bookings/${id}/cancel`).then((r) => r.data);
export const downloadTicket = (id) =>
  client.get(`/bookings/${id}/ticket`, { responseType: "blob" }).then((r) => r.data);