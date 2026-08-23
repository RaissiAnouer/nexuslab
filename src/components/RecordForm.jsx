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
        newErrors[f.name] = 'Champ requis';
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
        <div className="success-screen">
          <div className="success-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <h2>Enregistrement effectué avec succès</h2>
          <p>Votre fiche a été enregistrée dans le {reg?.name}.</p>
          <div className="record-id">{savedRecord.id}</div>
          <div className="success-actions">
            <button className="btn-small" onClick={() => onViewRecord(savedRecord)}>Voir la fiche</button>
            <button className="btn-secondary" onClick={() => { setSavedRecord(null); setCurrentStep(0); setFormData({}); }}>Créer une autre fiche</button>
            <button className="btn-secondary" onClick={onCancel}>Retour au registre</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step Labels ──
  const stepLabels = [...config.steps.map(s => s.title), 'Vérification'];

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

      {/* Toolbar */}
      <div className="reg-toolbar">
        <div className="reg-toolbar-left">
          <button className="back-btn" onClick={onCancel}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            Annuler
          </button>
          <h1>{config.newButtonLabel.replace('+ ', '')}</h1>
        </div>
        <div className="reg-toolbar-right">
          <button
            className="ocr-scan-btn"
            onClick={() => setShowScanner(true)}
            title="Scanner un document pour remplir automatiquement"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
            Scanner
          </button>
        </div>
      </div>

      <div className="form-body">
        {/* Step Indicator */}
        <div className="step-indicator">
          {stepLabels.map((label, i) => (
            <React.Fragment key={i}>
              <div className="step-dot">
                <div className={`step-num ${i === currentStep ? 'active' : i < currentStep ? 'done' : ''}`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={`step-label ${i === currentStep ? 'active' : ''}`}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && <div className="step-line" />}
            </React.Fragment>
          ))}
        </div>

        {/* Review Step */}
        {isReviewStep ? (
          <>
            <h2 className="form-step-title">Récapitulatif &amp; Vérification</h2>
            <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '8px' }}>
              Veuillez vérifier vos informations ci-dessous avant d'enregistrer.
            </p>
            {config.steps.map((step, si) => (
              <div className="review-section" key={si}>
                <h3>{step.title}</h3>
                {step.fields.map(f => (
                  <div className="review-row" key={f.name}>
                    <span className="r-label">{f.label}</span>
                    <span className="r-value">{formData[f.name] || '—'}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="form-actions">
              <button className="btn-secondary" onClick={handlePrev}>← Précédent</button>
              <button className="btn-primary" style={{ padding: '12px 32px' }} onClick={() => handleSave(false)}>Enregistrer la fiche</button>
              <button className="btn-secondary" onClick={() => handleSave(true)}>Enregistrer comme brouillon</button>
            </div>
          </>
        ) : (
          <>
            {/* Form Fields */}
            <h2 className="form-step-title">{config.steps[currentStep].title}</h2>
            <div className="form-fields">
              {config.steps[currentStep].fields.map(field => (
                <div className="input-group" key={field.name}>
                  <label>
                    {field.label}
                    {field.required && <span className="required">*</span>}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      className={`input-field ${errors[field.name] ? 'error' : ''}`}
                      value={formData[field.name] || ''}
                      onChange={e => updateField(field.name, e.target.value)}
                    >
                      <option value="">Sélectionner...</option>
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      className={`input-field ${errors[field.name] ? 'error' : ''}`}
                      placeholder={field.placeholder || ''}
                      value={formData[field.name] || ''}
                      onChange={e => updateField(field.name, e.target.value)}
                    />
                  ) : (
                    <input
                      className={`input-field ${errors[field.name] ? 'error' : ''}`}
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
                    <span style={{ fontSize: '0.72rem', color: '#ff6b6b' }}>{errors[field.name]}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="form-actions">
              {currentStep > 0 && (
                <button className="btn-secondary" onClick={handlePrev}>← Précédent</button>
              )}
              <button className="btn-primary" style={{ padding: '12px 32px' }} onClick={handleNext}>
                {currentStep < totalFormSteps - 1 ? 'Suivant →' : 'Vérifier →'}
              </button>
              <button className="btn-ghost" onClick={onCancel}>Annuler</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
