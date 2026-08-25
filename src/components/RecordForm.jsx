import React, { useState } from 'react';
import { registers, formConfigs } from '../data/registersData';
import OcrScanner from './OcrScanner';

export default function RecordForm({ registerId, onCancel, onSaveRecord, onViewRecord }) {
  const reg = registers.find(r => r.id === registerId);
  const config = formConfigs[registerId];

  const totalFormSteps = config.steps.length;
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [savedRecord, setSavedRecord] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const isReviewStep = currentStep === totalFormSteps;

  const updateField = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  // Get ALL fields across ALL steps for full-form scanning
  const allFields = config.steps.flatMap(s => s.fields);

  const handleOcrExtracted = (mapped) => {
    setFormData(prev => {
      const updated = { ...prev };
      Object.entries(mapped).forEach(([key, value]) => {
        if (value && value.trim()) {
          updated[key] = value.trim();
        }
      });
      return updated;
    });
  };

  const validateStep = () => {
    const step = config.steps[currentStep];
    const newErrors = {};
    step.fields.forEach(f => {
      if (f.required && !formData[f.name]?.toString().trim()) {
        newErrors[f.name] = 'Champ obligatoire';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep < totalFormSteps) {
      if (!validateStep()) return;
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSave = (isDraft) => {
    const prefix = registerId.toUpperCase().slice(0, 3);
    const num = String(Math.floor(Math.random() * 9000) + 1000);
    const id = `${prefix}-2026-${num}`;
    const todayFormatted = new Date().toLocaleDateString('fr-FR');

    const newRec = {
      id,
      ...formData,
      date: formData.date || todayFormatted,
      status: isDraft ? 'Brouillon' : 'Finalisé',
      createdAt: new Date().toISOString()
    };

    onSaveRecord(registerId, newRec);
    setSavedRecord(newRec);
  };

  // ── Success Screen ──
  if (savedRecord) {
    return (
      <div className="form-screen">
        <div className="form-screen-inner">
          <div className="success-screen">
            <div className="success-icon-cyber">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#52c41a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>Fiche Créée Avec Succès</h2>
            <p>L'enregistrement a été intégré au registre <strong>{reg?.name}</strong>.</p>
            <div className="record-id-badge">{savedRecord.id}</div>
            <div className="success-actions-sym">
              <button className="btn-primary" onClick={() => onViewRecord(savedRecord)}>
                👁️ Voir la fiche
              </button>
              <button className="btn-secondary" onClick={() => { setSavedRecord(null); setCurrentStep(0); setFormData({}); }}>
                + Nouvelle fiche
              </button>
              <button className="btn-ghost" onClick={onCancel}>
                Retour au registre
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step Labels ──
  const stepLabels = [...config.steps.map(s => s.title), 'Vérification & Enregistrement'];

  return (
    <div className="form-screen">
      {/* OCR Scanner Modal */}
      {showScanner && (
        <OcrScanner
          fields={allFields}
          onFieldsExtracted={handleOcrExtracted}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Symmetrical Top Bar */}
      <div className="form-top-bar">
        <button className="back-btn form-nav-btn" onClick={onCancel} title="Annuler">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          <span>Annuler</span>
        </button>

        <div className="form-title-wrap">
          <span className="form-reg-tag">{reg?.name}</span>
          <h1 className="form-main-heading">{config.newButtonLabel.replace('+ ', '')}</h1>
        </div>

        <button
          className="ocr-scan-btn form-scan-action"
          onClick={() => setShowScanner(true)}
          title="Scanner un document papier"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
            <circle cx="12" cy="13" r="3"/>
          </svg>
          <span>Scanner</span>
        </button>
      </div>

      {/* Symmetrical Centered Form Body */}
      <div className="form-body-wrapper">
        <div className="form-card-container">
          {/* Responsive Step Progress Bar */}
          <div className="step-indicator-sym">
            <div className="step-progress-track">
              {stepLabels.map((_, i) => (
                <React.Fragment key={i}>
                  <div
                    className={`step-node ${i === currentStep ? 'active' : i < currentStep ? 'done' : ''}`}
                    title={stepLabels[i]}
                  >
                    {i < currentStep ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`step-connector ${i < currentStep ? 'filled' : ''}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="step-header-info">
              <span className="step-count-pill">
                Étape {currentStep + 1} / {stepLabels.length}
              </span>
              <h2 className="step-active-title">{stepLabels[currentStep]}</h2>
            </div>
          </div>

          {/* Form Content Area */}
          {isReviewStep ? (
            <div className="form-content-area">
              <p className="form-intro-note">
                Vérifiez les données saisies ci-dessous avant de valider l'enregistrement officiel.
              </p>
              
              <div className="review-list">
                {config.steps.map((step, si) => (
                  <div className="review-block" key={si}>
                    <h3 className="review-block-title">{step.title}</h3>
                    <div className="review-rows-grid">
                      {step.fields.map(f => (
                        <div className="review-item" key={f.name}>
                          <span className="r-label">{f.label}</span>
                          <span className="r-value">{formData[f.name] || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-actions-sym">
                <button className="btn-secondary" onClick={handlePrev}>
                  ← Précédent
                </button>
                <button className="btn-primary form-submit-btn" onClick={() => handleSave(false)}>
                  💾 Enregistrer la fiche
                </button>
                <button className="btn-ghost" onClick={() => handleSave(true)}>
                  Sauvegarder brouillon
                </button>
              </div>
            </div>
          ) : (
            <div className="form-content-area">
              <div className="form-fields-sym">
                {config.steps[currentStep].fields.map(field => (
                  <div className="input-group-sym" key={field.name}>
                    <label className="input-label-sym">
                      <span>{field.label}</span>
                      {field.required && <span className="required-star">*</span>}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        className={`input-field-sym ${errors[field.name] ? 'has-error' : ''}`}
                        value={formData[field.name] || ''}
                        onChange={e => updateField(field.name, e.target.value)}
                      >
                        <option value="">Sélectionner une option…</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        className={`input-field-sym textarea-sym ${errors[field.name] ? 'has-error' : ''}`}
                        placeholder={field.placeholder || 'Saisissez vos observations…'}
                        value={formData[field.name] || ''}
                        onChange={e => updateField(field.name, e.target.value)}
                        rows={4}
                      />
                    ) : (
                      <input
                        className={`input-field-sym ${errors[field.name] ? 'has-error' : ''}`}
                        type={field.type}
                        placeholder={field.placeholder || ''}
                        value={formData[field.name] || ''}
                        onChange={e => updateField(field.name, e.target.value)}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                      />
                    )}

                    {errors[field.name] && (
                      <span className="field-error-msg">{errors[field.name]}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-actions-sym">
                {currentStep > 0 && (
                  <button className="btn-secondary" onClick={handlePrev}>
                    ← Précédent
                  </button>
                )}
                <button className="btn-primary form-next-btn" onClick={handleNext}>
                  {currentStep < totalFormSteps - 1 ? 'Étape suivante →' : 'Vérifier la fiche →'}
                </button>
                <button className="btn-ghost" onClick={onCancel}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
