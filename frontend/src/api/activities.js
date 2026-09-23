import client from "./client";

export const getActivities = () => client.get("/activities").then((r) => r.data);
export const getActivity = (slug) => client.get(`/activities/${slug}`).then((r) => r.data);
export const getSlots = (slug, date) =>
  client.get(`/activities/${slug}/slots`, { params: date ? { date } : {} }).then((r) => r.data);
