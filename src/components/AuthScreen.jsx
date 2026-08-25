import React, { useState } from 'react';
import FaceAuthModal from './FaceAuthModal';
import { getEnrolledFace } from '../utils/faceRecognition';

export default function AuthScreen({ onBack, onAuthSuccess }) {
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [enrolledFaceInfo, setEnrolledFaceInfo] = useState(() => getEnrolledFace());

  const handleFaceModalClose = () => {
    setShowFaceModal(false);
    setEnrolledFaceInfo(getEnrolledFace());
  };

  const handleFaceSuccess = (userData) => {
    setShowFaceModal(false);
    localStorage.setItem('nexus_auth_method', 'face');
    localStorage.setItem('nexus_authenticated', 'true');
    onAuthSuccess(userData);
  };

  return (
    <div className="auth-screen">
      <div className="bio-gateway">
        <button
          className="back-btn auth-back-btn"
          onClick={onBack}
          aria-label="Retour"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          Retour
        </button>

        {/* High-Tech Biometric Cyber Shield Icon */}
        <div className="cyber-face-gateway-hero">
          <div className="cyber-pulse-ring ring-3" />
          <div className="cyber-pulse-ring ring-2" />
          <div className="cyber-pulse-ring ring-1" />
          
          <div className="cyber-face-icon-core">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="url(#cyberGrad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="50%" stopColor="#6c63ff" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              {/* Futuristic Face Contour */}
              <path d="M9 10h.01"/><path d="M15 10h.01"/>
              <path d="M9.5 15a3.5 3.5 0 0 0 5 0"/>
              <path d="M12 2a10 10 0 0 0-8 6c-.3.7-.5 1.5-.6 2.3A10 10 0 0 0 12 22a10 10 0 0 0 8.6-11.7c-.1-.8-.3-1.6-.6-2.3A10 10 0 0 0 12 2z"/>
              {/* Scanning Crosshairs */}
              <path d="M2 12h3"/><path d="M19 12h3"/>
              <path d="M12 2v3"/><path d="M12 19v3"/>
            </svg>
            <div className="cyber-laser-beam" />
          </div>
        </div>

        <div className="auth-header-text">
          <span className="auth-badge-tag">SÉCURITÉ BIOMÉTRIQUE</span>
          <h2 className="bio-title">Accès Laboratoire NEXUS</h2>
          <p className="bio-subtitle">
            Authentification faciale neuronale 100% hors-ligne &amp; sécurisée sur l'appareil.
          </p>
        </div>

        <div className="bio-methods" style={{ width: '100%' }}>
          {/* Main Facial Recognition Card */}
          <button
            className="bio-method-card main-face-card"
            onClick={() => setShowFaceModal(true)}
          >
            <div className="method-icon-wrap">
              <div className="method-icon face-neon-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11h.01"/><path d="M15 11h.01"/>
                  <path d="M10 15c.6.4 1.3.6 2 .6s1.4-.2 2-.6"/>
                  <path d="M4 8V6a2 2 0 0 1 2-2h2"/>
                  <path d="M20 8V6a2 2 0 0 0-2-2h-2"/>
                  <path d="M4 16v2a2 2 0 0 0 2 2h2"/>
                  <path d="M20 16v2a2 2 0 0 1-2 2h-2"/>
                </svg>
              </div>
            </div>

            <div className="method-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>Reconnaissance Faciale</h3>
                <span className="badge-offline">100% HORS-LIGNE</span>
              </div>
              {enrolledFaceInfo ? (
                <p className="status-enrolled-text">
                  <span className="dot-pulse" />
                  Profil actif : <strong>{enrolledFaceInfo.name}</strong>
                </p>
              ) : (
                <p className="status-not-enrolled-text">
                  Touchez pour enregistrer ou scanner votre visage
                </p>
              )}
            </div>

            <div className="method-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </button>
        </div>

        <div className="bio-footer-card">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Traitement biométrique local. Zéro transfert de données.</span>
        </div>
      </div>

      {/* Offline Face Recognition Modal */}
      {showFaceModal && (
        <FaceAuthModal
          onClose={handleFaceModalClose}
          onSuccess={handleFaceSuccess}
        />
      )}
    </div>
  );
}
