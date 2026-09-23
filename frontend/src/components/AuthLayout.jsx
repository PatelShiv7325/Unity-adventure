import Scene from "./Scene.jsx";

export default function AuthLayout({ title, children }) {
  return (
    <div className="auth">
      <Scene kind="winchgliding" className="auth-scene">
        <div className="auth-pitch">
          <h2>Your next flight starts here.</h2>
          <p>Book paramotor, winchgliding and ATV rides in a few taps.</p>
        </div>
      </Scene>
      <div className="auth-form">
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  );
}
