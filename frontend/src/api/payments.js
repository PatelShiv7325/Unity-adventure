import client from "./client";

export const createOrder = (booking_id, payment_method = "card") =>
  client.post("/payments/create-order", { booking_id, payment_method }).then((r) => r.data);
export const verifyPayment = (payload) =>
  client.post("/payments/verify", payload).then((r) => r.data);
export const demoConfirm = (booking_id) =>
  client.post("/payments/demo-confirm", { booking_id }).then((r) => r.data);
export const upiVerify = (payload) =>
  client.post("/payments/upi-verify", payload).then((r) => r.data);
