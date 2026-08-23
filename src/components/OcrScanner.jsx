import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

/**
 * OCR Scanner component for auto-filling form fields.
 * Opens camera/file picker, runs Tesseract OCR, and maps extracted text to form fields.
 */
export default function OcrScanner({ fields, onFieldsExtracted, onClose }) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [mappedFields, setMappedFields] = useState({});
  const [step, setStep] = useState('pick'); // 'pick' | 'scanning' | 'results'
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      runOcr(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const runOcr = async (imageData) => {
    setScanning(true);
    setStep('scanning');
    setProgress(0);

    try {
      const result = await Tesseract.recognize(imageData, 'fra+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const text = result.data.text;
      setExtractedText(text);

      // Map extracted text to form fields
      const mapped = mapTextToFields(text, fields);
      setMappedFields(mapped);
      setStep('results');
    } catch (err) {
      console.error('OCR error:', err);
      setExtractedText('Erreur lors de la lecture. Veuillez réessayer.');
      setStep('results');
    } finally {
      setScanning(false);
    }
  };

  /**
   * Try to match OCR text to form fields by looking for label patterns.
   * Searches for "Label : value" or "Label value" patterns.
   */
  const mapTextToFields = (text, fields) => {
    const mapped = {};
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (const field of fields) {
      // Skip date/time/select fields — harder to auto-fill reliably
      if (field.type === 'date' || field.type === 'time') continue;

      const label = field.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      for (const line of lines) {
        const normalizedLine = line.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Look for "label : value" or "label: value" pattern
        if (normalizedLine.includes(label) || normalizedLine.includes(label.split('/')[0].trim())) {
          // Try to extract value after colon or after the label
          const colonIdx = line.indexOf(':');
          if (colonIdx !== -1 && colonIdx < line.length - 1) {
            const value = line.substring(colonIdx + 1).trim();
            if (value) {
              mapped[field.name] = value;
              break;
            }
          }
        }
      }
    }

    // If no label matching worked, try to fill fields sequentially with found values
    if (Object.keys(mapped).length === 0 && lines.length > 0) {
      const textFields = fields.filter(f => f.type === 'text' || f.type === 'textarea' || f.type === 'number');
      // Extract potential values (lines that look like data, not headers)
      const values = lines.filter(l => l.length > 1 && l.length < 100);
      
      textFields.forEach((field, i) => {
        if (values[i]) {
          mapped[field.name] = values[i];
        }
      });
    }

    return mapped;
  };

  const handleApply = () => {
    onFieldsExtracted(mappedFields);
    onClose();
  };

  const updateMapped = (fieldName, value) => {
    setMappedFields(prev => ({ ...prev, [fieldName]: value }));
  };

  return (
    <div className="ocr-overlay" onClick={(e) => e.target.className === 'ocr-overlay' && onClose()}>
      <div className="ocr-modal">
        {/* Header */}
        <div className="ocr-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Scanner OCR</h3>
          </div>
          <button className="ocr-close" onClick={onClose}>✕</button>
        </div>

        {/* Pick step */}
        {step === 'pick' && (
          <div className="ocr-body">
            <p style={{ color: '#aaa', fontSize: '0.85rem', textAlign: 'center', marginBottom: '20px' }}>
              Prenez une photo ou importez une image du formulaire papier pour remplir automatiquement les champs.
            </p>
            <div className="ocr-pick-buttons">
              <button
                className="ocr-pick-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
                <span>Prendre une photo</span>
              </button>
              <button
                className="ocr-pick-btn"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = handleFileSelect;
                  input.click();
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span>Importer une image</span>
              </button>
            </div>
            {/* Hidden camera input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Scanning step */}
        {step === 'scanning' && (
          <div className="ocr-body" style={{ textAlign: 'center' }}>
            {preview && (
              <img src={preview} alt="Aperçu" className="ocr-preview" />
            )}
            <div className="ocr-progress-wrap">
              <div className="ocr-progress-bar">
                <div className="ocr-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p style={{ color: '#aaa', fontSize: '0.82rem', marginTop: '10px' }}>
                Lecture en cours… {progress}%
              </p>
            </div>
          </div>
        )}

        {/* Results step */}
        {step === 'results' && (
          <div className="ocr-body">
            {preview && (
              <img src={preview} alt="Aperçu" className="ocr-preview" style={{ marginBottom: '16px' }} />
            )}
            
            <h4 style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '12px' }}>
              Champs détectés — vérifiez et corrigez si nécessaire :
            </h4>

            <div className="ocr-fields-list">
              {fields.filter(f => f.type !== 'date' && f.type !== 'time').map(field => (
                <div className="ocr-field-row" key={field.name}>
                  <label className="ocr-field-label">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      className="input-field"
                      value={mappedFields[field.name] || ''}
                      onChange={e => updateMapped(field.name, e.target.value)}
                      style={{ fontSize: '0.82rem' }}
                    >
                      <option value="">—</option>
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      className="input-field"
                      type="text"
                      value={mappedFields[field.name] || ''}
                      onChange={e => updateMapped(field.name, e.target.value)}
                      placeholder="Non détecté"
                      style={{ fontSize: '0.82rem' }}
                    />
                  )}
                </div>
              ))}
            </div>

            {extractedText && (
              <details style={{ marginTop: '14px' }}>
                <summary style={{ color: '#666', fontSize: '0.78rem', cursor: 'pointer' }}>
                  Voir le texte brut extrait
                </summary>
                <pre className="ocr-raw-text">{extractedText}</pre>
              </details>
            )}

            <div className="ocr-actions">
              <button className="btn-primary" onClick={handleApply} style={{ flex: 1 }}>
                Appliquer les valeurs
              </button>
              <button className="btn-secondary" onClick={() => { setStep('pick'); setPreview(null); setExtractedText(''); setMappedFields({}); }}>
                Rescanner
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
