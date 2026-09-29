import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/* ---------- full-screen viewer ---------- */

function Lightbox({ items, index, onClose, onNav }) {
  const touchX = useRef(null);
  const item = items[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNav(1);
      else if (e.key === "ArrowLeft") onNav(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onNav]);

  // preload the neighbouring photos so next/prev feels instant
  useEffect(() => {
    [1, -1].forEach((d) => {
      const n = items[(index + d + items.length) % items.length];
      if (n) {
        const img = new Image();
        img.src = n.src;
      }
    });
  }, [index, items]);

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) onNav(dx < 0 ? 1 : -1);
  };

  if (!item) return null;

  return (
    <div
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button type="button" className="lb-btn lb-close" onClick={onClose} aria-label="Close">
        {Icon.close}
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            className="lb-btn lb-prev"
            onClick={(e) => {
              e.stopPropagation();
              onNav(-1);
            }}
            aria-label="Previous photo"
          >
            {Icon.prev}
          </button>
          <button
            type="button"
            className="lb-btn lb-next"
            onClick={(e) => {
              e.stopPropagation();
              onNav(1);
            }}
            aria-label="Next photo"
          >
            {Icon.next}
          </button>
        </>
      )}

      <img
        key={item.id}
        className="lb-img"
        src={item.src}
        alt={`${item.category} - Unity Adventure Sports`}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      <div className="lb-bar" onClick={(e) => e.stopPropagation()}>
        <span>{item.category}</span>
        <span>
          {index + 1} / {items.length}
        </span>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function Gallery() {
  const [active, setActive] = useState("All");
  const [open, setOpen] = useState(null); // index inside `shown`, or null

  const shown = useMemo(
    () => (active === "All" ? PHOTOS : PHOTOS.filter((p) => p.category === active)),
    [active]
  );

  const countFor = (cat) =>
    cat === "All" ? PHOTOS.length : PHOTOS.filter((p) => p.category === cat).length;

  const close = useCallback(() => setOpen(null), []);
  const nav = useCallback(
    (dir) => setOpen((i) => (i === null ? i : (i + dir + shown.length) % shown.length)),
    [shown.length]
  );

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
            <span className="g-count">
              {shown.length} {shown.length === 1 ? "photo" : "photos"}
            </span>
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
                <PhotoTile key={photo.id} photo={photo} index={i} onOpen={setOpen} />
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

      {open !== null && <Lightbox items={shown} index={open} onClose={close} onNav={nav} />}
    </>
  );
}