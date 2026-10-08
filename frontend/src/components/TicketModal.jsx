import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import { downloadTicket } from "../api/bookings";
import { saveTicketFile } from "../utils/download";
import { errMsg } from "../utils/format";
import { useToast } from "../context/ToastContext.jsx";

// Shows the real ticket image (same file that gets downloaded).
export default function TicketModal({ booking, onClose }) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (!booking) return;
    let url = "";
    setSrc(""); setError("");
    downloadTicket(booking.id)
      .then((blob) => { url = URL.createObjectURL(blob); setSrc(url); })
      .catch((e) => setError(errMsg(e, "Could not load the ticket")));
    return () => url && URL.revokeObjectURL(url);
  }, [booking]);

  const save = async () => {
    try { await saveTicketFile(booking); toast.success("Ticket downloaded"); }
    catch (e) { toast.error(errMsg(e, "Download failed")); }
  };

  return (
    <Modal open={!!booking} onClose={onClose} title="Your ticket" wide>
      {error && <p className="error">{error}</p>}
      {!src && !error && <div className="skeleton" style={{ height: 280, borderRadius: 12 }} />}
      {src && <img className="ticket-img" src={src} alt={`Ticket ${booking.ticket_code}`} />}
      <div className="modal-actions">
        <button className="btn btn-outline" onClick={onClose}>Close</button>
        <button className="btn" disabled={!src} onClick={save}>Download ticket</button>
      </div>
    </Modal>
  );
}