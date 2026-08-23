/*
  ═══════════════════════════════════════════════════════
  Registres de Laboratoire — Données et Formulaires
  ═══════════════════════════════════════════════════════
*/

// ── Définitions des Registres ──────────────────────────

export const registers = [
  {
    id: 'ph',
    name: 'Registre pH',
    description: 'Enregistrer les mesures et étalonnages pH du laboratoire.',
    icon: 'ph',
    recordCount: 0,
    lastUpdated: '—',
  },
  {
    id: 'suivi',
    name: 'Registre de Suivi',
    description: 'Suivi des opérations et traitements du laboratoire.',
    icon: 'experiment',
    recordCount: 0,
    lastUpdated: '—',
  },
  {
    id: 'preparation',
    name: 'Cahier de Préparation',
    description: 'Registre des préparations de réactifs et solutions du laboratoire.',
    icon: 'chemical',
    recordCount: 0,
    lastUpdated: '—',
  },
  {
    id: 'consigne',
    name: 'Cahier de Consigne',
    description: 'Suivi des consignes, demandes et leur état d\'avancement.',
    icon: 'maintenance',
    recordCount: 0,
    lastUpdated: '—',
  },
];

// ── Configurations des Formulaires par Registre ───────

export const formConfigs = {
  ph: {
    newButtonLabel: '+ Nouvelle mesure pH',
    steps: [
      {
        title: 'Date & Type',
        fields: [
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'time', label: 'Heure', type: 'time', required: true },
          { name: 'type', label: 'Étalonnage (ET) / Mesure (ME)', type: 'select', required: true, options: ['ET - Étalonnage / Calibration', 'ME - Mesure / Measure'] },
          { name: 'mesure', label: 'Mesure pH', type: 'number', required: true, placeholder: '0.00 – 14.00', min: 0, max: 14, step: 0.01 },
        ],
      },
      {
        title: 'Identification',
        fields: [
          { name: 'designation', label: 'Désignation', type: 'text', required: true, placeholder: 'ex. Eau de process, Solution tampon...' },
          { name: 'numLot', label: 'N° de lot / Batch N°', type: 'text', placeholder: 'ex. LOT-2026-045' },
          { name: 'numDPA', label: 'N° DPA / RFA N°', type: 'text', placeholder: 'ex. DPA-2026-012' },
        ],
      },
      {
        title: 'Résultat & Responsables',
        fields: [
          { name: 'observation', label: 'Observation / Résultat', type: 'textarea', placeholder: 'Résultat de la mesure ou observation...' },
          { name: 'operateur', label: 'Opérateur', type: 'text', required: true, placeholder: 'Nom de l\'opérateur' },
          { name: 'verificateur', label: 'Vérificateur / Checker', type: 'text', placeholder: 'Nom du vérificateur' },
        ],
      },
    ],
    tableColumns: ['date', 'type', 'mesure', 'designation', 'numLot', 'operateur', 'status'],
    columnLabels: { date: 'Date', type: 'ET/ME', mesure: 'pH', designation: 'Désignation', numLot: 'N° Lot', operateur: 'Opérateur', status: 'Statut' },
  },

  suivi: {
    newButtonLabel: '+ Nouveau suivi',
    steps: [
      {
        title: 'Date & Identification',
        fields: [
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'time', label: 'Heure', type: 'time', required: true },
          { name: 'designation', label: 'Désignation', type: 'text', required: true, placeholder: 'ex. Eau traitée, Solution X...' },
          { name: 'numLot', label: 'N° de lot', type: 'text', placeholder: 'ex. LOT-2026-078' },
        ],
      },
      {
        title: 'Détails & Opération',
        fields: [
          { name: 'numDPA', label: 'N° DPA', type: 'text', placeholder: 'ex. DPA-2026-015' },
          { name: 'numColonne', label: 'N° Colonne', type: 'text', placeholder: 'ex. COL-03' },
          { name: 'operation', label: 'Opération', type: 'textarea', required: true, placeholder: 'Décrire l\'opération effectuée...' },
        ],
      },
    ],
    tableColumns: ['date', 'designation', 'numLot', 'numDPA', 'numColonne', 'operation', 'status'],
    columnLabels: { date: 'Date', designation: 'Désignation', numLot: 'N° Lot', numDPA: 'N° DPA', numColonne: 'N° Colonne', operation: 'Opération', status: 'Statut' },
  },

  preparation: {
    newButtonLabel: '+ Nouvelle préparation',
    steps: [
      {
        title: 'Informations générales',
        fields: [
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'refPreparation', label: 'Référence préparation', type: 'text', required: true, placeholder: 'ex. PREP-2026-018' },
          { name: 'designationPrep', label: 'Désignation de la préparation', type: 'text', required: true, placeholder: 'ex. Solution NaOH 0.1N' },
          { name: 'essai', label: 'Essai', type: 'text', required: true, placeholder: 'ex. Dosage acidimétrique, Titragemétrie...' },
        ],
      },
      {
        title: 'Réactifs & Matières',
        fields: [
          { name: 'moSop', label: 'MO / SOP (Mode Opératoire)', type: 'text', placeholder: 'ex. MO-LAB-042, SOP-2026-003' },
          { name: 'produit', label: 'Produit', type: 'text', required: true, placeholder: 'ex. Hydroxyde de sodium' },
          { name: 'designationReactif', label: 'Désignation réactif / Matière première', type: 'text', placeholder: 'ex. NaOH en pastilles, pureté 99%' },
          { name: 'fournisseur', label: 'Fournisseur', type: 'text', placeholder: 'ex. Sigma-Aldrich, Merck' },
        ],
      },
      {
        title: 'Eau, Stock & Péremption',
        fields: [
          { name: 'typeEau', label: 'Type d\'eau utilisée', type: 'select', options: ['Eau distillée', 'Eau déionisée', 'Eau ultra-pure', 'Eau du robinet', 'Autre'] },
          { name: 'datePeremption', label: 'Date de péremption', type: 'date' },
          { name: 'refStock', label: 'Référence stock', type: 'text', placeholder: 'ex. STK-2026-091' },
        ],
      },
    ],
    tableColumns: ['date', 'refPreparation', 'designationPrep', 'essai', 'produit', 'fournisseur', 'status'],
    columnLabels: { date: 'Date', refPreparation: 'Réf. Prép.', designationPrep: 'Désignation', essai: 'Essai', produit: 'Produit', fournisseur: 'Fournisseur', status: 'Statut' },
  },

  consigne: {
    newButtonLabel: '+ Nouvelle consigne',
    steps: [
      {
        title: 'Consigne',
        fields: [
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'consigne', label: 'Consigne', type: 'textarea', required: true, placeholder: 'Décrire la consigne ou l\'instruction...' },
          { name: 'demandeur', label: 'Demandeur', type: 'text', required: true, placeholder: 'Nom du demandeur' },
          { name: 'receveur', label: 'Receveur', type: 'text', required: true, placeholder: 'Nom du receveur' },
          { name: 'etatAvancement', label: 'État d\'avancement', type: 'select', required: true, options: ['Non commencé', 'En cours', 'Terminé', 'En attente', 'Annulé'] },
        ],
      },
    ],
    tableColumns: ['date', 'consigne', 'demandeur', 'receveur', 'etatAvancement', 'status'],
    columnLabels: { date: 'Date', consigne: 'Consigne', demandeur: 'Demandeur', receveur: 'Receveur', etatAvancement: 'Avancement', status: 'Statut' },
  },

  sample: {
    newButtonLabel: '+ Nouvel échantillon',
    steps: [
      {
        title: 'Informations sur l\'échantillon',
        fields: [
          { name: 'sampleId', label: 'ID Échantillon', type: 'text', required: true, placeholder: 'ex. SMP-2026-125' },
          { name: 'sampleName', label: 'Nom de l\'échantillon', type: 'text', required: true, placeholder: 'ex. Prélèvement Sol B12' },
          { name: 'sampleType', label: 'Type d\'échantillon', type: 'select', required: true, options: ['Eau', 'Sol', 'Air', 'Biologique', 'Chimique', 'Alimentaire', 'Autre'] },
          { name: 'source', label: 'Source / Origine', type: 'text', placeholder: 'ex. Site Rivière 3' },
        ],
      },
      {
        title: 'Collecte & Stockage',
        fields: [
          { name: 'collectionDate', label: 'Date de prélèvement', type: 'date', required: true },
          { name: 'quantity', label: 'Quantité', type: 'text', placeholder: 'ex. 500ml, 200g' },
          { name: 'storageLocation', label: 'Lieu de stockage', type: 'text', placeholder: 'ex. Congélateur B, Étagère 3' },
          { name: 'expirationDate', label: 'Date d\'expiration', type: 'date' },
        ],
      },
      {
        title: 'Responsable & Notes',
        fields: [
          { name: 'responsiblePerson', label: 'Responsable', type: 'text', required: true, placeholder: 'Nom complet' },
          { name: 'observations', label: 'Observations', type: 'textarea', placeholder: 'Remarques...' },
        ],
      },
    ],
    tableColumns: ['sampleId', 'sampleName', 'sampleType', 'collectionDate', 'responsiblePerson', 'status'],
    columnLabels: { sampleId: 'ID', sampleName: 'Nom', sampleType: 'Type', collectionDate: 'Date', responsiblePerson: 'Responsable', status: 'Statut' },
  },

  equipment: {
    newButtonLabel: '+ Nouvel équipement',
    steps: [
      {
        title: 'Détails de l\'équipement',
        fields: [
          { name: 'equipmentName', label: 'Nom de l\'équipement', type: 'text', required: true, placeholder: 'ex. Centrifugeuse' },
          { name: 'equipmentId', label: 'ID Équipement', type: 'text', required: true, placeholder: 'ex. EQ-0038' },
          { name: 'manufacturer', label: 'Fabricant', type: 'text', placeholder: 'ex. Thermo Fisher' },
          { name: 'model', label: 'Modèle', type: 'text', placeholder: 'ex. Sorvall ST 16R' },
          { name: 'serialNumber', label: 'Numéro de série', type: 'text', placeholder: 'ex. SN-29384756' },
        ],
      },
      {
        title: 'Emplacement & Responsabilité',
        fields: [
          { name: 'acquisitionDate', label: 'Date d\'acquisition', type: 'date' },
          { name: 'location', label: 'Emplacement', type: 'text', placeholder: 'ex. Salle de labo 105' },
          { name: 'responsiblePerson', label: 'Responsable', type: 'text', required: true, placeholder: 'Nom complet' },
          { name: 'condition', label: 'État', type: 'select', options: ['Neuf', 'Bon état', 'Moyen', 'À réparer', 'Hors service'] },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Notes complémentaires...' },
        ],
      },
    ],
    tableColumns: ['equipmentId', 'equipmentName', 'manufacturer', 'location', 'condition', 'status'],
    columnLabels: { equipmentId: 'ID', equipmentName: 'Nom', manufacturer: 'Fabricant', location: 'Emplacement', condition: 'État', status: 'Statut' },
  },

  experiment: {
    newButtonLabel: '+ Nouvelle expérience',
    steps: [
      {
        title: 'Informations sur l\'expérience',
        fields: [
          { name: 'experimentId', label: 'ID Expérience', type: 'text', required: true, placeholder: 'ex. EXP-2026-020' },
          { name: 'title', label: 'Titre de l\'expérience', type: 'text', required: true, placeholder: 'ex. Test d\'extraction de protéines' },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'researcher', label: 'Chercheur', type: 'text', required: true, placeholder: 'Nom complet' },
        ],
      },
      {
        title: 'Procédure & Résultats',
        fields: [
          { name: 'objective', label: 'Objectif', type: 'textarea', required: true, placeholder: 'Décrire l\'objectif...' },
          { name: 'procedure', label: 'Procédure suivie', type: 'textarea', placeholder: 'Décrire le protocole...' },
          { name: 'results', label: 'Résultats', type: 'textarea', placeholder: 'Résultats obtenus...' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Notes complémentaires...' },
        ],
      },
    ],
    tableColumns: ['experimentId', 'title', 'date', 'researcher', 'status'],
    columnLabels: { experimentId: 'ID', title: 'Titre', date: 'Date', researcher: 'Chercheur', status: 'Statut' },
  },

  visitor: {
    newButtonLabel: '+ Nouveau visiteur',
    steps: [
      {
        title: 'Informations sur le visiteur',
        fields: [
          { name: 'visitorName', label: 'Nom du visiteur', type: 'text', required: true, placeholder: 'Nom complet' },
          { name: 'organization', label: 'Organisme / Société', type: 'text', placeholder: 'ex. Université d\'Alger' },
          { name: 'purpose', label: 'Motif de la visite', type: 'text', required: true, placeholder: 'ex. Inspection du labo' },
          { name: 'personVisited', label: 'Personne visitée', type: 'text', required: true, placeholder: 'Nom complet' },
        ],
      },
      {
        title: 'Détails de la visite',
        fields: [
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'entryTime', label: 'Heure d\'entrée', type: 'time', required: true },
          { name: 'exitTime', label: 'Heure de sortie', type: 'time' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Notes complémentaires...' },
        ],
      },
    ],
    tableColumns: ['visitorName', 'organization', 'purpose', 'date', 'entryTime', 'status'],
    columnLabels: { visitorName: 'Visiteur', organization: 'Organisme', purpose: 'Motif', date: 'Date', entryTime: 'Entrée', status: 'Statut' },
  },

  maintenance: {
    newButtonLabel: '+ Nouvelle maintenance',
    steps: [
      {
        title: 'Équipement & Planification',
        fields: [
          { name: 'equipmentName', label: 'Nom de l\'équipement', type: 'text', required: true, placeholder: 'ex. Spectrophotomètre' },
          { name: 'equipmentId', label: 'ID Équipement', type: 'text', required: true, placeholder: 'ex. EQ-0012' },
          { name: 'maintenanceType', label: 'Type de maintenance', type: 'select', required: true, options: ['Préventive', 'Corrective', 'Étalonnage', 'Nettoyage', 'Autre'] },
          { name: 'date', label: 'Date', type: 'date', required: true },
        ],
      },
      {
        title: 'Détails de l\'intervention',
        fields: [
          { name: 'technician', label: 'Technicien', type: 'text', required: true, placeholder: 'Nom complet' },
          { name: 'description', label: 'Description des travaux', type: 'textarea', required: true, placeholder: 'Détails des opérations effectuées...' },
          { name: 'nextDate', label: 'Prochaine maintenance', type: 'date' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Notes complémentaires...' },
        ],
      },
    ],
    tableColumns: ['equipmentId', 'equipmentName', 'maintenanceType', 'date', 'technician', 'status'],
    columnLabels: { equipmentId: 'ID Équip.', equipmentName: 'Équipement', maintenanceType: 'Type', date: 'Date', technician: 'Technicien', status: 'Statut' },
  },

  incident: {
    newButtonLabel: '+ Nouvel incident',
    steps: [
      {
        title: 'Informations sur l\'incident',
        fields: [
          { name: 'incidentId', label: 'ID Incident', type: 'text', required: true, placeholder: 'ex. INC-2026-009' },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'time', label: 'Heure', type: 'time', required: true },
          { name: 'location', label: 'Lieu', type: 'text', required: true, placeholder: 'ex. Salle 202' },
          { name: 'severity', label: 'Niveau de gravité', type: 'select', required: true, options: ['Faible', 'Moyenne', 'Élevée', 'Critique'] },
        ],
      },
      {
        title: 'Détails & Actions',
        fields: [
          { name: 'reportedBy', label: 'Rapporté par', type: 'text', required: true, placeholder: 'Nom complet' },
          { name: 'description', label: 'Description de l\'incident', type: 'textarea', required: true, placeholder: 'Expliquer ce qui s\'est passé...' },
          { name: 'actionsTaken', label: 'Actions correctives', type: 'textarea', placeholder: 'Mesures prises...' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Notes complémentaires...' },
        ],
      },
    ],
    tableColumns: ['incidentId', 'date', 'location', 'severity', 'reportedBy', 'status'],
    columnLabels: { incidentId: 'ID', date: 'Date', location: 'Lieu', severity: 'Gravité', reportedBy: 'Rapporté par', status: 'Statut' },
  },

  access: {
    newButtonLabel: '+ Nouvelle entrée',
    steps: [
      {
        title: 'Informations d\'accès',
        fields: [
          { name: 'personName', label: 'Nom de la personne', type: 'text', required: true, placeholder: 'Nom complet' },
          { name: 'role', label: 'Rôle', type: 'select', required: true, options: ['Personnel', 'Chercheur', 'Étudiant', 'Visiteur', 'Prestataire', 'Autre'] },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'entryTime', label: 'Heure d\'entrée', type: 'time', required: true },
          { name: 'exitTime', label: 'Heure de sortie', type: 'time' },
          { name: 'purpose', label: 'Motif d\'accès', type: 'text', placeholder: 'ex. Travaux de recherche' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Notes complémentaires...' },
        ],
      },
    ],
    tableColumns: ['personName', 'role', 'date', 'entryTime', 'exitTime', 'status'],
    columnLabels: { personName: 'Nom', role: 'Rôle', date: 'Date', entryTime: 'Entrée', exitTime: 'Sortie', status: 'Statut' },
  },

  chemical: {
    newButtonLabel: '+ Nouveau produit',
    steps: [
      {
        title: 'Informations sur le produit',
        fields: [
          { name: 'chemicalName', label: 'Nom du produit / matériau', type: 'text', required: true, placeholder: 'ex. Acide chlorhydrique' },
          { name: 'chemicalId', label: 'ID Produit', type: 'text', required: true, placeholder: 'ex. CHM-090' },
          { name: 'casNumber', label: 'Numéro CAS', type: 'text', placeholder: 'ex. 7647-01-0' },
          { name: 'category', label: 'Catégorie', type: 'select', required: true, options: ['Acide', 'Base', 'Solvant', 'Réactif', 'Étalon', 'Biologique', 'Autre'] },
        ],
      },
      {
        title: 'Quantité & Stockage',
        fields: [
          { name: 'quantity', label: 'Quantité', type: 'text', required: true, placeholder: 'ex. 2.5 L' },
          { name: 'concentration', label: 'Concentration', type: 'text', placeholder: 'ex. 37%' },
          { name: 'storageLocation', label: 'Emplacement de stockage', type: 'text', placeholder: 'ex. Armoire produits chimiques A' },
          { name: 'expirationDate', label: 'Date de péremption', type: 'date' },
          { name: 'supplier', label: 'Fournisseur', type: 'text', placeholder: 'ex. Sigma-Aldrich' },
          { name: 'notes', label: 'Notes & Sécurité', type: 'textarea', placeholder: 'Précautions, risques...' },
        ],
      },
    ],
    tableColumns: ['chemicalId', 'chemicalName', 'category', 'quantity', 'storageLocation', 'status'],
    columnLabels: { chemicalId: 'ID', chemicalName: 'Nom', category: 'Catégorie', quantity: 'Quantité', storageLocation: 'Emplacement', status: 'Statut' },
  },

  waste: {
    newButtonLabel: '+ Nouveau déchet',
    steps: [
      {
        title: 'Informations sur le déchet',
        fields: [
          { name: 'wasteId', label: 'ID Déchet', type: 'text', required: true, placeholder: 'ex. WST-2026-032' },
          { name: 'wasteType', label: 'Type de déchet', type: 'select', required: true, options: ['Chimique', 'Biologique', 'Radioactif', 'Tranchant/Piquant', 'Général', 'Électronique', 'Autre'] },
          { name: 'description', label: 'Description', type: 'text', required: true, placeholder: 'ex. Mélange de solvants usagés' },
          { name: 'quantity', label: 'Quantité', type: 'text', required: true, placeholder: 'ex. 5 L, 2 kg' },
        ],
      },
      {
        title: 'Détails de l\'élimination',
        fields: [
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'disposalMethod', label: 'Méthode d\'élimination', type: 'select', options: ['Incinération', 'Autoclave', 'Traitement chimique', 'Prestataire externe', 'Recyclage', 'Autre'] },
          { name: 'responsiblePerson', label: 'Responsable', type: 'text', required: true, placeholder: 'Nom complet' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Notes complémentaires...' },
        ],
      },
    ],
    tableColumns: ['wasteId', 'wasteType', 'description', 'quantity', 'date', 'status'],
    columnLabels: { wasteId: 'ID', wasteType: 'Type', description: 'Description', quantity: 'Qté', date: 'Date', status: 'Statut' },
  },

  calibration: {
    newButtonLabel: '+ Nouvel étalonnage',
    steps: [
      {
        title: 'Informations sur l\'étalonnage',
        fields: [
          { name: 'equipmentName', label: 'Nom de l\'équipement', type: 'text', required: true, placeholder: 'ex. Balance d\'analyse' },
          { name: 'equipmentId', label: 'ID Équipement', type: 'text', required: true, placeholder: 'ex. EQ-0005' },
          { name: 'calibrationDate', label: 'Date d\'étalonnage', type: 'date', required: true },
          { name: 'nextCalibration', label: 'Prochain étalonnage', type: 'date' },
        ],
      },
      {
        title: 'Détails de l\'étalonnage',
        fields: [
          { name: 'performedBy', label: 'Réalisé par', type: 'text', required: true, placeholder: 'Nom ou entreprise' },
          { name: 'standardUsed', label: 'Étalon de référence utilisé', type: 'text', placeholder: 'ex. Poids certifiés NIST' },
          { name: 'result', label: 'Résultat', type: 'select', required: true, options: ['Conforme', 'Non conforme', 'Ajusté & Conforme', 'Hors tolérance'] },
          { name: 'certificate', label: 'N° de certificat', type: 'text', placeholder: 'ex. CAL-CERT-2026-015' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Notes complémentaires...' },
        ],
      },
    ],
    tableColumns: ['equipmentId', 'equipmentName', 'calibrationDate', 'performedBy', 'result', 'status'],
    columnLabels: { equipmentId: 'ID Équip.', equipmentName: 'Équipement', calibrationDate: 'Date', performedBy: 'Par', result: 'Résultat', status: 'Statut' },
  },
};

// ── Registres vides au démarrage ──────────────────────

export const sampleRecords = {
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
