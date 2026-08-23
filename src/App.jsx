import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import RegisterView from './components/RegisterView';
import RecordDetail from './components/RecordDetail';
import RecordForm from './components/RecordForm';
import { sampleRecords } from './data/registersData';

export default function App() {
  const [screen, setScreen] = useState('dashboard');
  const [user, setUser] = useState({ name: 'Utilisateur' });
  const [activeRegister, setActiveRegister] = useState(null);
  const [activeRecord, setActiveRecord] = useState(null);

  // Live records state initialized from localStorage (or empty default)
  const [recordsMap, setRecordsMap] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus_lab_records');
      return saved ? JSON.parse(saved) : sampleRecords;
    } catch {
      return sampleRecords;
    }
  });

  // Save to localStorage when recordsMap changes
  useEffect(() => {
    try {
      localStorage.setItem('nexus_lab_records', JSON.stringify(recordsMap));
    } catch {
      // Storage quota or error
    }
  }, [recordsMap]);

  // Clear all records from all registers
  const handleClearAllRecords = () => {
    try {
      localStorage.removeItem('nexus_lab_records');
    } catch {
      // localStorage error
    }
    const emptyMap = {
      ph: [],
      suivi: [],
      preparation: [],
      consigne: [],
      sample: [],
      equipment: [],
      experiment: [],
      visitor: [],
      maintenance: [],
      incident: [],
      access: [],
      chemical: [],
      waste: [],
      calibration: [],
    };
    setRecordsMap(emptyMap);
  };

  // Record handler
  const handleSaveRecord = (registerId, newRecord) => {
    setRecordsMap(prev => ({
      ...prev,
      [registerId]: [newRecord, ...(prev[registerId] || [])]
    }));
  };

  const handleDeleteRecord = (registerId, recordId) => {
    setRecordsMap(prev => ({
      ...prev,
      [registerId]: (prev[registerId] || []).filter(r => r.id !== recordId)
    }));
  };

  // Navigation handlers
  const handleGetStarted = () => {
    setUser({ name: 'Utilisateur' });
    setScreen('dashboard');
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setScreen('dashboard');
  };

  const handleSelectRegister = (regId) => {
    setActiveRegister(regId);
    setActiveRecord(null);
    setScreen('register');
  };

  const handleSelectRecord = (record) => {
    setActiveRecord(record);
    setScreen('record-detail');
  };

  const handleNewRecord = () => setScreen('new-record');

  const handleFormCancel = () => setScreen('register');

  const handleFormSaved = () => setScreen('register');

  const handleLogout = () => {
    localStorage.removeItem('nexus_authenticated');
    localStorage.removeItem('nexus_auth_method');
    setUser(null);
    setScreen('landing');
  };

  return (
    <div className="app-root">
      {screen === 'landing' && (
        <LandingPage onGetStarted={handleGetStarted} />
      )}

      {screen === 'auth' && (
        <AuthScreen
          onBack={() => setScreen('landing')}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {screen === 'dashboard' && (
        <Dashboard
          userName={user?.name}
          recordsMap={recordsMap}
          onSelectRegister={handleSelectRegister}
          onSelectRecord={(record, regId) => {
            setActiveRegister(regId);
            setActiveRecord(record);
            setScreen('record-detail');
          }}
          onClearAllRecords={handleClearAllRecords}
          onLogout={handleLogout}
        />
      )}

      {screen === 'register' && (
        <RegisterView
          registerId={activeRegister}
          records={recordsMap[activeRegister] || []}
          onBack={() => setScreen('dashboard')}
          onNewRecord={handleNewRecord}
          onSelectRecord={handleSelectRecord}
        />
      )}

      {screen === 'record-detail' && (
        <RecordDetail
          registerId={activeRegister}
          record={activeRecord}
          onBack={() => setScreen('register')}
          onBackToRegister={() => setScreen('register')}
        />
      )}

      {screen === 'new-record' && (
        <RecordForm
          registerId={activeRegister}
          onCancel={handleFormCancel}
          onSaveRecord={handleSaveRecord}
          onViewRecord={(record) => {
            setActiveRecord(record);
            setScreen('record-detail');
          }}
        />
      )}
    </div>
  );
}
