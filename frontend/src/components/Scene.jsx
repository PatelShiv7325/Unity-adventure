import { useId } from "react";

/*
  Scene = an illustrated adventure background (sky, sun, mountains, gliders, ATV).
  If a real photo exists at the `photo` path, it is painted on top of the illustration.
  If the photo file is missing, the illustration simply shows through.
*/

const SKY = {
  hero: ["#0b2a4a", "#2e86c1", "#ffd9a0"],
  winchgliding: ["#1f6fb0", "#6fbfe8", "#e6f6fd"],
  paramotor: ["#3a2a5e", "#e2603a", "#ffd28a"],
  atv: ["#7cc0e6", "#cfe9f5", "#fbe7c4"],
  mountains: ["#12406a", "#2e86c1", "#a9d8ef"],
  sky: ["#cfe8f6", "#eaf5fb", "#ffffff"],
};

const RIDGE = {
  hero: ["#6a93b3", "#37678a", "#173a4f", "#0d2320"],
  winchgliding: ["#8fc0dd", "#4f8fb5", "#2a5f7d", "#173f3a"],
  paramotor: ["#8a5a7e", "#5a3a66", "#33244f", "#1a1530"],
  atv: ["#e0b382", "#c98a4d", "#a4602c", "#6e3d1a"],
  mountains: ["#5f92b5", "#33668c", "#1a405c", "#0f2d3a"],
  sky: ["#d6eaf5", "#c3dfef", "#b1d3e6", "#9fc7de"],
};

const SUN = { hero: [900, 340, 70], paramotor: [300, 330, 80], atv: [1010, 110, 52] };

const MOUNTAINS = [
  "M0 380 L90 330 L170 370 L270 300 L380 365 L470 320 L580 380 L690 310 L790 360 L900 300 L1010 365 L1110 325 L1200 360 V600 H0Z",
  "M0 430 L110 380 L210 425 L330 360 L450 430 L560 395 L680 440 L800 375 L930 430 L1050 385 L1200 430 V600 H0Z",
  "M0 490 L140 445 L260 490 L400 440 L540 495 L700 450 L850 500 L1000 455 L1200 495 V600 H0Z",
  "M0 545 C150 520 260 560 420 540 C580 520 700 570 860 545 C1000 525 1100 555 1200 540 V600 H0Z",
];

const DUNES = [
  "M0 400 C150 340 300 380 450 360 C650 330 800 400 1000 360 C1100 340 1150 350 1200 360 V600 H0Z",
  "M0 450 C200 410 350 470 550 440 C750 410 950 470 1200 430 V600 H0Z",
  "M0 505 C180 470 380 520 600 495 C820 470 1000 520 1200 490 V600 H0Z",
  "M0 555 C220 535 420 575 650 552 C880 530 1040 570 1200 548 V600 H0Z",
];

function Ridges({ kind }) {
  const paths = kind === "atv" ? DUNES : MOUNTAINS;
  const colors = RIDGE[kind] || RIDGE.hero;
  return (
    <>
      {paths.map((d, i) => (
        <path key={i} d={d} fill={colors[i]} />
      ))}
    </>
  );
}

function Clouds({ kind }) {
  return (
    <g fill="#fff" opacity={kind === "sky" ? 0.75 : 0.5}>
      <ellipse cx="180" cy="120" rx="90" ry="16" />
      <ellipse cx="250" cy="106" rx="60" ry="14" />
      <ellipse cx="980" cy="70" rx="100" ry="14" />
      <ellipse cx="1050" cy="86" rx="64" ry="12" />
      <ellipse cx="470" cy="60" rx="70" ry="10" />
    </g>
  );
}

// A paraglider (or a paramotor when motor=true): canopy, lines, pilot.
function Glider({ x, y, s = 1, c1 = "#ff5a1f", c2 = "#ffc21a", motor = false, glide = false }) {
  const id = useId().replace(/:/g, "");
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className={glide ? "glide" : undefined}>
        <defs>
          <linearGradient id={`c${id}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={c1} />
            <stop offset=".2" stopColor={c1} />
            <stop offset=".2" stopColor={c2} />
            <stop offset=".4" stopColor={c2} />
            <stop offset=".4" stopColor={c1} />
            <stop offset=".6" stopColor={c1} />
            <stop offset=".6" stopColor={c2} />
            <stop offset=".8" stopColor={c2} />
            <stop offset=".8" stopColor={c1} />
            <stop offset="1" stopColor={c1} />
          </linearGradient>
        </defs>
        <path
          d="M-105 20 L0 122 M-52 8 L0 122 M0 2 L0 122 M52 8 L0 122 M105 20 L0 122"
          stroke="#0b1b2b" strokeWidth="1.2" opacity=".55" fill="none"
        />
        {motor && (
          <g>
            <circle cx="-24" cy="138" r="24" fill="#0b1b2b" fillOpacity=".08" stroke="#0b1b2b" strokeWidth="2.5" />
            <path d="M-24 114 L-24 162 M-48 138 L0 138" stroke="#0b1b2b" strokeWidth="1.5" opacity=".6" />
            <rect x="-14" y="128" width="10" height="22" rx="3" fill="#0b1b2b" />
          </g>
        )}
        <g fill="#0b1b2b">
          <circle cx="0" cy="116" r="6" />
          <path d="M-7 123 Q0 119 7 123 L9 142 L2 150 L-2 150 L-9 142 Z" />
          <path d="M-5 146 L-17 158 L-11 161 L0 151 Z M5 146 L17 158 L11 161 L0 151 Z" />
        </g>
        <path
          d="M-120 26 C-110 -30 -60 -58 0 -58 C60 -58 110 -30 120 26 C80 8 40 2 0 2 C-40 2 -80 8 -120 26 Z"
          fill={`url(#c${id})`}
        />
        <path d="M-100 0 C-70 -34 -30 -50 0 -50 C30 -50 70 -34 100 0" fill="none" stroke="#fff" strokeWidth="3" opacity=".25" />
        <path d="M-120 26 C-80 8 -40 2 0 2 C40 2 80 8 120 26" fill="none" stroke="#0b1b2b" strokeWidth="1.5" opacity=".3" />
      </g>
    </g>
  );
}

function Atv({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g fill="#f3d9b1" opacity=".6">
        <circle cx="-120" cy="22" r="22" />
        <circle cx="-158" cy="30" r="16" />
        <circle cx="-188" cy="36" r="11" />
      </g>
      <circle cx="-52" cy="30" r="26" fill="#0b1b2b" />
      <circle cx="-52" cy="30" r="10" fill="#6b7a86" />
      <circle cx="58" cy="30" r="26" fill="#0b1b2b" />
      <circle cx="58" cy="30" r="10" fill="#6b7a86" />
      <path d="M-70 8 L-40 -20 L20 -22 L48 -6 L72 4 L72 20 L-70 20 Z" fill="#ff5a1f" />
      <path d="M-30 -22 L18 -24 L18 -14 L-30 -12 Z" fill="#0b1b2b" />
      <path d="M40 -8 L52 -46 L66 -50" stroke="#0b1b2b" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M-12 -46 L14 -46 L22 -24 L-22 -24 Z" fill="#0b1b2b" />
      <circle cx="0" cy="-58" r="12" fill="#0b1b2b" />
      <path d="M8 -42 L50 -47" stroke="#0b1b2b" strokeWidth="5" strokeLinecap="round" />
      <path d="M-4 -60 h14" stroke="#ffc21a" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function Subject({ kind, banner }) {
  if (banner) {
    // Wide, short strips only show the top of the picture, so keep the glider high and small.
    if (kind === "paramotor")
      return <Glider x={800} y={70} s={0.7} c1="#e63b2e" c2="#ffffff" motor glide />;
    if (kind === "atv") return null;
    return (
      <>
        <Glider x={800} y={70} s={0.7} glide />
        <Glider x={1040} y={60} s={0.3} c1="#1f9bd6" c2="#ffffff" />
      </>
    );
  }
  switch (kind) {
    case "hero":
      return (
        <>
          <Glider x={1000} y={150} s={1.05} glide />
          <Glider x={770} y={90} s={0.45} c1="#1f9bd6" c2="#ffffff" motor />
        </>
      );
    case "winchgliding":
      return (
        <>
          <Glider x={600} y={110} s={1.6} glide />
          <Glider x={940} y={110} s={0.5} c1="#1f9bd6" c2="#ffffff" />
        </>
      );
    case "paramotor":
      return (
        <>
          <Glider x={600} y={105} s={1.6} c1="#e63b2e" c2="#ffffff" motor />
          <Glider x={250} y={110} s={0.45} c1="#ffc21a" c2="#ff5a1f" />
        </>
      );
    case "mountains":
      return <Glider x={900} y={150} s={0.55} />;
    case "sky":
      return (
        <>
          <Glider x={1010} y={190} s={0.35} />
          <Glider x={1100} y={140} s={0.25} c1="#1f9bd6" c2="#ffffff" motor />
        </>
      );
    default:
      return null;
  }
}

export function sceneFor(slug, imageUrl) {
  const MAP = {
    "paramotor-ride": { kind: "paramotor", photo: null },
    winchgliding: { kind: "winchgliding", photo: null },
    parasailing: { kind: "winchgliding", photo: null },
    "atv-bike-ride": { kind: "atv", photo: null },
  };
  const m = MAP[slug] || { kind: "mountains", photo: null };
  return { kind: m.kind, photo: imageUrl || m.photo };
}

export default function Scene({ kind = "hero", photo, className = "", banner = false, anchor = "mid", children }) {
  const uid = useId().replace(/:/g, "");
  const [c0, c1, c2] = SKY[kind] || SKY.hero;
  const sun = SUN[kind];
  return (
    <div className={`scene ${className}`}>
      <svg className="scene-art" viewBox="0 0 1200 600" preserveAspectRatio={banner ? (kind === "atv" ? "xMidYMax slice" : "xMidYMin slice") : `x${anchor === "right" ? "Max" : "Mid"}YMid slice`} aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c0} />
            <stop offset=".38" stopColor={c1} />
            <stop offset=".66" stopColor={c2} />
          </linearGradient>
          <radialGradient id={`sun${uid}`}>
            <stop offset="0" stopColor="#fff6d6" stopOpacity=".95" />
            <stop offset="1" stopColor="#fff6d6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1200" height="600" fill={`url(#sky${uid})`} />
        {sun && (
          <>
            <circle cx={sun[0]} cy={sun[1]} r={sun[2] * 3} fill={`url(#sun${uid})`} />
            <circle cx={sun[0]} cy={sun[1]} r={sun[2]} fill="#fff4cf" />
          </>
        )}
        <Clouds kind={kind} />
        <Subject kind={kind} banner={banner} />
        <Ridges kind={kind} />
        {kind === "atv" && <Atv x={banner ? 850 : 600} y={480} s={1.5} />}
      </svg>
      {photo && <div className="scene-photo" style={{ backgroundImage: `url(${photo})` }} />}
      <div className="scene-shade" />
      {children && <div className="scene-content">{children}</div>}
    </div>
  );
}
