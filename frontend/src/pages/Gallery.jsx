import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Scene from "../components/Scene.jsx";

/* ------------------------------------------------------------------
   HOW THIS PAGE FINDS YOUR MEDIA (no code changes needed to add files)

   PHOTOS  -> put images in   frontend/src/assets/gallery/
              Optional: make sub-folders. Each sub-folder becomes a filter
              button, e.g.  gallery/paramotor/   gallery/parasailing/
   VIDEOS  -> put videos in   frontend/src/assets/gallery-videos/

   Just save the files and the page updates by itself.
------------------------------------------------------------------- */

const photoModules = import.meta.glob(
  "../assets/gallery/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}",
  { eager: true, query: "?url", import: "default" }
);

const videoModules = import.meta.glob(
  "../assets/gallery-videos/*.{mp4,webm,mov,MP4,WEBM,MOV}",
  { eager: true, query: "?url", import: "default" }
);

const byPath = ([a], [b]) => a.localeCompare(b, undefined, { numeric: true });

const titleCase = (s) =>
  s
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const PHOTOS = Object.entries(photoModules)
  .sort(byPath)
  .map(([path, src]) => {
    const rel = path.split("/assets/gallery/")[1] || "";
    const parts = rel.split("/");
    return {
      id: path,
      src,
      category: parts.length > 1 ? titleCase(parts[0]) : "Highlights",
    };
  });

const VIDEOS = Object.entries(videoModules)
  .sort(byPath)
  .map(([path, src], i) => {
    const file = path.split("/").pop().replace(/\.[^.]+$/, "");
    const camera = /^(img|dsc|dscn|pxl|mvimg|vid|wa|whatsapp|screenshot|video|\d)/i.test(file);
    return { id: path, src, title: camera ? `Flight video ${i + 1}` : titleCase(file) };
  });

const CATEGORIES = ["All", ...Array.from(new Set(PHOTOS.map((p) => p.category)))];

/* ---------- small helpers ---------- */

// Adds `visible = true` once the element scrolls into view (for the fade-up effect).
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

const Icon = {
  close: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  ),
  prev: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  next: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5l7 7-7 7" />
    </svg>
  ),
  zoom: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M8 5.5v13a1 1 0 001.5.86l10.5-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" />
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <rect x="6" y="5" width="4.2" height="14" rx="1.2" />
      <rect x="13.8" y="5" width="4.2" height="14" rx="1.2" />
    </svg>
  ),
  expand: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  ),
  shrink: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M3 17l5-5 4 4 3-3 6 6" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M10 9.5v5l4.5-2.5z" />
    </svg>
  ),
};

/* ---------- photo tile ---------- */

function PhotoTile({ photo, index, onOpen }) {
  const [ref, visible] = useReveal();
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  // handles images that were already cached before React attached onLoad
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      className={`g-item${visible ? " in" : ""}${loaded ? " loaded" : ""}`}
      style={{ "--d": `${(index % 6) * 70}ms` }}
      onClick={() => onOpen(index)}
      aria-label={`Open photo ${index + 1}, ${photo.category}`}
    >
      <img
        ref={imgRef}
        src={photo.src}
        alt={`${photo.category} - Unity Adventure Sports`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
      <span className="g-cap">
        <span>{photo.category}</span>
        <span className="g-zoom">{Icon.zoom}</span>
      </span>
    </button>
  );
}

/* ---------- video card ---------- */

function VideoCard({ video, index }) {
  const [ref, visible] = useReveal();
  return (
    <figure
      ref={ref}
      className={`g-video${visible ? " in" : ""}`}
      style={{ "--d": `${(index % 4) * 90}ms` }}
    >
      <video
        src={`${video.src}#t=0.5`}
        controls
        playsInline
        preload="metadata"
        aria-label={video.title}
      />
      <figcaption>{video.title}</figcaption>
    </figure>
  );
}

/* ---------- animated slideshow viewer ---------- */

const SLIDE_MS = 5000; // time each photo stays on screen in Play mode

function Lightbox({ items, startIndex, autoplay, onClose }) {
  const total = items.length;
  const [cur, setCur] = useState(startIndex);
  const [prev, setPrev] = useState(null); // outgoing slide (kept briefly so it can animate away)
  const [dir, setDir] = useState(1); // 1 = moving forward, -1 = moving back
  const [playing, setPlaying] = useState(autoplay);
  const [isFs, setIsFs] = useState(false);

  const curRef = useRef(startIndex);
  const rootRef = useRef(null);
  const stripRef = useRef(null);
  const touchX = useRef(null);
  const canFs = typeof document !== "undefined" && !!document.fullscreenEnabled;

  const go = useCallback(
    (to, d) => {
      const next = ((to % total) + total) % total;
      if (next === curRef.current) return;
      setPrev(curRef.current);
      setDir(d);
      curRef.current = next;
      setCur(next);
    },
    [total]
  );
  const step = useCallback((d) => go(curRef.current + d, d), [go]);

  const toggleFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else rootRef.current?.requestFullscreen?.();
  }, []);

  // remove the outgoing slide once its exit animation has finished
  useEffect(() => {
    if (prev === null) return;
    const t = setTimeout(() => setPrev(null), 950);
    return () => clearTimeout(t);
  }, [prev]);

  // auto-advance while playing (restarts after every manual change)
  useEffect(() => {
    if (!playing || total < 2) return;
    const t = setTimeout(() => step(1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [playing, cur, step, total]);

  // keyboard: arrows, space = play/pause, F = fullscreen, Esc = close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "f" || e.key === "F") toggleFs();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (document.fullscreenElement) document.exitFullscreen?.();
    };
  }, [onClose, step, toggleFs]);

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // preload the photos around the current one so changes feel instant
  useEffect(() => {
    [1, 2, -1].forEach((d) => {
      const n = items[(cur + d + total) % total];
      if (n) {
        const img = new Image();
        img.src = n.src;
      }
    });
  }, [cur, items, total]);

  // keep the active thumbnail centred in the filmstrip
  useEffect(() => {
    const strip = stripRef.current;
    const el = strip && strip.children[cur];
    if (!strip || !el) return;
    strip.scrollTo({
      left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2,
      behavior: "smooth",
    });
  }, [cur]);

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  };

  const item = items[cur];
  if (!item) return null;

  const layers =
    prev !== null
      ? [
          { i: prev, role: "out" },
          { i: cur, role: "in" },
        ]
      : [{ i: cur, role: "in" }];
  const way = dir > 0 ? "next" : "prev";
  const pad = (n) => String(n).padStart(2, "0");

  // Render on <body> (a "portal") so the slideshow sits above the sticky header
  // instead of being trapped inside <main>'s stacking layer.
  return createPortal(
    <div
      ref={rootRef}
      className="ss"
      role="dialog"
      aria-modal="true"
      aria-label="Photo slideshow"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* blurred, colour-matched backdrop that cross-fades with every photo */}
      <div className="ss-bgs" aria-hidden="true">
        {layers.map(({ i, role }) => (
          <div
            key={items[i].id}
            className={`ss-bg ss-bg-${role}`}
            style={{ backgroundImage: `url("${items[i].src}")` }}
          />
        ))}
      </div>

      <div className="ss-top">
        <div className="ss-brand">
          <span className="ss-brand-dot" />
          <span className="ss-brand-name">Unity Adventure Sports</span>
          <span className="ss-brand-cat">{item.category}</span>
        </div>
        <div className="ss-actions">
          {total > 1 && (
            <button
              type="button"
              className={`ss-btn ss-btn-play${playing ? " on" : ""}`}
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause slideshow" : "Play slideshow"}
              title={playing ? "Pause (Space)" : "Play (Space)"}
            >
              {playing ? Icon.pause : Icon.play}
              <span className="ss-btn-text">{playing ? "Pause" : "Play"}</span>
            </button>
          )}
          {canFs && (
            <button
              type="button"
              className="ss-btn ss-btn-round"
              onClick={toggleFs}
              aria-label={isFs ? "Exit full screen" : "Full screen"}
              title="Full screen (F)"
            >
              {isFs ? Icon.shrink : Icon.expand}
            </button>
          )}
          <button type="button" className="ss-btn ss-btn-round" onClick={onClose} aria-label="Close" title="Close (Esc)">
            {Icon.close}
          </button>
        </div>
      </div>

      <div
        className="ss-stage"
        onClick={(e) => {
          if (e.target === e.currentTarget || e.target.classList.contains("ss-slide")) onClose();
        }}
      >
        {layers.map(({ i, role }) => (
          <div key={items[i].id} className={`ss-slide ss-${role}-${way}`}>
            <img
              className="ss-img"
              src={items[i].src}
              alt={`${items[i].category} - Unity Adventure Sports`}
              draggable={false}
            />
          </div>
        ))}

        {total > 1 && (
          <>
            <button type="button" className="ss-nav ss-nav-prev" onClick={() => step(-1)} aria-label="Previous photo">
              {Icon.prev}
            </button>
            <button type="button" className="ss-nav ss-nav-next" onClick={() => step(1)} aria-label="Next photo">
              {Icon.next}
            </button>
          </>
        )}
      </div>

      <div className="ss-bottom">
        <div className="ss-count" aria-live="polite">
          <b>{pad(cur + 1)}</b>
          <span> / {pad(total)}</span>
        </div>

        <div className="ss-progress" aria-hidden="true">
          <span
            key={cur}
            className={playing ? "run" : ""}
            style={{ animationDuration: `${SLIDE_MS}ms` }}
          />
        </div>

        {total > 1 && (
          <div className="ss-strip" ref={stripRef}>
            {items.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`ss-thumb${i === cur ? " active" : ""}`}
                onClick={() => go(i, i > curRef.current ? 1 : -1)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === cur}
              >
                <img src={p.src} alt="" loading="lazy" decoding="async" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ---------- page ---------- */

export default function Gallery() {
  const [active, setActive] = useState("All");
  const [open, setOpen] = useState(null); // { index, autoplay } or null

  const shown = useMemo(
    () => (active === "All" ? PHOTOS : PHOTOS.filter((p) => p.category === active)),
    [active]
  );

  const countFor = (cat) =>
    cat === "All" ? PHOTOS.length : PHOTOS.filter((p) => p.category === cat).length;

  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      <Scene kind="sky" className="banner" banner>
        <div className="banner-inner">
          <h1>Gallery</h1>
          <p>Photos and videos from our flights over the Khambhat coast.</p>
        </div>
      </Scene>

      <section className="section">
        <div className="g-head">
          <h2>Photos</h2>
          {PHOTOS.length > 0 && (
            <div className="g-head-right">
              <span className="g-count">
                {shown.length} {shown.length === 1 ? "photo" : "photos"}
              </span>
              {shown.length > 1 && (
                <button
                  type="button"
                  className="g-play"
                  onClick={() => setOpen({ index: 0, autoplay: true })}
                >
                  {Icon.play}
                  Play slideshow
                </button>
              )}
            </div>
          )}
        </div>

        {PHOTOS.length === 0 ? (
          <div className="g-empty">
            {Icon.image}
            <h3>Photos coming soon</h3>
            <p>We are getting our best flight moments ready. Please check back shortly.</p>
          </div>
        ) : (
          <>
            {CATEGORIES.length > 2 && (
              <div className="g-filters" role="tablist" aria-label="Filter photos">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active === cat}
                    className={`g-chip${active === cat ? " active" : ""}`}
                    onClick={() => {
                      setActive(cat);
                      setOpen(null);
                    }}
                  >
                    {cat}
                    <small>{countFor(cat)}</small>
                  </button>
                ))}
              </div>
            )}

            {/* key= remounts the grid so the reveal animation replays on every filter change */}
            <div className="g-grid" key={active}>
              {shown.map((photo, i) => (
                <PhotoTile
                  key={photo.id}
                  photo={photo}
                  index={i}
                  onOpen={(idx) => setOpen({ index: idx, autoplay: false })}
                />
              ))}
            </div>
          </>
        )}

        <div className="g-head g-head-videos">
          <h2>Videos</h2>
          {VIDEOS.length > 0 && (
            <span className="g-count">
              {VIDEOS.length} {VIDEOS.length === 1 ? "video" : "videos"}
            </span>
          )}
        </div>

        {VIDEOS.length === 0 ? (
          <div className="g-empty">
            {Icon.video}
            <h3>Videos coming soon</h3>
            <p>Watch this space for flight highlights from our sessions.</p>
          </div>
        ) : (
          <div className="g-grid g-grid-video">
            {VIDEOS.map((v, i) => (
              <VideoCard key={v.id} video={v} index={i} />
            ))}
          </div>
        )}
      </section>

      {open !== null && (
        <Lightbox
          key={`${active}-${open.autoplay}`}
          items={shown}
          startIndex={open.index}
          autoplay={open.autoplay}
          onClose={close}
        />
      )}
    </>
  );
}