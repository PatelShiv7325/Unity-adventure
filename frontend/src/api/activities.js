import client from "./client";

const CACHE_KEY = "activities-cache-v1";
let inflight = null;

// Rides saved from the last visit, so the page can show them instantly.
export function readCachedActivities() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed?.data) ? parsed.data : null;
  } catch {
    return null;
  }
}

// Always asks the server for fresh data. If two parts of the site ask at the same moment
// (for example the start-up prefetch and the Home page), they share ONE request.
export function getActivities() {
  if (inflight) return inflight;
  inflight = client
    .get("/activities", { timeout: 60000 }) // a sleeping Render server can need ~50 seconds to wake up
    .then((r) => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data: r.data }));
      } catch { /* storage full or blocked - ignore */ }
      return r.data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

// Called once when the site opens: wakes the server up and warms the cache.
export function prefetchActivities() {
  getActivities().catch(() => {});
}

export const getActivity = (slug) => client.get(`/activities/${slug}`).then((r) => r.data);
export const getSlots = (slug, date) =>
  client.get(`/activities/${slug}/slots`, { params: date ? { date } : {} }).then((r) => r.data);