import React from 'react';
import { registers, formConfigs } from '../data/registersData';

export default function RecordDetail({ registerId, record, onBack, onBackToRegister }) {
  const reg = registers.find(r => r.id === registerId);
  const config = formConfigs[registerId];
  if (!reg || !config || !record) return null;

  // Flatten all fields from all steps
  const allFields = config.steps.flatMap(step => step.fields);

  return (
    <div className="record-detail">
      {/* Toolbar */}
      <div className="reg-toolbar">
        <div className="reg-toolbar-left">
          <button className="back-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            Retour au {reg.name}
          </button>
        </div>
        <div className="reg-toolbar-right">
          <span style={{ fontSize: '0.82rem', color: '#888', fontWeight: 600 }}>
            {record.id}
          </span>
          {record.status && (
            <span className={`status-badge ${record.status.toLowerCase()}`}>
              {record.status}
            </span>
          )}
        </div>
      </div>

      <div className="detail-body">
        {config.steps.map((step, si) => {
          const hasValues = step.fields.some(f => record[f.name]);
          if (!hasValues) return null;
          return (
            <div key={si} style={{ marginBottom: '28px' }}>
              <h3 style={{
                fontSize: '0.78rem', fontWeight: 700, color: '#888',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                marginBottom: '14px', paddingBottom: '8px',
                borderBottom: '1px solid #222'
              }}>
                {step.title}
              </h3>
              <div className="detail-grid">
                {step.fields.map(field => (
                  <div className={`detail-field ${field.type === 'textarea' ? 'full' : ''}`} key={field.name}>
                    <span className="field-label">{field.label}</span>
                    <span className="field-value">{record[field.name] || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
