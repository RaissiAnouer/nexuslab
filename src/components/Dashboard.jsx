import React from 'react';
import { registers } from '../data/registersData';

const icons = {
  ph: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/></svg>,
  sample: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>,
  equipment: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01"/></svg>,
  experiment: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3h6v7a3 3 0 0 1-.745 1.987l-4.51 5.262A2 2 0 0 0 11.27 20h1.46a2 2 0 0 0 1.525-2.751L9.745 11.987A3 3 0 0 1 9 10z"/></svg>,
  visitor: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  maintenance: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  incident: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  access: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  chemical: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><circle cx="15" cy="15" r="1"/><circle cx="10" cy="17" r="1"/></svg>,
  waste: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  calibration: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
};

const arrow = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>;

export default function Dashboard({ userName, recordsMap = {}, onSelectRegister, onSelectRecord, onClearAllRecords, onLogout }) {
  const todayStr = new Date().toLocaleDateString('fr-FR');
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  let totalRecords = 0;
  let todayCount = 0;
  let pendingCount = 0;
  let completedCount = 0;

  Object.values(recordsMap).forEach(list => {
    if (!Array.isArray(list)) return;
    totalRecords += list.length;
    list.forEach(item => {
      if (item.date === todayStr) todayCount++;
      if (item.status === 'Draft' || item.status === 'Brouillon') pendingCount++;
      else completedCount++;
    });
  });

  // Search through all saved records across all registers
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const results = [];

    Object.entries(recordsMap).forEach(([regId, list]) => {
      if (!Array.isArray(list)) return;
      const reg = registers.find(r => r.id === regId);
      const regName = reg ? reg.name : regId;

      list.forEach(rec => {
        const valuesStr = Object.values(rec).map(v => v?.toString() || '').join(' ').toLowerCase();
        if (valuesStr.includes(q)) {
          results.push({ record: rec, registerId: regId, registerName: regName });
        }
      });
    });
    return results;
  }, [searchQuery, recordsMap]);

  return (
    <div className="dashboard">
      {/* Top Header with App Name & Search Icon */}
      <header className="dash-header" style={{ position: 'relative' }}>
        <div className="dash-logo">NEXUS <span>Lab</span></div>

        <div className="dash-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showSearch ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '20px', padding: '4px 12px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                autoFocus
                placeholder="Rechercher une fiche..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.85rem', width: '180px' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.8rem', padding: '0 4px' }}>✕</button>
              )}
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.8rem', marginLeft: '4px' }}>
                Fermer
              </button>
            </div>
          ) : (
            <button
              className="icon-btn"
              onClick={() => setShowSearch(true)}
              title="Rechercher des enregistrements"
              style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#ccc', cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          )}
        </div>
      </header>

      {/* Search Results Dropdown Overlay */}
      {showSearch && searchQuery.trim() !== '' && (
        <div className="search-results-overlay" style={{ background: '#111', borderBottom: '1px solid #222', padding: '16px 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 10 }}>
          <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>
            {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''} pour « {searchQuery} » :
          </div>
          {searchResults.length === 0 ? (
            <p style={{ color: '#555', fontSize: '0.85rem', margin: 0 }}>Aucun enregistrement ne correspond à votre recherche.</p>
          ) : (
            <div style={{ display: 'grid', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
              {searchResults.map(({ record, registerId, registerName }) => (
                <div
                  key={record.id}
                  onClick={() => onSelectRecord && onSelectRecord(record, registerId)}
                  style={{
                    background: '#181818',
                    border: '1px solid #282828',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6c63ff'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#282828'}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.7rem', background: '#252525', color: '#aaa', padding: '2px 6px', borderRadius: '4px' }}>{registerName}</span>
                      <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{record.id}</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '4px' }}>
                      {record.designation || record.sampleName || record.produit || record.consigne || record.observation || 'Fiche de registre'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>
                    <div>{record.date}</div>
                    <div style={{ color: record.status === 'Finalisé' ? '#4ade80' : '#facc15', marginTop: '2px' }}>{record.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="dash-body">

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Enregistrements</span>
            <span className="stat-value">{totalRecords}</span>
            <span className="stat-sub">Sur tous les registres</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Aujourd'hui</span>
            <span className="stat-value">{todayCount}</span>
            <span className="stat-sub">Saisis aujourd'hui</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">En Attente</span>
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-sub">Formulaires brouillons</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Finalisés</span>
            <span className="stat-value">{completedCount}</span>
            <span className="stat-sub">Fiches enregistrées</span>
          </div>
        </div>

        {/* Registers */}
        <div>
          <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Registres du Laboratoire</h2>
            {totalRecords > 0 && (
              <button 
                onClick={onClearAllRecords} 
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Effacer tous les enregistrements
              </button>
            )}
          </div>
          {registers.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '20px', padding: '40px 20px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px dashed #333' }}>
              <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>Aucun registre disponible pour le moment.</p>
            </div>
          ) : (
            <div className="register-grid" style={{ marginTop: '14px' }}>
              {registers.map(reg => {
                const regRecords = recordsMap[reg.id] || [];
                const count = regRecords.length;
                const lastUpdated = regRecords[0]?.date || '—';

                return (
                  <div className="register-card" key={reg.id} onClick={() => onSelectRegister(reg.id)}>
                    <div className="reg-icon-box">{icons[reg.icon]}</div>
                    <div className="reg-content">
                      <h3>{reg.name}</h3>
                      <p className="reg-desc">{reg.description}</p>
                      <div className="reg-meta">
                        <span>{count} {count <= 1 ? 'enregistrement' : 'enregistrements'}</span>
                        <span>Modifié le {lastUpdated}</span>
                      </div>
                    </div>
                    <div className="reg-arrow">{arrow}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
