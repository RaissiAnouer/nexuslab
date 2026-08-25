import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadFaceModels,
  getEnrolledFace,
  saveEnrolledFace,
  deleteEnrolledFace,
  detectFaceWithDescriptor,
  computeFaceDistance,
  distanceToSimilarity,
} from '../utils/faceRecognition';

export default function FaceAuthModal({ onClose, onSuccess }) {
  const [enrolledFace, setEnrolledFace] = useState(() => getEnrolledFace());
  const [mode, setMode] = useState(() => (getEnrolledFace() ? 'scan' : 'enroll')); // 'scan' | 'enroll' | 'manage'
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelError, setModelError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Scanning states
  const [scanStatus, setScanStatus] = useState('searching'); // 'searching' | 'analyzing' | 'matched' | 'nomatch'
  const [similarity, setSimilarity] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Initialisation des modèles neuronaux…');

  // Enrollment states
  const [enrollName, setEnrollName] = useState('Chercheur Lab');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState(null);
  const [isProcessingCapture, setIsProcessingCapture] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isScanningRef = useRef(false);
  const scanIntervalRef = useRef(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start camera helper
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError('');
    try {
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(resolve).catch(resolve);
          };
        });
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre appareil.");
      setCameraActive(false);
    }
  }, [stopCamera]);

  // Load models on mount
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        setLoadingModels(true);
        setStatusMessage('Chargement des réseaux neuronaux locaux…');
        await loadFaceModels();
        if (mounted) {
          setLoadingModels(false);
          setStatusMessage('Prêt pour la reconnaissance faciale');
        }
      } catch (err) {
        if (mounted) {
          setModelError("Erreur de chargement des modèles locaux. Veuillez recharger l'application.");
          setLoadingModels(false);
        }
      }
    }
    init();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [stopCamera]);

  // Handle camera start/stop on mode change or model load completion
  useEffect(() => {
    if (!loadingModels && !modelError) {
      if (mode === 'scan' || (mode === 'enroll' && !capturedDescriptor)) {
        startCamera();
      } else {
        stopCamera();
      }
    }
    return () => {
      stopCamera();
    };
  }, [loadingModels, modelError, mode, capturedDescriptor, startCamera, stopCamera]);

  // Live scanning loop when in 'scan' mode and camera is active
  useEffect(() => {
    if (mode !== 'scan' || !cameraActive || !enrolledFace) return;

    let scanCount = 0;
    isScanningRef.current = true;

    const performScan = async () => {
      if (!isScanningRef.current || !videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        return;
      }

      try {
        const detection = await detectFaceWithDescriptor(videoRef.current);

        if (!detection) {
          setScanStatus('searching');
          setStatusMessage('Centrez votre visage dans le cadre…');
          setSimilarity(null);
          return;
        }

        setScanStatus('analyzing');
        const distance = computeFaceDistance(detection.descriptor, enrolledFace.descriptor);
        const matchPercent = distanceToSimilarity(distance);
        setSimilarity(matchPercent);

        if (distance < 0.48) {
          // Match confirmed
          setScanStatus('matched');
          setStatusMessage(`Identité confirmée : ${enrolledFace.name} (${matchPercent}%)`);
          isScanningRef.current = false;
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

          setTimeout(() => {
            stopCamera();
            onSuccess({
              name: enrolledFace.name,
              method: 'face',
              confidence: matchPercent,
            });
          }, 900);
        } else {
          scanCount++;
          if (scanCount > 6) {
            setScanStatus('nomatch');
            setStatusMessage(`Visage non reconnu (${matchPercent}%). Veuillez réessayer.`);
          } else {
            setStatusMessage(`Vérification biométrique… (${matchPercent}%)`);
          }
        }
      } catch (err) {
        console.error('Scan error:', err);
      }
    };

    scanIntervalRef.current = setInterval(performScan, 300);

    return () => {
      isScanningRef.current = false;
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [mode, cameraActive, enrolledFace, stopCamera, onSuccess]);

  // Capture face for enrollment
  const handleCaptureForEnrollment = async () => {
    if (!videoRef.current) return;
    setIsProcessingCapture(true);
    setStatusMessage('Extraction de l\'empreinte faciale…');

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoUrl = canvas.toDataURL('image/jpeg', 0.85);

      const detection = await detectFaceWithDescriptor(video);

      if (!detection) {
        alert("Aucun visage détecté. Veuillez vous placer dans un endroit bien éclairé.");
        setIsProcessingCapture(false);
        return;
      }

      setCapturedPhoto(photoUrl);
      setCapturedDescriptor(detection.descriptor);
      stopCamera();
      setIsProcessingCapture(false);
    } catch (err) {
      console.error('Capture error:', err);
      alert("Erreur lors de l'analyse du visage: " + err.message);
      setIsProcessingCapture(false);
    }
  };

  // Save enrolled face
  const handleSaveEnrollment = () => {
    if (!capturedDescriptor) return;
    const finalName = enrollName.trim() || 'Chercheur Lab';
    saveEnrolledFace(finalName, capturedDescriptor, capturedPhoto);
    const updated = getEnrolledFace();
    setEnrolledFace(updated);
    setCapturedDescriptor(null);
    setCapturedPhoto(null);
    setMode('scan');
  };

  // Delete enrollment
  const handleDeleteEnrollment = () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer le profil facial enregistré ?")) {
      deleteEnrolledFace();
      setEnrolledFace(null);
      setMode('enroll');
      setCapturedDescriptor(null);
      setCapturedPhoto(null);
    }
  };

  return (
    <div className="face-modal-overlay" onClick={(e) => e.target.className === 'face-modal-overlay' && onClose()}>
      <div className="face-modal">
        {/* Header */}
        <div className="face-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="face-header-icon-cyber">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#modalHeaderGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="modalHeaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#6c63ff" />
                  </linearGradient>
                </defs>
                <path d="M9 11h.01"/><path d="M15 11h.01"/>
                <path d="M10 15c.6.4 1.3.6 2 .6s1.4-.2 2-.6"/>
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                <path d="M21 7V5a2 2 0 0 0-2-2h-2"/>
                <path d="M3 17v2a2 2 0 0 0 2 2h2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
              </svg>
            </div>
            <div>
              <h3 className="face-modal-title">
                {mode === 'scan' ? 'Scanner Biométrique IA' : mode === 'enroll' ? 'Enregistrement de Profil' : 'Gestion du Profil'}
              </h3>
              <p className="face-modal-subtitle">
                Moteur Neuronal Local • 100% Hors-Ligne
              </p>
            </div>
          </div>
          <button className="face-close-btn" onClick={() => { stopCamera(); onClose(); }} aria-label="Fermer">✕</button>
        </div>

        {/* Loading Models State: Futuristic Hologram Scan */}
        {loadingModels && (
          <div className="face-loading-body">
            <div className="cyber-loader-wrap">
              <div className="cyber-loader-orbit" />
              <div className="cyber-loader-orbit orbit-reverse" />
              <div className="cyber-loader-face-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11h.01"/><path d="M15 11h.01"/>
                  <path d="M10 15c.6.4 1.3.6 2 .6s1.4-.2 2-.6"/>
                  <path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M20 8V6a2 2 0 0 0-2-2h-2"/>
                  <path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M20 16v2a2 2 0 0 1-2 2h-2"/>
                </svg>
                <div className="cyber-loader-scanline" />
              </div>
            </div>
            <h4 style={{ color: '#fff', marginTop: '20px', marginBottom: '6px', fontSize: '1rem', fontWeight: 700 }}>
              Initialisation du Moteur Neuronal
            </h4>
            <p style={{ color: '#888', fontSize: '0.82rem', textAlign: 'center', maxWidth: '280px' }}>
              Chargement des modèles d'intelligence artificielle locale…
            </p>
          </div>
        )}

        {/* Model Error State */}
        {modelError && (
          <div className="face-loading-body">
            <div className="face-error-icon">⚠️</div>
            <p style={{ color: '#ff6b6b', fontSize: '0.85rem', textAlign: 'center', marginTop: '8px' }}>{modelError}</p>
            <button className="btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '16px' }}>
              Recharger
            </button>
          </div>
        )}

        {/* Camera Error State */}
        {!loadingModels && !modelError && cameraError && (
          <div className="face-loading-body">
            <div className="face-camera-error-icon">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ffb703" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 2 20 20"/>
                <path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </div>
            <h4 style={{ color: '#fff', marginTop: '14px', marginBottom: '4px' }}>Accès Caméra Requis</h4>
            <p style={{ color: '#aaa', fontSize: '0.82rem', textAlign: 'center', maxWidth: '300px' }}>{cameraError}</p>
            <button className="btn-primary" onClick={startCamera} style={{ marginTop: '16px' }}>
              Autoriser &amp; Réessayer
            </button>
          </div>
        )}

        {/* MODE: SCAN (Face Verification) */}
        {!loadingModels && !modelError && !cameraError && mode === 'scan' && (
          <div className="face-modal-body">
            {!enrolledFace ? (
              <div className="face-empty-profile">
                {/* High-Tech Empty Profile Hero Icon */}
                <div className="cyber-empty-profile-icon">
                  <div className="empty-profile-glow" />
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="url(#emptyFaceGrad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                      <linearGradient id="emptyFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00d4ff" />
                        <stop offset="100%" stopColor="#6c63ff" />
                      </linearGradient>
                    </defs>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/>
                    <line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                </div>
                <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
                  Aucun Profil Facial Enregistré
                </h4>
                <p style={{ color: '#888', fontSize: '0.82rem', textAlign: 'center', maxWidth: '300px', marginBottom: '22px', lineHeight: 1.5 }}>
                  Enregistrez votre visage une première fois pour déverrouiller l'accès automatique au laboratoire.
                </p>
                <button className="btn-primary" onClick={() => setMode('enroll')} style={{ width: '100%', maxWidth: '320px' }}>
                  📸 Enregistrer mon visage
                </button>
              </div>
            ) : (
              <>
                <div className="face-viewport-container">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="face-video"
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />

                  {/* Futuristic HUD overlay */}
                  <div className={`face-hud-frame ${scanStatus}`}>
                    <div className="hud-corner hud-top-left" />
                    <div className="hud-corner hud-top-right" />
                    <div className="hud-corner hud-bottom-left" />
                    <div className="hud-corner hud-bottom-right" />
                    <div className="hud-reticle" />
                    <div className="hud-scan-laser" />
                  </div>

                  {/* Status chip */}
                  <div className={`face-status-badge ${scanStatus}`}>
                    {scanStatus === 'searching' && '🔍 Détection en cours…'}
                    {scanStatus === 'analyzing' && '⚡ Analyse biométrique…'}
                    {scanStatus === 'matched' && `✓ ${enrolledFace.name} (${similarity}%)`}
                    {scanStatus === 'nomatch' && '✕ Visage non reconnu'}
                  </div>
                </div>

                <div className="face-info-bar">
                  <p className="face-instruction">{statusMessage}</p>
                  {similarity !== null && (
                    <div className="face-similarity-bar">
                      <div
                        className={`similarity-fill ${similarity > 70 ? 'high' : similarity > 50 ? 'medium' : 'low'}`}
                        style={{ width: `${similarity}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="face-modal-actions">
                  <button
                    className="btn-ghost"
                    style={{ fontSize: '0.82rem', flex: 1 }}
                    onClick={() => { stopCamera(); setMode('manage'); }}
                  >
                    ⚙️ Profil ({enrolledFace.name})
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem', flex: 1 }}
                    onClick={() => { stopCamera(); setMode('enroll'); }}
                  >
                    + Réenregistrer
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* MODE: ENROLL (Face Registration) */}
        {!loadingModels && !modelError && !cameraError && mode === 'enroll' && (
          <div className="face-modal-body">
            {!capturedDescriptor ? (
              <>
                <div className="face-viewport-container">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="face-video"
                  />
                  <div className="face-hud-frame enroll">
                    <div className="hud-corner hud-top-left" />
                    <div className="hud-corner hud-top-right" />
                    <div className="hud-corner hud-bottom-left" />
                    <div className="hud-corner hud-bottom-right" />
                    <div className="hud-reticle" />
                  </div>
                  <div className="face-status-badge searching">
                    Centrez votre visage
                  </div>
                </div>

                <p className="face-instruction" style={{ marginTop: '14px', textAlign: 'center' }}>
                  Positionnez votre visage au centre sous un bon éclairage puis appuyez sur Capturer.
                </p>

                <div className="face-modal-actions">
                  <button
                    className="btn-primary"
                    onClick={handleCaptureForEnrollment}
                    disabled={isProcessingCapture || !cameraActive}
                    style={{ flex: 1 }}
                  >
                    {isProcessingCapture ? 'Traitement IA…' : '📸 Capturer mon visage'}
                  </button>
                  {enrolledFace && (
                    <button className="btn-ghost" onClick={() => setMode('scan')}>
                      Annuler
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="face-enroll-confirm" style={{ width: '100%', maxWidth: '320px' }}>
                <div className="face-preview-card">
                  {capturedPhoto && (
                    <img src={capturedPhoto} alt="Visage capturé" className="face-preview-img" />
                  )}
                  <div className="face-preview-badge">✓ Empreinte 128-d Prête</div>
                </div>

                <div style={{ width: '100%', marginTop: '18px' }}>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Nom ou Identifiant du Chercheur :
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={enrollName}
                    onChange={(e) => setEnrollName(e.target.value)}
                    placeholder="Ex: Dr. Anouer"
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="face-modal-actions" style={{ marginTop: '20px', width: '100%' }}>
                  <button className="btn-primary" onClick={handleSaveEnrollment} style={{ flex: 1 }}>
                    💾 Sauvegarder
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => { setCapturedDescriptor(null); setCapturedPhoto(null); }}
                  >
                    Reprendre
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE: MANAGE (Profile Management) */}
        {!loadingModels && !modelError && mode === 'manage' && enrolledFace && (
          <div className="face-modal-body">
            <div className="face-manage-card">
              {enrolledFace.photo ? (
                <img src={enrolledFace.photo} alt="Profil" className="face-manage-avatar" />
              ) : (
                <div className="face-manage-avatar placeholder">👤</div>
              )}
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 700 }}>{enrolledFace.name}</h4>
                <p style={{ color: '#888', fontSize: '0.78rem', margin: 0 }}>
                  Enregistré le {enrolledFace.enrolledAt ? new Date(enrolledFace.enrolledAt).toLocaleDateString('fr-FR') : 'Récemment'}
                </p>
                <span className="face-active-tag">● Profil Actif</span>
              </div>
            </div>

            <div className="face-modal-actions" style={{ flexDirection: 'column', gap: '10px', marginTop: '20px', width: '100%', maxWidth: '320px' }}>
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => setMode('scan')}>
                ▶ Lancer le Scan Facial
              </button>
              <button className="btn-secondary" style={{ width: '100%' }} onClick={() => { setMode('enroll'); setCapturedDescriptor(null); }}>
                🔄 Remplacer par un nouveau scan
              </button>
              <button className="btn-danger" style={{ width: '100%', background: '#ff4d4f22', color: '#ff4d4f', border: '1px solid #ff4d4f44', padding: '10px', borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: 'pointer' }} onClick={handleDeleteEnrollment}>
                🗑 Supprimer ce profil facial
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
