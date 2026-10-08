import { downloadTicket } from "../api/bookings";

// Fetches the ticket image (needs the login token, so a plain <a href> cannot be used) and saves it.
export async function saveTicketFile(booking) {
  const blob = await downloadTicket(booking.id);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ticket-${booking.ticket_code}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}