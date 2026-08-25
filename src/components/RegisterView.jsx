import React, { useState } from 'react';
import { registers, formConfigs } from '../data/registersData';

export default function RegisterView({ registerId, records = [], onBack, onNewRecord, onSelectRecord }) {
  const reg = registers.find(r => r.id === registerId);
  const config = formConfigs[registerId];
  const [search, setSearch] = useState('');

  if (!reg || !config) return null;

  const columns = config.tableColumns;
  const labels = config.columnLabels;

  const filtered = records.filter(rec =>
    Object.values(rec).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="register-view">
      {/* Toolbar */}
      <div className="reg-toolbar">
        <div className="reg-toolbar-left">
          <button className="back-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            Retour
          </button>
          <h1>{reg.name}</h1>
        </div>
        <div className="reg-toolbar-right">
          <input className="dash-search" type="text" placeholder="Rechercher un enregistrement..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ width: '220px' }} />
          <button className="btn-small" onClick={onNewRecord}>{config.newButtonLabel}</button>
        </div>
      </div>

      {/* Body */}
      <div className="reg-body">
        <p className="reg-description">{reg.description}</p>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>{search ? 'Aucun enregistrement correspondant trouvé.' : 'Aucun enregistrement disponible pour l\'instant.'}</p>
          </div>
        ) : (
          <div className="records-table-wrap">
            <table className="records-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col}>{labels[col] || col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(rec => (
                  <tr key={rec.id} onClick={() => onSelectRecord(rec)}>
                    {columns.map(col => (
                      <td key={col}>
                        {col === 'status' ? (
                          <span className={`status-badge ${(rec[col] || '').toLowerCase()}`}>
                            {rec[col]}
                          </span>
                        ) : (
                          rec[col] || '—'
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
