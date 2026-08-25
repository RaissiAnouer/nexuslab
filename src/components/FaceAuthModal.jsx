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
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur/appareil.");
      setCameraActive(false);
    }
  }, [stopCamera]);

  // Load models on mount
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        setLoadingModels(true);
        setStatusMessage('Chargement des réseaux neuronaux hors-ligne…');
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
          // Strong match found!
          setScanStatus('matched');
          setStatusMessage(`Identité confirmée : ${enrolledFace.name} (${matchPercent}%)`);
          isScanningRef.current = false;
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

          // Trigger success callback after small animation delay
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
        alert("Aucun visage détecté. Veuillez bien vous placer devant la caméra bien éclairée.");
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="face-header-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/>
                <path d="M2 8V6a2 2 0 0 1 2-2h2"/><path d="M22 8V6a2 2 0 0 0-2-2h-2"/>
                <path d="M2 16v2a2 2 0 0 0 2 2h2"/><path d="M22 16v2a2 2 0 0 1-2 2h-2"/>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 600 }}>
                {mode === 'scan' ? 'Scan Facial Hors-Ligne' : mode === 'enroll' ? 'Enregistrement Biométrique' : 'Gestion du Profil Facial'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#888' }}>
                Traitement IA local sécurisé — 100% Hors-Ligne
              </p>
            </div>
          </div>
          <button className="face-close-btn" onClick={() => { stopCamera(); onClose(); }}>✕</button>
        </div>

        {/* Loading Models State */}
        {loadingModels && (
          <div className="face-loading-body">
            <div className="spinner" style={{ width: '36px', height: '36px' }} />
            <h4 style={{ color: '#fff', marginTop: '16px', marginBottom: '6px' }}>Chargement de l'IA Biométrique</h4>
            <p style={{ color: '#888', fontSize: '0.82rem', textAlign: 'center' }}>
              Chargement des modèles de réseaux neuronaux locaux…
            </p>
          </div>
        )}

        {/* Model Error State */}
        {modelError && (
          <div className="face-loading-body">
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⚠️</div>
            <p style={{ color: '#ff4d4f', fontSize: '0.85rem', textAlign: 'center' }}>{modelError}</p>
            <button className="btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '14px' }}>
              Recharger
            </button>
          </div>
        )}

        {/* Camera Error State */}
        {!loadingModels && !modelError && cameraError && (
          <div className="face-loading-body">
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📷</div>
            <p style={{ color: '#ffb703', fontSize: '0.85rem', textAlign: 'center' }}>{cameraError}</p>
            <button className="btn-primary" onClick={startCamera} style={{ marginTop: '14px' }}>
              Autoriser / Réessayer
            </button>
          </div>
        )}

        {/* MODE: SCAN (Face Verification) */}
        {!loadingModels && !modelError && !cameraError && mode === 'scan' && (
          <div className="face-modal-body">
            {!enrolledFace ? (
              <div className="face-empty-profile">
                <div className="face-empty-icon">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ffb703" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>
                  </svg>
                </div>
                <h4 style={{ color: '#fff', marginBottom: '6px' }}>Aucun profil facial enregistré</h4>
                <p style={{ color: '#888', fontSize: '0.82rem', textAlign: 'center', maxWidth: '280px', marginBottom: '20px' }}>
                  Vous devez enregistrer votre visage une première fois avant de pouvoir vous connecter par reconnaissance faciale.
                </p>
                <button className="btn-primary" onClick={() => setMode('enroll')} style={{ width: '100%' }}>
                  📸 Enregistrer mon visage maintenant
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
                    {scanStatus === 'searching' && '🔍 Détection…'}
                    {scanStatus === 'analyzing' && '⚡ Analyse biométrique…'}
                    {scanStatus === 'matched' && `✓ ${enrolledFace.name} (${similarity}%)`}
                    {scanStatus === 'nomatch' && '✕ Non reconnu'}
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
                    ⚙️ Gérer le profil ({enrolledFace.name})
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

                <p className="face-instruction" style={{ marginTop: '12px' }}>
                  Regardez droit vers la caméra dans un endroit bien éclairé puis appuyez sur Capturer.
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
              <div className="face-enroll-confirm">
                <div className="face-preview-card">
                  {capturedPhoto && (
                    <img src={capturedPhoto} alt="Visage capturé" className="face-preview-img" />
                  )}
                  <div className="face-preview-badge">✓ Empreinte 128-d générée</div>
                </div>

                <div style={{ width: '100%', marginTop: '16px' }}>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '6px' }}>
                    Nom ou Identifiant du Chercheur :
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={enrollName}
                    onChange={(e) => setEnrollName(e.target.value)}
                    placeholder="Ex: Dr. Anouer / Chercheur Lab"
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="face-modal-actions" style={{ marginTop: '20px', width: '100%' }}>
                  <button className="btn-primary" onClick={handleSaveEnrollment} style={{ flex: 1 }}>
                    💾 Sauvegarder dans l'appareil
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
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <h4 style={{ color: '#fff', margin: '0 0 4px 0' }}>{enrolledFace.name}</h4>
                <p style={{ color: '#888', fontSize: '0.78rem', margin: 0 }}>
                  Enregistré le {enrolledFace.enrolledAt ? new Date(enrolledFace.enrolledAt).toLocaleDateString('fr-FR') : 'Récemment'}
                </p>
                <span className="face-active-tag">● Profil Actif</span>
              </div>
            </div>

            <div className="face-modal-actions" style={{ flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => setMode('scan')}>
                ▶ Lancer le Scan Facial
              </button>
              <button className="btn-secondary" style={{ width: '100%' }} onClick={() => { setMode('enroll'); setCapturedDescriptor(null); }}>
                🔄 Remplacer par un nouveau scan
              </button>
              <button className="btn-danger" style={{ width: '100%', background: '#ff4d4f22', color: '#ff4d4f', border: '1px solid #ff4d4f44' }} onClick={handleDeleteEnrollment}>
                🗑 Supprimer ce profil facial
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
