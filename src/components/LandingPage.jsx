import React from 'react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="landing">
      <img src="/iot-bg.png" alt="" className="landing-bg" draggable={false} />
      <div className="landing-gradient" />
      <div className="landing-content">
        <span className="landing-tagline">Gestion de Laboratoire</span>
        <h1 className="landing-title">NEXUS</h1>
        <p className="landing-subtitle">
          Registres, comptes rendus et formulaires numériques de laboratoire — tout en un seul endroit.
        </p>
        <button id="get-started-btn" className="btn-primary" onClick={onGetStarted}>
          Commencer
        </button>
      </div>
    </div>
  );
}
