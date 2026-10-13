import { useEffect, useRef, useState } from "react";
import { checkInTicket, lookupTicket } from "../../api/admin";
import { errMsg, prettyDate, prettyTime } from "../../utils/format";

export default function AdminCheckin() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  // Camera scanning needs Chrome/Edge/Android (BarcodeDetector) and https (localhost also works).
  const canScan = typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia;

  const find = async (value) => {
    const c = String(value ?? code).trim().toUpperCase();
    if (!c) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await lookupTicket(c));
      setCode(c);
    } catch (e) {
      setError(errMsg(e, "Could not look up this ticket"));
    }
    setBusy(false);
  };

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      setResult(await checkInTicket(result.ticket_code));
    } catch (e) {
      setError(errMsg(e, "Could not check in"));
    }
    setBusy(false);
  };

  const reset = () => { setCode(""); setResult(null); setError(""); };

  useEffect(() => {
    if (!scanning) return undefined;
    let stream;
    let timer;
    let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        timer = setInterval(async () => {
          try {
            const found = await detector.detect(video);
            if (found.length) { setScanning(false); find(found[0].rawValue); }
          } catch { /* keep scanning */ }
        }, 400);
      } catch {
        setError("Could not open the camera. Type the ticket code instead.");
        setScanning(false);
      }
    })();
    return () => {
      stopped = true;
      clearInterval(timer);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [scanning]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="panel" style={{ maxWidth: 560 }}>
      <h2>Check-in</h2>
      <p className="muted">Scan the QR on the customer's ticket, or type the ticket code.</p>

      {scanning && <video ref={videoRef} muted playsInline style={{ width: "100%", borderRadius: 12, marginBottom: 12 }} />}

      <div className="coupon-row">
        <input value={code} placeholder="Ticket code" autoCapitalize="characters"
               onChange={(e) => setCode(e.target.value.toUpperCase())}
               onKeyDown={(e) => e.key === "Enter" && find()} />
        <button type="button" className="btn" disabled={busy || !code.trim()} onClick={() => find()}>Find</button>
      </div>
      {canScan && (
        <button type="button" className="btn btn-outline" style={{ marginTop: 10 }} onClick={() => setScanning((s) => !s)}>
          {scanning ? "Stop camera" : "Scan QR with camera"}
        </button>
      )}

      {error && <p className="error">{error}</p>}

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>{result.activity}{result.package ? ` - ${result.package}` : ""}</h3>
          <dl className="summary-list">
            <div><dt>Flyer</dt><dd>{result.customer_name}</dd></div>
            <div><dt>Phone</dt><dd>{result.customer_phone}</dd></div>
            <div><dt>Date</dt><dd>{prettyDate(result.date)}</dd></div>
            <div><dt>Time</dt><dd>{prettyTime(result.time)}</dd></div>
            <div><dt>People</dt><dd>{result.participants}</dd></div>
            <div><dt>Ticket</dt><dd>{result.ticket_code}</dd></div>
          </dl>
          {result.warning && <p className="field-error">{result.warning}</p>}
          {result.valid ? (
            <button className="btn btn-lg btn-block" disabled={busy} onClick={confirm}>
              {busy ? "Checking in…" : `Check in ${result.participants} person(s)`}
            </button>
          ) : (
            <p className="field-error"><strong>Not valid:</strong> {result.problems.join(". ")}</p>
          )}
          {result.checked_in && result.checked_in_at && <p className="field-ok">Checked in.</p>}
          <button className="btn btn-outline btn-block" style={{ marginTop: 10 }} onClick={reset}>Next ticket</button>
        </div>
      )}
    </div>
  );
}