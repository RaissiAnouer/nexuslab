import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { BiometricAuth, AndroidBiometryStrength } from '@aparajita/capacitor-biometric-auth';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import FaceAuthModal from './FaceAuthModal';
import { getEnrolledFace } from '../utils/faceRecognition';

export default function AuthScreen({ onBack, onAuthSuccess }) {
  const [status, setStatus] = useState('selecting'); // 'selecting' | 'authenticating' | 'success' | 'failed' | 'not_enrolled'
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [biometricSupport, setBiometricSupport] = useState({ fingerprint: 'checking' });
  const [errorMsg, setErrorMsg] = useState('');
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [enrolledFaceInfo, setEnrolledFaceInfo] = useState(() => getEnrolledFace());

  const isNative = Capacitor.isNativePlatform();

  // Refresh enrolled face info when modal closes
  const handleFaceModalClose = () => {
    setShowFaceModal(false);
    setEnrolledFaceInfo(getEnrolledFace());
  };

  const handleFaceSuccess = (userData) => {
    setShowFaceModal(false);
    setStatus('success');
    localStorage.setItem('nexus_auth_method', 'face');
    localStorage.setItem('nexus_authenticated', 'true');
    setTimeout(() => onAuthSuccess(userData), 600);
  };

  // Helper to open device security/biometric settings
  const openDeviceSettings = async () => {
    try {
      await NativeSettings.open({
        optionAndroid: AndroidSettings.BiometricEnroll || 'biometric_enroll',
        optionIOS: IOSSettings.TouchIdPasscode,
      });
    } catch {
      try {
        await NativeSettings.open({
          optionAndroid: AndroidSettings.Security,
          optionIOS: IOSSettings.TouchIdPasscode,
        });
      } catch {
        alert("Veuillez ouvrir les Paramètres > Sécurité de votre téléphone pour configurer l'empreinte digitale.");
      }
    }
  };

  // Check device biometric capabilities
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const support = { fingerprint: 'unavailable' };

    if (isNative) {
      try {
        const result = await BiometricAuth.checkBiometry({
          androidBiometryStrength: AndroidBiometryStrength.strong,
        });
        if (result.isAvailable) {
          support.fingerprint = 'available';
        } else {
          support.fingerprint = 'available';
        }
      } catch {
        support.fingerprint = 'available';
      }
    } else {
      support.fingerprint = 'simulated';
    }

    setBiometricSupport(support);
  };

  const authenticateFingerprint = async () => {
    setSelectedMethod('fingerprint');
    setStatus('authenticating');
    setErrorMsg('');

    if (isNative) {
      try {
        // Enforce hardware fingerprint and disable schema/PIN fallback
        await BiometricAuth.authenticate({
          reason: 'Vérification par empreinte digitale',
          title: 'NEXUS Lab — Authentification',
          subtitle: 'Posez votre doigt sur le capteur d\'empreinte',
          cancelTitle: 'Annuler',
          allowDeviceCredential: false, // 🛑 Disable screen lock schema/PIN fallback
          androidBiometryStrength: AndroidBiometryStrength.strong,
        });

        // Authentication succeeded
        setStatus('success');
        localStorage.setItem('nexus_auth_method', 'fingerprint');
        localStorage.setItem('nexus_authenticated', 'true');
        setTimeout(() => onAuthSuccess({ name: 'Chercheur Lab', method: 'fingerprint' }), 800);
      } catch (err) {
        const message = err?.message || err?.code || '';
        const msgStr = String(message).toLowerCase();

        if (msgStr.includes('enrolled') || msgStr.includes('notenrolled') || msgStr.includes('not_enrolled')) {
          setStatus('not_enrolled');
          setErrorMsg("Aucune empreinte digitale n'est configurée sur votre téléphone.");
        } else if (msgStr.includes('cancel')) {
          setErrorMsg("L'authentification a été annulée.");
          setStatus('failed');
        } else if (msgStr.includes('lockout')) {
          setErrorMsg('Trop de tentatives infructueuses. Veuillez réessayer plus tard.');
          setStatus('failed');
        } else {
          setErrorMsg("Empreinte non reconnue. Veuillez réessayer.");
          setStatus('failed');
        }
      }
    } else {
      // Browser dev mode simulation
      setTimeout(() => {
        setStatus('success');
        localStorage.setItem('nexus_auth_method', 'fingerprint');
        localStorage.setItem('nexus_authenticated', 'true');
        setTimeout(() => onAuthSuccess({ name: 'Chercheur Lab', method: 'fingerprint' }), 800);
      }, 600);
    }
  };

  const handleRetry = () => {
    setStatus('selecting');
    setSelectedMethod(null);
    setErrorMsg('');
  };

  // ── Authenticating / Result / Not Enrolled States ──
  if (status === 'authenticating' || status === 'success' || status === 'failed' || status === 'not_enrolled') {
    return (
      <div className="auth-screen">
        <div className="bio-gateway">
          {(status === 'failed' || status === 'not_enrolled') && (
            <button className="back-btn" onClick={handleRetry}
              style={{ position: 'absolute', top: '24px', left: '24px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              Retour
            </button>
          )}

          <div className={`bio-ring-lg ${status}`}>
            {status === 'success' ? (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
            ) : status === 'not_enrolled' ? (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffb703" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={status === 'failed' ? '#555' : 'white'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                <path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
              </svg>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            {status === 'authenticating' && (
              <>
                <h2 className="bio-title">Authentification Empreinte</h2>
                <p className="bio-subtitle">Posez votre doigt sur le capteur de l'appareil…</p>
                <div className="spinner" style={{ margin: '16px auto 0' }} />
              </>
            )}
            {status === 'success' && (
              <>
                <h2 className="bio-title">Accès Autorisé</h2>
                <p className="bio-subtitle">Empreinte vérifiée avec succès</p>
              </>
            )}
            {status === 'not_enrolled' && (
              <>
                <h2 className="bio-title">Empreinte non configurée</h2>
                <p className="bio-subtitle" style={{ color: '#ffb703' }}>{errorMsg}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', width: '280px' }}>
                  <button className="btn-primary" style={{ width: '100%' }} onClick={openDeviceSettings}>
                    ⚙️ Configurer l'Empreinte
                  </button>
                  <button className="btn-ghost" onClick={handleRetry}>
                    Retour au choix
                  </button>
                </div>
              </>
            )}
            {status === 'failed' && (
              <>
                <h2 className="bio-title">Échec de l'Empreinte</h2>
                <p className="bio-subtitle">{errorMsg}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', width: '260px' }}>
                  <button className="btn-primary" style={{ width: '100%' }} onClick={authenticateFingerprint}>
                    Réessayer l'empreinte
                  </button>
                  <button className="btn-ghost" onClick={handleRetry}>
                    Choisir une autre méthode
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Method Selection Screen ──
  const isChecking = biometricSupport.fingerprint === 'checking';

  return (
    <div className="auth-screen">
      <div className="bio-gateway">
        <button className="back-btn" onClick={onBack}
          style={{ position: 'absolute', top: '24px', left: '24px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          Retour
        </button>

        {/* Lock icon */}
        <div className="gateway-lock">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h2 className="bio-title">Accès Sécurisé au Laboratoire</h2>
        <p className="bio-subtitle">Authentification biométrique locale & hors-ligne</p>

        {isChecking ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#888', fontSize: '0.85rem', marginTop: '12px' }}>
            <div className="spinner" /> Initialisation du système de sécurité…
          </div>
        ) : (
          <div className="bio-methods">
            {/* 100% Offline AI Face Recognition */}
            <button
              className="bio-method-card active-method"
              onClick={() => setShowFaceModal(true)}
            >
              <div className="method-icon" style={{ background: 'rgba(108, 99, 255, 0.15)', color: '#8b84ff' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/>
                  <path d="M2 8V6a2 2 0 0 1 2-2h2"/><path d="M22 8V6a2 2 0 0 0-2-2h-2"/>
                  <path d="M2 16v2a2 2 0 0 0 2 2h2"/><path d="M22 16v2a2 2 0 0 1-2 2h-2"/>
                </svg>
              </div>
              <div className="method-text">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3>Scan Facial IA (Hors-Ligne)</h3>
                  <span className="badge-offline">100% Hors-Ligne</span>
                </div>
                {enrolledFaceInfo ? (
                  <p style={{ color: '#52c41a' }}>✓ Profil actif : {enrolledFaceInfo.name}</p>
                ) : (
                  <p>Enregistrer votre visage & scanner avec la caméra</p>
                )}
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>

            {/* Hardware Fingerprint */}
            <button
              className={`bio-method-card ${biometricSupport.fingerprint === 'unavailable' ? 'disabled' : ''}`}
              onClick={() => biometricSupport.fingerprint !== 'unavailable' && authenticateFingerprint()}
              disabled={biometricSupport.fingerprint === 'unavailable'}
            >
              <div className="method-icon" style={{ background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                  <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                  <path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                  <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                  <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
                </svg>
              </div>
              <div className="method-text">
                <h3>Capteur d'Empreinte Digitale</h3>
                {biometricSupport.fingerprint === 'unavailable' ? (
                  <p className="method-unavailable">Non configuré sur cet appareil</p>
                ) : (
                  <p>Déverrouillage instantané par capteur physique</p>
                )}
              </div>
              {biometricSupport.fingerprint !== 'unavailable' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
              )}
            </button>
          </div>
        )}

        <p className="bio-footer">
          🔒 Vos empreintes biométriques et faciales restent strictement sur votre appareil.<br />
          Aucune donnée ne transite par Internet.
        </p>
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
