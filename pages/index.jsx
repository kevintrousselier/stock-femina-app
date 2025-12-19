import React, { useState, useEffect, useRef, useCallback } from 'react';

// Configuration Airtable
const AIRTABLE_TOKEN = 'pat4iLoXcx2zFoDIl.94d2b87c5a872b84dcf89849ec9c1ff1cf0e69fa2fbe5c8985adb88b096bace0';

// Configuration Cloudinary (à configurer avec votre compte)
// 1. Créer un compte gratuit sur https://cloudinary.com
// 2. Aller dans Settings > Upload > Upload presets
// 3. Créer un preset "unsigned" nommé "stock_photos"
// 4. Copier votre "Cloud name" depuis le Dashboard
const CLOUDINARY_CLOUD_NAME = 'dbo5n6fbh'; // Cloud name configuré
const CLOUDINARY_UPLOAD_PRESET = 'stock_photos'; // ← Nom du preset unsigned

// Charte graphique Femina Adventure
const COLORS = {
  primary: '#E91E8C',      // Rose magenta (couleur principale)
  secondary: '#00CED1',    // Turquoise/Cyan
  primaryLight: '#FCE4F2', // Rose clair (backgrounds)
  secondaryLight: '#E0FAFA', // Turquoise clair
  dark: '#1A1A2E',         // Texte foncé
  gray: '#64748B',         // Texte secondaire
  lightGray: '#F8FAFC',    // Fond clair
  white: '#FFFFFF',
  danger: '#EF4444',       // Rouge erreur
  warning: '#F59E0B',      // Orange warning
  success: '#22C55E',      // Vert succès
};

// Proxy CORS pour contourner les restrictions navigateur
const CORS_PROXY = 'https://corsproxy.io/?';

const fetchWithCORS = async (url, options = {}) => {
  const response = await fetch(CORS_PROXY + encodeURIComponent(url), {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  return response;
};

// Configuration des régions et leurs bases
const REGIONS = {
  corsica: {
    id: 'corsica',
    name: 'Corsica',
    flag: '🏝️',
    color: '#22c55e',
    bases: [
      { id: 'appvPlVjxg0DXPelD', name: 'Sono & Multimédia', icon: '🔊', color: '#22c55e' },
      { id: 'appbFMyMZhIURAGMp', name: 'Outils & Bricolage', icon: '🔧', color: '#3b82f6' },
      { id: 'appoE3SFnYIQBTsSs', name: 'Cordes & Ancrages', icon: '🪢', color: '#f59e0b' },
      { id: 'appHXYZkdADScJfvY', name: 'Consommables & Ravitaillement', icon: '📦', color: '#8b5cf6' },
      { id: 'appxfVk1NQJr0loZn', name: 'Matériels Médical', icon: '🏥', color: '#ef4444' },
      { id: 'app5Kkfho4TuAYtpv', name: 'Matériel Sport', icon: '⚽', color: '#06b6d4' },
      { id: 'appOaNG52xEjhiy84', name: 'Petit Matériel', icon: '🔩', color: '#84cc16' },
      { id: 'appDBLIHeSBtRYmhK', name: 'Mobiliers terrain', icon: '🪑', color: '#f97316' },
      { id: 'appajHLDJMy6Y2k0h', name: 'Signalisation & Cie', icon: '🚧', color: '#ec4899' },
      { id: 'appR3YRBn9MxirzQS', name: 'Radio & Tél', icon: '📻', color: '#14b8a6' },
      { id: 'appC6FVl7cyH71SdV', name: 'Supports Promo', icon: '🎪', color: '#a855f7' },
      { id: 'appgY2EiWsUKojCeX', name: 'Feux à Main & Connexes', icon: '🔥', color: '#dc2626' },
      { id: 'appfUuU3h4YDkLu10', name: 'Maillots course', icon: '👕', color: '#0ea5e9' },
    ],
  },
  gwada: {
    id: 'gwada',
    name: 'Guadeloupe',
    flag: '🌴',
    color: '#0ea5e9',
    bases: [
      { id: 'appTFsGQrHS0IiH6b', name: 'Sono & Multimédia', icon: '🔊', color: '#22c55e' },
      { id: 'app5GJyXy8bz9qWeJ', name: 'Cordes & Ancrages', icon: '🪢', color: '#f59e0b' },
      { id: 'appyR7Xr8UMzmdJCa', name: 'Consommables & Ravitaillement', icon: '📦', color: '#8b5cf6' },
      { id: 'app3K3uBrguQuQRcc', name: 'Matériels Médical', icon: '🏥', color: '#ef4444' },
      { id: 'appdlExw56Iu9azzp', name: 'Matériel Sport', icon: '⚽', color: '#06b6d4' },
      { id: 'app2r4Q3oO5YhBf7Z', name: 'Petit Matériel', icon: '🔩', color: '#84cc16' },
      { id: 'appvG2CmdRCn3jXPx', name: 'Signalisation & Cie', icon: '🚧', color: '#ec4899' },
      { id: 'app1w6iQgwvTMnTJY', name: 'Radios', icon: '📻', color: '#14b8a6' },
      { id: 'appLTccicItaAozvY', name: 'Supports Promo', icon: '🎪', color: '#a855f7' },
      { id: 'appdYzVmJk0pQBaVI', name: 'Feux à Main & Connexes', icon: '🔥', color: '#dc2626' },
    ],
  },
};

// API Airtable
const airtableAPI = {
  async fetchTables(baseId) {
    const res = await fetchWithCORS(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`);
    const data = await res.json();
    return data.tables || [];
  },

  async fetchRecords(baseId, tableId) {
    const res = await fetchWithCORS(`https://api.airtable.com/v0/${baseId}/${tableId}`);
    const data = await res.json();
    return data.records || [];
  },

  async updateRecord(baseId, tableId, recordId, fields) {
    const res = await fetchWithCORS(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields }),
    });
    return res.json();
  },

  async createRecord(baseId, tableId, fields) {
    const res = await fetchWithCORS(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });
    return res.json();
  },

  async deleteRecord(baseId, tableId, recordId) {
    const res = await fetchWithCORS(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
      method: 'DELETE',
    });
    return res.json();
  },
};

// ============================================
// MODULE PHOTO : Compression & Analyse Qualité
// ============================================

const PhotoUtils = {
  // Compression de l'image
  async compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          // Redimensionner si nécessaire
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir en blob compressé
          canvas.toBlob(
            (blob) => {
              const originalSize = file.size;
              const compressedSize = blob.size;
              resolve({
                blob,
                dataUrl: canvas.toDataURL('image/jpeg', quality),
                originalSize,
                compressedSize,
                compressionRatio: ((1 - compressedSize / originalSize) * 100).toFixed(1),
                width,
                height,
              });
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Analyse de la qualité de l'image
  async analyzeQuality(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Utiliser une taille réduite pour l'analyse (plus rapide)
        const analysisWidth = Math.min(img.width, 400);
        const analysisHeight = (img.height * analysisWidth) / img.width;
        canvas.width = analysisWidth;
        canvas.height = analysisHeight;
        ctx.drawImage(img, 0, 0, analysisWidth, analysisHeight);
        
        const imageData = ctx.getImageData(0, 0, analysisWidth, analysisHeight);
        const data = imageData.data;
        
        // Analyse de la luminosité
        let totalBrightness = 0;
        let pixelCount = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Formule de luminosité perçue
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
          totalBrightness += brightness;
          pixelCount++;
        }
        const avgBrightness = totalBrightness / pixelCount;
        
        // Analyse du flou (variance du Laplacien)
        const grayData = [];
        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
          grayData.push(gray);
        }
        
        // Calcul du Laplacien simplifié
        let laplacianSum = 0;
        let laplacianCount = 0;
        for (let y = 1; y < analysisHeight - 1; y++) {
          for (let x = 1; x < analysisWidth - 1; x++) {
            const idx = y * analysisWidth + x;
            const laplacian = 
              grayData[idx - analysisWidth] + 
              grayData[idx + analysisWidth] + 
              grayData[idx - 1] + 
              grayData[idx + 1] - 
              4 * grayData[idx];
            laplacianSum += laplacian * laplacian;
            laplacianCount++;
          }
        }
        const laplacianVariance = laplacianSum / laplacianCount;
        
        // Analyse du contraste
        let minBright = 255, maxBright = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          minBright = Math.min(minBright, brightness);
          maxBright = Math.max(maxBright, brightness);
        }
        const contrast = maxBright - minBright;
        
        // Scores et évaluations
        const results = {
          // Luminosité (0-255, idéal: 80-180)
          brightness: {
            value: avgBrightness.toFixed(0),
            status: avgBrightness < 50 ? 'dark' : avgBrightness > 200 ? 'bright' : 'ok',
            message: avgBrightness < 50 ? '🌑 Trop sombre' : avgBrightness > 200 ? '☀️ Trop lumineux' : '✓ Luminosité OK',
            score: avgBrightness >= 50 && avgBrightness <= 200 ? 100 : Math.max(0, 100 - Math.abs(avgBrightness - 125)),
          },
          // Netteté (variance Laplacien, > 500 = net)
          sharpness: {
            value: laplacianVariance.toFixed(0),
            status: laplacianVariance < 300 ? 'blurry' : laplacianVariance < 500 ? 'slight' : 'ok',
            message: laplacianVariance < 300 ? '📷 Image floue' : laplacianVariance < 500 ? '⚠️ Légèrement flou' : '✓ Netteté OK',
            score: Math.min(100, (laplacianVariance / 500) * 100),
          },
          // Contraste (idéal > 100)
          contrast: {
            value: contrast.toFixed(0),
            status: contrast < 50 ? 'low' : contrast < 100 ? 'medium' : 'ok',
            message: contrast < 50 ? '⬜ Contraste faible' : contrast < 100 ? '⚠️ Contraste moyen' : '✓ Contraste OK',
            score: Math.min(100, contrast),
          },
          // Taille de l'image
          resolution: {
            width: img.width,
            height: img.height,
            status: img.width < 400 || img.height < 400 ? 'small' : 'ok',
            message: img.width < 400 || img.height < 400 ? '🔍 Résolution trop faible' : '✓ Résolution OK',
            score: img.width >= 400 && img.height >= 400 ? 100 : 50,
          },
          // Score global
          overallScore: 0,
          isAcceptable: false,
        };
        
        // Calcul du score global
        results.overallScore = Math.round(
          (results.brightness.score + results.sharpness.score + results.contrast.score + results.resolution.score) / 4
        );
        results.isAcceptable = results.overallScore >= 60 && results.sharpness.status !== 'blurry';
        
        resolve(results);
      };
      img.src = dataUrl;
    });
  },

  // Formater la taille en KB/MB
  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  },

  // Upload vers Cloudinary
  async uploadToCloudinary(blob, fileName = 'photo') {
    const formData = new FormData();
    formData.append('file', blob, fileName + '.jpg');
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'stock_corsica'); // Organiser dans un dossier
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Erreur upload Cloudinary');
    }
    
    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    };
  },
};

// Stockage local pour le mode offline
const Storage = {
  save: (key, data) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`stock_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error('Storage error:', e);
    }
  },
  load: (key, defaultValue) => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const data = localStorage.getItem(`stock_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },
};

// Hook online/offline
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true); // Défaut à true
  useEffect(() => {
    // Côté client seulement
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
};

// Composant principal
export default function StockApp() {
  const [view, setView] = useState('user'); // Commence par la sélection d'utilisateur
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedBase, setSelectedBase] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [tables, setTables] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const [compressedPhoto, setCompressedPhoto] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  
  // States pour CRUD articles
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newName, setNewName] = useState('');
  
  // State pour notification de sync
  const [syncNotification, setSyncNotification] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const isOnline = useOnlineStatus();
  const fileInputRef = useRef(null);
  const wasOffline = useRef(false); // Pour détecter le passage offline → online

  // Charger les données du localStorage au montage (côté client uniquement)
  useEffect(() => {
    const savedRegion = Storage.load('region', null);
    const savedUser = Storage.load('user', null);
    const savedPending = Storage.load('pending', []);
    
    if (savedRegion) setSelectedRegion(savedRegion);
    if (savedUser) setCurrentUser(savedUser);
    if (savedPending) setPendingChanges(savedPending);
    
    // Déterminer la vue initiale
    if (savedUser && savedRegion) {
      setView('categories');
    } else if (savedUser) {
      setView('region');
    }
    
    setIsHydrated(true);
  }, []);

  // Sauvegarder les données localement
  useEffect(() => {
    Storage.save('region', selectedRegion);
  }, [selectedRegion]);

  useEffect(() => {
    Storage.save('user', currentUser);
  }, [currentUser]);

  useEffect(() => {
    Storage.save('pending', pendingChanges);
  }, [pendingChanges]);

  // ========== SYNC AUTOMATIQUE QUAND RETOUR RÉSEAU ==========
  useEffect(() => {
    // Si on était offline et qu'on revient online
    if (isOnline && wasOffline.current && pendingChanges.length > 0) {
      // Lancer la sync automatique
      autoSync();
    }
    // Mémoriser l'état précédent
    wasOffline.current = !isOnline;
  }, [isOnline]);

  // Fonction de sync automatique
  const autoSync = async () => {
    if (isSyncing || pendingChanges.length === 0) return;
    
    setIsSyncing(true);
    setSyncNotification({ type: 'syncing', message: `🔄 Synchronisation de ${pendingChanges.length} modification(s)...` });
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const change of pendingChanges) {
      try {
        if (change.type === 'update') {
          await airtableAPI.updateRecord(change.baseId, change.tableId, change.recordId, change.fields);
          successCount++;
        } else if (change.type === 'create') {
          await airtableAPI.createRecord(change.baseId, change.tableId, change.fields);
          successCount++;
        }
      } catch (err) {
        console.error('Erreur sync:', err);
        errorCount++;
      }
    }
    
    // Vider les changements en attente synchronisés
    if (errorCount === 0) {
      setPendingChanges([]);
      setSyncNotification({ type: 'success', message: `✅ ${successCount} modification(s) synchronisée(s)` });
    } else {
      setSyncNotification({ type: 'error', message: `⚠️ ${successCount} OK, ${errorCount} erreur(s)` });
    }
    
    setIsSyncing(false);
    
    // Masquer la notification après 3 secondes
    setTimeout(() => {
      setSyncNotification(null);
    }, 3000);
  };

  // Charger les tables d'une base
  const loadTables = useCallback(async (base) => {
    setLoading(true);
    setError(null);
    try {
      const tablesData = await airtableAPI.fetchTables(base.id);
      setTables(tablesData);
      Storage.save(`tables_${base.id}`, tablesData);
    } catch (err) {
      setError('Erreur de chargement');
      const cached = Storage.load(`tables_${base.id}`, []);
      setTables(cached);
    }
    setLoading(false);
  }, []);

  // Charger les records d'une table
  const loadRecords = useCallback(async (base, table) => {
    setLoading(true);
    setError(null);
    try {
      const recordsData = await airtableAPI.fetchRecords(base.id, table.id);
      setRecords(recordsData);
      Storage.save(`records_${base.id}_${table.id}`, recordsData);
    } catch (err) {
      setError('Erreur de chargement');
      const cached = Storage.load(`records_${base.id}_${table.id}`, []);
      setRecords(cached);
    }
    setLoading(false);
  }, []);

  // Mettre à jour un record
  const updateRecord = async (recordId, fieldName, value) => {
    // Ajouter automatiquement qui a fait la MAJ et quand
    const now = new Date().toLocaleDateString('fr-FR');
    const fields = { 
      [fieldName]: value,
      'Enregistré par': currentUser,
      'Date': now,
    };
    
    // Mettre à jour localement immédiatement
    setRecords(prev => prev.map(r => 
      r.id === recordId ? { ...r, fields: { ...r.fields, ...fields } } : r
    ));
    
    if (selectedRecord?.id === recordId) {
      setSelectedRecord(prev => ({ ...prev, fields: { ...prev.fields, ...fields } }));
    }

    if (isOnline) {
      try {
        await airtableAPI.updateRecord(selectedBase.id, selectedTable.id, recordId, fields);
      } catch (err) {
        // Enregistrer pour sync ultérieure
        setPendingChanges(prev => [...prev, { 
          type: 'update', 
          baseId: selectedBase.id, 
          tableId: selectedTable.id, 
          recordId, 
          fields,
          timestamp: Date.now() 
        }]);
      }
    } else {
      setPendingChanges(prev => [...prev, { 
        type: 'update', 
        baseId: selectedBase.id, 
        tableId: selectedTable.id, 
        recordId, 
        fields,
        timestamp: Date.now() 
      }]);
    }
  };

  // Ajouter un nouvel article
  const addNewItem = async () => {
    if (!newItemName.trim()) return;
    
    const fields = {
      Name: newItemName.trim(),
      CORISCA: '0',
    };

    if (isOnline) {
      try {
        setLoading(true);
        const result = await airtableAPI.createRecord(selectedBase.id, selectedTable.id, fields);
        setRecords(prev => [...prev, result]);
        setNewItemName('');
        setShowAddForm(false);
      } catch (err) {
        setError('Erreur lors de la création');
      }
      setLoading(false);
    } else {
      // Mode offline - créer localement
      const tempRecord = {
        id: `temp_${Date.now()}`,
        fields,
        _pending: true,
      };
      setRecords(prev => [...prev, tempRecord]);
      setPendingChanges(prev => [...prev, {
        type: 'create',
        baseId: selectedBase.id,
        tableId: selectedTable.id,
        fields,
        timestamp: Date.now(),
      }]);
      setNewItemName('');
      setShowAddForm(false);
    }
  };

  // ========== FONCTIONS CRUD ARTICLES ==========
  
  // Ouvrir modal d'ajout d'article
  const openAddModal = () => {
    setNewName('');
    setShowAddModal(true);
  };

  // Ouvrir modal d'édition d'article
  const openEditModal = (record) => {
    setEditTarget(record);
    setNewName(record.fields?.Name || '');
    setShowEditModal(true);
  };

  // Ouvrir modal de suppression d'article
  const openDeleteModal = (record) => {
    setDeleteTarget(record);
    setShowDeleteModal(true);
  };

  // Confirmer l'ajout d'un article
  const confirmAdd = async () => {
    if (!newName.trim()) return;
    
    const fields = { Name: newName.trim(), CORISCA: '0' };
    if (isOnline) {
      try {
        setLoading(true);
        const result = await airtableAPI.createRecord(selectedBase.id, selectedTable.id, fields);
        setRecords(prev => [...prev, result]);
      } catch (err) {
        setError('Erreur lors de la création');
      }
      setLoading(false);
    } else {
      const tempRecord = { id: `temp_${Date.now()}`, fields, _pending: true };
      setRecords(prev => [...prev, tempRecord]);
    }
    
    setShowAddModal(false);
    setNewName('');
  };

  // Confirmer l'édition d'un article
  const confirmEdit = async () => {
    if (!newName.trim() || !editTarget) return;
    
    await updateRecord(editTarget.id, 'Name', newName.trim());
    
    setShowEditModal(false);
    setEditTarget(null);
    setNewName('');
  };

  // Confirmer la suppression d'un article
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    setRecords(prev => prev.filter(r => r.id !== deleteTarget.id));
    
    if (isOnline) {
      try {
        await airtableAPI.deleteRecord(selectedBase.id, selectedTable.id, deleteTarget.id);
      } catch (err) {
        console.error('Erreur suppression:', err);
      }
    }
    
    if (selectedRecord?.id === deleteTarget.id) {
      setSelectedRecord(null);
      setView('items');
    }
    
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  // Supprimer un article
  const deleteItem = async (recordId) => {
    if (!window.confirm('Supprimer cet article ?')) return;

    setRecords(prev => prev.filter(r => r.id !== recordId));
    
    if (isOnline) {
      try {
        await airtableAPI.deleteRecord(selectedBase.id, selectedTable.id, recordId);
      } catch (err) {
        setPendingChanges(prev => [...prev, {
          type: 'delete',
          baseId: selectedBase.id,
          tableId: selectedTable.id,
          recordId,
          timestamp: Date.now(),
        }]);
      }
    } else {
      setPendingChanges(prev => [...prev, {
        type: 'delete',
        baseId: selectedBase.id,
        tableId: selectedTable.id,
        recordId,
        timestamp: Date.now(),
      }]);
    }
    
    setView('items');
    setSelectedRecord(null);
  };

  // Sync des changements en attente (bouton manuel)
  const syncPendingChanges = async () => {
    if (!isOnline || pendingChanges.length === 0 || isSyncing) return;
    
    setIsSyncing(true);
    setSyncNotification({ type: 'syncing', message: `🔄 Synchronisation de ${pendingChanges.length} modification(s)...` });
    
    let successCount = 0;
    const remaining = [];
    
    for (const change of pendingChanges) {
      try {
        if (change.type === 'update') {
          await airtableAPI.updateRecord(change.baseId, change.tableId, change.recordId, change.fields);
          successCount++;
        } else if (change.type === 'create') {
          await airtableAPI.createRecord(change.baseId, change.tableId, change.fields);
          successCount++;
        } else if (change.type === 'delete') {
          await airtableAPI.deleteRecord(change.baseId, change.tableId, change.recordId);
          successCount++;
        }
      } catch (err) {
        remaining.push(change);
      }
    }
    
    setPendingChanges(remaining);
    setIsSyncing(false);
    
    if (remaining.length === 0) {
      setSyncNotification({ type: 'success', message: `✅ ${successCount} modification(s) synchronisée(s)` });
    } else {
      setSyncNotification({ type: 'error', message: `⚠️ ${successCount} OK, ${remaining.length} en erreur` });
    }
    
    // Masquer la notification après 3 secondes
    setTimeout(() => {
      setSyncNotification(null);
    }, 3000);
  };

  // Navigation
  const goBack = () => {
    if (view === 'detail') {
      setView('items');
      setSelectedRecord(null);
    } else if (view === 'items') {
      setView('tables');
      setSelectedTable(null);
      setRecords([]);
    } else if (view === 'tables') {
      setView('categories');
      setSelectedBase(null);
      setTables([]);
    } else if (view === 'categories') {
      setView('region');
      setSelectedRegion(null);
    } else if (view === 'region') {
      setView('user');
      setCurrentUser(null);
    } else if (view === 'search') {
      setView('categories');
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const goHome = () => {
    setView('user');
    setCurrentUser(null);
    setSelectedRegion(null);
    setSelectedBase(null);
    setSelectedTable(null);
    setSelectedRecord(null);
    setTables([]);
    setRecords([]);
    setShowSearch(false);
    setSearchQuery('');
  };

  const selectBase = (base) => {
    setSelectedBase(base);
    setView('tables');
    loadTables(base);
  };

  const selectTable = (table) => {
    setSelectedTable(table);
    setView('items');
    loadRecords(selectedBase, table);
  };

  const selectRecord = (record) => {
    setSelectedRecord(record);
    setView('detail');
  };

  // Utilisateurs prédéfinis
  const USERS = ['Michel', 'Kevin', 'Alisson', 'Alex'];

  // Écran de sélection utilisateur (en premier)
  if (!currentUser || view === 'user') {
    return (
      <div style={styles.container}>
        <div style={styles.userSelectScreen}>
          <div style={styles.logoContainer}>
            <div style={styles.logo}>📦</div>
            <h1 style={styles.appTitle}>Stock Manager</h1>
            <p style={styles.appSubtitle}>Gestion de stock terrain</p>
          </div>
          <div style={styles.userSelectContainer}>
            <p style={styles.userSelectLabel}>Qui êtes-vous ?</p>
            {USERS.map((user) => (
              <button
                key={user}
                style={styles.userButton}
                onClick={() => {
                  setCurrentUser(user);
                  setView('region');
                }}
              >
                <span style={styles.userIcon}>👤</span>
                {user}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Écran de sélection de région (après utilisateur)
  if (!selectedRegion || view === 'region') {
    return (
      <div style={styles.container}>
        <div style={styles.userSelectScreen}>
          <div style={styles.logoContainer}>
            <div style={styles.logo}>🗺️</div>
            <h1 style={styles.appTitle}>Bonjour {currentUser.split(' ')[0]}</h1>
            <p style={styles.appSubtitle}>Choisissez votre stock</p>
          </div>
          <div style={styles.userSelectContainer}>
            {Object.values(REGIONS).map((region) => (
              <button
                key={region.id}
                style={{
                  ...styles.regionButton,
                  borderColor: region.color,
                }}
                onClick={() => {
                  setSelectedRegion(region);
                  setView('categories');
                }}
              >
                <span style={styles.regionFlag}>{region.flag}</span>
                <span style={styles.regionName}>{region.name}</span>
                <span style={styles.regionCount}>{region.bases.length} catégories</span>
              </button>
            ))}
            <button
              style={styles.changeRegionLink}
              onClick={() => {
                setCurrentUser(null);
                setView('user');
              }}
            >
              ← Changer d'utilisateur
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Header
  const Header = ({ title, showBackButton = true, showAdd = false, showHome = true }) => (
    <div style={styles.header}>
      <div style={styles.headerLeft}>
        {showBackButton && (
          <button style={styles.backButton} onClick={goBack}>
            ←
          </button>
        )}
        {showHome && (
          <button style={styles.homeButton} onClick={goHome}>
            🏠
          </button>
        )}
      </div>
      <h1 style={styles.headerTitle}>{title}</h1>
      <div style={styles.headerRight}>
        <button style={styles.guideButton} onClick={() => setShowGuide(true)}>
          📖
        </button>
        <div style={{
          ...styles.onlineIndicator,
          backgroundColor: isOnline ? '#22c55e' : '#ef4444',
        }}>
          {isOnline ? '●' : '○'}
        </div>
        {showAdd && (
          <button style={styles.addButton} onClick={() => setShowAddForm(true)}>
            +
          </button>
        )}
        {!showSearch && view === 'categories' && (
          <button style={styles.searchToggle} onClick={() => { setShowSearch(true); setView('search'); }}>
            🔍
          </button>
        )}
      </div>
    </div>
  );

  // Notification de synchronisation (banner animé)
  const SyncNotification = () => {
    if (!syncNotification) return null;
    
    const bgColor = syncNotification.type === 'syncing' 
      ? '#E91E8C' // Rose Femina
      : syncNotification.type === 'success' 
        ? '#22c55e' 
        : '#f59e0b';
    
    return (
      <div style={{
        ...styles.syncNotification,
        backgroundColor: bgColor,
      }}>
        {syncNotification.type === 'syncing' && (
          <span style={styles.syncSpinner}>⟳</span>
        )}
        {syncNotification.message}
      </div>
    );
  };

  // Modal d'ajout
  const AddModal = () => (
    <div style={styles.modalOverlay} onClick={() => setShowAddForm(false)}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Nouvel article</h3>
        <input
          type="text"
          placeholder="Nom de l'article"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          style={styles.modalInput}
          autoFocus
        />
        <div style={styles.modalButtons}>
          <button style={styles.modalCancel} onClick={() => setShowAddForm(false)}>
            Annuler
          </button>
          <button style={styles.modalConfirm} onClick={addNewItem}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );

  // Modal CRUD - Ajouter un article
  const CrudAddModal = () => (
    <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>➕ Nouvel article</h3>
        <input
          type="text"
          placeholder="Nom de l'article"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={styles.modalInput}
          autoFocus
        />
        <div style={styles.modalButtons}>
          <button style={styles.modalCancel} onClick={() => setShowAddModal(false)}>
            Annuler
          </button>
          <button style={styles.modalConfirm} onClick={confirmAdd}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );

  // Modal CRUD - Modifier un article
  const CrudEditModal = () => (
    <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>✏️ Modifier l'article</h3>
        <input
          type="text"
          placeholder="Nouveau nom"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={styles.modalInput}
          autoFocus
        />
        <div style={styles.modalButtons}>
          <button style={styles.modalCancel} onClick={() => setShowEditModal(false)}>
            Annuler
          </button>
          <button style={styles.modalConfirmEdit} onClick={confirmEdit}>
            Modifier
          </button>
        </div>
      </div>
    </div>
  );

  // Modal CRUD - Supprimer un article (avec warning)
  const CrudDeleteModal = () => (
    <div style={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
      <div style={styles.modalDelete} onClick={(e) => e.stopPropagation()}>
        <div style={styles.deleteWarningIcon}>⚠️</div>
        <h3 style={styles.deleteTitle}>Confirmer la suppression</h3>
        <p style={styles.deleteText}>
          Êtes-vous sûr de vouloir supprimer{' '}
          <strong>{deleteTarget?.fields?.Name}</strong> ?
        </p>
        <p style={styles.deleteWarning}>
          ⚠️ Cette action est irréversible !
        </p>
        <div style={styles.modalButtons}>
          <button style={styles.modalCancel} onClick={() => setShowDeleteModal(false)}>
            Annuler
          </button>
          <button style={styles.modalConfirmDelete} onClick={confirmDelete}>
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>
  );

  // Barre d'actions pour ajouter un article
  const CrudActionBar = () => (
    <div style={styles.crudActionBar}>
      <button style={styles.crudAddButton} onClick={openAddModal}>
        ➕ Ajouter un article
      </button>
    </div>
  );

  // Boutons d'action sur chaque article (éditer/supprimer)
  const ItemActions = ({ record }) => (
    <div style={styles.itemActions} onClick={(e) => e.stopPropagation()}>
      <button 
        style={styles.itemEditBtn} 
        onClick={(e) => { e.stopPropagation(); openEditModal(record); }}
      >
        ✏️
      </button>
      <button 
        style={styles.itemDeleteBtn} 
        onClick={(e) => { e.stopPropagation(); openDeleteModal(record); }}
      >
        🗑️
      </button>
    </div>
  );

  // Modal Guide des bonnes pratiques
  const GuideModal = () => (
    <div style={styles.guideOverlay} onClick={() => setShowGuide(false)}>
      <div style={styles.guideModal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.guideHeader}>
          <h2 style={styles.guideTitle}>📖 Guide des bonnes pratiques</h2>
          <button style={styles.guideClose} onClick={() => setShowGuide(false)}>✕</button>
        </div>
        <div style={styles.guideContent}>
          
          <div style={styles.guideSection}>
            <h3 style={styles.guideSectionTitle}>📸 Photos - IMPORTANT</h3>
            <ul style={styles.guideList}>
              <li>Photos de <strong>bonne qualité</strong>, bien éclairées et cadrées</li>
              <li>Photo <strong>individuelle</strong> de chaque élément</li>
              <li>Photo de la <strong>référence produit</strong> visible</li>
              <li>Photos sous <strong>différents angles</strong> si nécessaire</li>
              <li>Photo de l'élément <strong>rangé dans sa caisse/tiroir</strong></li>
              <li>Photos du <strong>contexte</strong> (autres éléments de la caisse)</li>
              <li>Photographier <strong>chaque couche</strong> de matériel superposé</li>
              <li>⚠️ Les photos groupées seules ne suffisent PAS</li>
            </ul>
          </div>

          <div style={styles.guideSection}>
            <h3 style={styles.guideSectionTitle}>🔢 Comptage</h3>
            <ul style={styles.guideList}>
              <li>Comptage <strong>précis</strong>, jamais approximatif</li>
              <li>Indiquer ce qui est <strong>endommagé</strong> et comment</li>
              <li>Noter les <strong>dates de péremption</strong> des consommables</li>
              <li>Indiquer les <strong>dimensions</strong> (piquets, bâches, moquette...)</li>
              <li>Mettre à jour <strong>en temps réel</strong> sur l'application</li>
            </ul>
          </div>

          <div style={styles.guideSection}>
            <h3 style={styles.guideSectionTitle}>📦 Rangement</h3>
            <ul style={styles.guideList}>
              <li>Caisses <strong>thématiques</strong> (nautique, électrique...)</li>
              <li>Mieux vaut <strong>plus de caisses</strong> que pas assez</li>
              <li>Répertorier le contenu de chaque <strong>palette</strong></li>
              <li>Organisation logique = rangement + rapide du camion</li>
            </ul>
          </div>

          <div style={styles.guideSection}>
            <h3 style={styles.guideSectionTitle}>⚠️ Précautions par matériel</h3>
            <div style={styles.precautionCard}>
              <strong>🏖️ Bâches</strong>
              <p>Balayer → Éponge humide → Sécher au soleil → Plier → Ranger</p>
            </div>
            <div style={styles.precautionCard}>
              <strong>👕 T-shirts</strong>
              <p>Se laver les mains avant de compter et plier</p>
            </div>
            <div style={styles.precautionCard}>
              <strong>🚩 Windflags</strong>
              <p>Démonter les mâts → Attacher ensemble (élastique) → Ranger dans le sac. Voiles pliées séparément par couleur.</p>
            </div>
            <div style={styles.precautionCard}>
              <strong>🏄 Matériel nautique</strong>
              <p>Bodyboards, bouées : rincer à l'eau douce avant rangement</p>
            </div>
          </div>

          <div style={styles.guideSection}>
            <h3 style={styles.guideSectionTitle}>🏷️ Traçabilité</h3>
            <ul style={styles.guideList}>
              <li>Matériel terrain <strong>numéroté</strong></li>
              <li>Noter <strong>qui reçoit quoi</strong> à la distribution</li>
              <li>Vérifier à la <strong>réintégration</strong></li>
              <li>Toujours indiquer <strong>qui a mis à jour</strong> et <strong>quand</strong></li>
            </ul>
          </div>

          <div style={styles.guideSection}>
            <h3 style={styles.guideSectionTitle}>📋 Organisation journée inventaire</h3>
            <ul style={styles.guideList}>
              <li>Définir qui prend les <strong>photos</strong></li>
              <li>Chaque personne transmet <strong>directement</strong> ses comptages</li>
              <li>Organiser l'<strong>espace</strong> par zones (nautique, électrique...)</li>
              <li>Prévoir <strong>téléphone/ordi</strong> avec l'app</li>
              <li>⚠️ Pas de précipitation = moins d'erreurs !</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );

  // Modal d'upload et analyse de photo
  const PhotoUploadModal = () => (
    <div style={styles.photoModalOverlay} onClick={() => {
      setShowPhotoUpload(false);
      setCompressedPhoto(null);
      setPhotoAnalysis(null);
    }}>
      <div style={styles.photoModal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.photoModalHeader}>
          <h2 style={styles.photoModalTitle}>📸 Analyse de la photo</h2>
          <button style={styles.guideClose} onClick={() => {
            setShowPhotoUpload(false);
            setCompressedPhoto(null);
            setPhotoAnalysis(null);
          }}>✕</button>
        </div>
        
        <div style={styles.photoModalContent}>
          {/* Aperçu de la photo */}
          {compressedPhoto && (
            <div style={styles.photoPreviewContainer}>
              <img src={compressedPhoto.dataUrl} alt="Aperçu" style={styles.photoPreview} />
            </div>
          )}
          
          {/* Infos de compression */}
          {compressedPhoto && (
            <div style={styles.compressionInfo}>
              <span style={styles.compressionBadge}>
                📉 Compressée: {PhotoUtils.formatSize(compressedPhoto.originalSize)} → {PhotoUtils.formatSize(compressedPhoto.compressedSize)}
              </span>
              <span style={styles.compressionSaved}>
                (-{compressedPhoto.compressionRatio}%)
              </span>
            </div>
          )}
          
          {/* Résultats de l'analyse */}
          {photoAnalysis && (
            <div style={styles.analysisResults}>
              <div style={styles.analysisHeader}>
                <span style={styles.analysisTitle}>Analyse qualité</span>
                <span style={{
                  ...styles.analysisScore,
                  backgroundColor: photoAnalysis.overallScore >= 70 ? '#dcfce7' : photoAnalysis.overallScore >= 50 ? '#fef3c7' : '#fee2e2',
                  color: photoAnalysis.overallScore >= 70 ? '#166534' : photoAnalysis.overallScore >= 50 ? '#92400e' : '#dc2626',
                }}>
                  {photoAnalysis.overallScore}/100
                </span>
              </div>
              
              {/* Critères individuels */}
              <div style={styles.analysisCriteria}>
                {/* Netteté */}
                <div style={{
                  ...styles.criterionItem,
                  backgroundColor: photoAnalysis.sharpness.status === 'ok' ? '#f0fdf4' : photoAnalysis.sharpness.status === 'slight' ? '#fffbeb' : '#fef2f2',
                }}>
                  <span style={styles.criterionIcon}>
                    {photoAnalysis.sharpness.status === 'ok' ? '✓' : photoAnalysis.sharpness.status === 'slight' ? '⚠️' : '✗'}
                  </span>
                  <span style={styles.criterionText}>{photoAnalysis.sharpness.message}</span>
                </div>
                
                {/* Luminosité */}
                <div style={{
                  ...styles.criterionItem,
                  backgroundColor: photoAnalysis.brightness.status === 'ok' ? '#f0fdf4' : '#fffbeb',
                }}>
                  <span style={styles.criterionIcon}>
                    {photoAnalysis.brightness.status === 'ok' ? '✓' : '⚠️'}
                  </span>
                  <span style={styles.criterionText}>{photoAnalysis.brightness.message}</span>
                </div>
                
                {/* Contraste */}
                <div style={{
                  ...styles.criterionItem,
                  backgroundColor: photoAnalysis.contrast.status === 'ok' ? '#f0fdf4' : photoAnalysis.contrast.status === 'medium' ? '#fffbeb' : '#fef2f2',
                }}>
                  <span style={styles.criterionIcon}>
                    {photoAnalysis.contrast.status === 'ok' ? '✓' : '⚠️'}
                  </span>
                  <span style={styles.criterionText}>{photoAnalysis.contrast.message}</span>
                </div>
                
                {/* Résolution */}
                <div style={{
                  ...styles.criterionItem,
                  backgroundColor: photoAnalysis.resolution.status === 'ok' ? '#f0fdf4' : '#fef2f2',
                }}>
                  <span style={styles.criterionIcon}>
                    {photoAnalysis.resolution.status === 'ok' ? '✓' : '✗'}
                  </span>
                  <span style={styles.criterionText}>
                    {photoAnalysis.resolution.message} ({photoAnalysis.resolution.width}x{photoAnalysis.resolution.height})
                  </span>
                </div>
              </div>
              
              {/* Message global */}
              {!photoAnalysis.isAcceptable && (
                <div style={styles.analysisWarning}>
                  ⚠️ Photo de qualité insuffisante. Recommandation: reprendre la photo avec plus de lumière et en tenant l'appareil stable.
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Boutons d'action */}
        <div style={styles.photoModalActions}>
          <label style={styles.photoRetakeButton}>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setPhotoUploading(true);
                try {
                  const compressed = await PhotoUtils.compressImage(file, 1200, 0.8);
                  setCompressedPhoto(compressed);
                  const analysis = await PhotoUtils.analyzeQuality(compressed.dataUrl);
                  setPhotoAnalysis(analysis);
                } catch (err) {
                  alert('Erreur lors du traitement');
                }
                setPhotoUploading(false);
              }}
              style={{ display: 'none' }}
            />
            🔄 Reprendre
          </label>
          <button
            style={{
              ...styles.photoConfirmButton,
              opacity: photoUploading ? 0.7 : (photoAnalysis?.isAcceptable ? 1 : 0.5),
            }}
            onClick={confirmPhotoUpload}
            disabled={photoUploading}
          >
            {photoUploading 
              ? '⏳ Upload en cours...' 
              : (photoAnalysis?.isAcceptable ? '✓ Valider & Uploader' : '⚠️ Valider quand même')
            }
          </button>
        </div>
      </div>
    </div>
  );

  // Vue Recherche globale
  if (view === 'search') {
    return (
      <div style={styles.container}>
        <Header title="Recherche" />
        <div style={styles.content}>
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            autoFocus
          />
          <p style={styles.searchHint}>
            Tapez pour rechercher dans toutes les catégories
          </p>
        </div>
        <UserBar user={currentUser} onLogout={() => setCurrentUser(null)} pendingCount={pendingChanges.length} onSync={syncPendingChanges} isOnline={isOnline}  />
        {showAddForm && <AddModal />}
        {showGuide && <GuideModal />}
      </div>
    );
  }

  // Vue Catégories (bases)
  if (view === 'categories') {
    return (
      <div style={styles.container}>
        <Header title={`Stock ${selectedRegion.name}`} showBackButton={true} />
        <SyncNotification />
        <div style={styles.content}>
          {error && <div style={styles.errorBanner}>{error}</div>}
          <div style={styles.categoryGrid}>
            {selectedRegion.bases.map((base) => (
              <button
                key={base.id}
                style={{ ...styles.categoryCard, borderLeft: `4px solid ${base.color}` }}
                onClick={() => selectBase(base)}
              >
                <span style={styles.categoryIcon}>{base.icon}</span>
                <span style={styles.categoryName}>{base.name}</span>
                <span style={styles.categoryArrow}>›</span>
              </button>
            ))}
          </div>
        </div>
        <UserBar user={currentUser} onLogout={() => setCurrentUser(null)} pendingCount={pendingChanges.length} onSync={syncPendingChanges} isOnline={isOnline} isSyncing={isSyncing} />
        {showGuide && <GuideModal />}
      </div>
    );
  }

  // Vue Tables (sous-catégories)
  if (view === 'tables' && selectedBase) {
    return (
      <div style={styles.container}>
        <Header title={selectedBase.name} />
        <SyncNotification />
        <div style={styles.content}>
          {loading && <div style={styles.loadingBar}>Chargement...</div>}
          {error && <div style={styles.errorBanner}>{error}</div>}
          
          <div style={styles.tableList}>
            {tables.map((table) => (
              <button
                key={table.id}
                style={styles.tableCard}
                onClick={() => selectTable(table)}
              >
                <span style={styles.tableName}>{table.name}</span>
                <span style={styles.tableArrow}>›</span>
              </button>
            ))}
          </div>
        </div>
        <UserBar user={currentUser} onLogout={() => setCurrentUser(null)} pendingCount={pendingChanges.length} onSync={syncPendingChanges} isOnline={isOnline} isSyncing={isSyncing} />
        {showGuide && <GuideModal />}
      </div>
    );
  }

  // Vue Items (articles)
  if (view === 'items' && selectedBase && selectedTable) {
    return (
      <div style={styles.container}>
        <Header title={selectedTable.name} showAdd={true} />
        <SyncNotification />
        <div style={styles.content}>
          {loading && <div style={styles.loadingBar}>Chargement...</div>}
          {error && <div style={styles.errorBanner}>{error}</div>}
          
          {/* Barre d'action pour ajouter un article */}
          <CrudActionBar />
          
          <div style={styles.itemList}>
            {records.map((record) => {
              const qty = parseInt(record.fields?.CORISCA) || 0;
              const etat = record.fields?.Etat;
              return (
                <div key={record.id} style={styles.itemCardWrapper}>
                  <button
                    style={styles.itemCard}
                    onClick={() => selectRecord(record)}
                  >
                    <div style={styles.itemInfo}>
                      <span style={styles.itemName}>{record.fields?.Name || 'Sans nom'}</span>
                      {record.fields?.Rangement && (
                        <span style={styles.itemLocation}>📍 {record.fields.Rangement}</span>
                      )}
                      {etat === 'Endommagé' && <span style={styles.damagedTag}>⚠️ Endommagé</span>}
                      {etat === 'À vérifier' && <span style={styles.checkTag}>❓ À vérifier</span>}
                      {record._pending && <span style={styles.pendingTag}>En attente</span>}
                    </div>
                    <div style={{
                      ...styles.quantityBadge,
                      backgroundColor: qty === 0 ? '#fee2e2' : qty < 5 ? '#fef3c7' : '#dcfce7',
                      color: qty === 0 ? '#dc2626' : qty < 5 ? '#92400e' : '#16a34a',
                    }}>
                      {qty}
                    </div>
                  </button>
                  <ItemActions record={record} />
                </div>
              );
            })}
            {!loading && records.length === 0 && (
              <p style={styles.emptyState}>Aucun article dans cette catégorie</p>
            )}
          </div>
        </div>
        {showAddForm && <AddModal />}
        {showGuide && <GuideModal />}
        {showAddModal && <CrudAddModal />}
        {showEditModal && <CrudEditModal />}
        {showDeleteModal && <CrudDeleteModal />}
        <UserBar user={currentUser} onLogout={() => setCurrentUser(null)} pendingCount={pendingChanges.length} onSync={syncPendingChanges} isOnline={isOnline} isSyncing={isSyncing} />
      </div>
    );
  }

  // Vue Détail d'un article
  if (view === 'detail' && selectedRecord) {
    const fields = selectedRecord.fields || {};
    const qty = parseInt(fields.CORISCA) || 0;
    const photo = fields['Pièces jointes']?.[0]?.url;

    // Gestionnaire de sélection de photo
    const handlePhotoSelect = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setPhotoUploading(true);
      setPhotoAnalysis(null);
      setCompressedPhoto(null);
      
      try {
        // Compression
        const compressed = await PhotoUtils.compressImage(file, 1200, 0.8);
        setCompressedPhoto(compressed);
        
        // Analyse qualité
        const analysis = await PhotoUtils.analyzeQuality(compressed.dataUrl);
        setPhotoAnalysis(analysis);
        
        setShowPhotoUpload(true);
      } catch (err) {
        alert('Erreur lors du traitement de la photo');
      }
      setPhotoUploading(false);
    };

    // Confirmer l'upload de la photo
    const confirmPhotoUpload = async () => {
      if (!compressedPhoto) return;
      
      // Vérifier que Cloudinary est configuré
      if (CLOUDINARY_CLOUD_NAME === 'VOTRE_CLOUD_NAME') {
        alert('⚠️ Cloudinary non configuré!\n\nModifiez CLOUDINARY_CLOUD_NAME dans le code avec votre Cloud Name Cloudinary.');
        return;
      }
      
      setPhotoUploading(true);
      
      try {
        // 1. Upload vers Cloudinary
        const cloudinaryResult = await PhotoUtils.uploadToCloudinary(
          compressedPhoto.blob,
          `${selectedRecord.id}_${Date.now()}`
        );
        
        // 2. Mettre à jour Airtable avec l'URL de la photo
        // Airtable attend un array d'objets avec une propriété "url"
        const attachments = [{ url: cloudinaryResult.url }];
        
        // Récupérer les photos existantes et ajouter la nouvelle
        const existingPhotos = selectedRecord.fields['Pièces jointes'] || [];
        const allPhotos = [...existingPhotos.map(p => ({ url: p.url })), ...attachments];
        
        await airtableAPI.updateRecord(
          selectedBase.id,
          selectedTable.id,
          selectedRecord.id,
          { 'Pièces jointes': allPhotos }
        );
        
        // 3. Mettre à jour le state local
        setSelectedRecord(prev => ({
          ...prev,
          fields: {
            ...prev.fields,
            'Pièces jointes': [...(prev.fields['Pièces jointes'] || []), { url: cloudinaryResult.url }],
          }
        }));
        
        // 4. Marquer la checklist photo
        updateRecord(selectedRecord.id, 'photo_individuel', true);
        
        setShowPhotoUpload(false);
        setCompressedPhoto(null);
        setPhotoAnalysis(null);
        
        alert('✓ Photo uploadée avec succès!');
        
      } catch (err) {
        console.error('Erreur upload:', err);
        alert('❌ Erreur lors de l\'upload.\n\nVérifiez votre configuration Cloudinary et votre connexion internet.');
      }
      
      setPhotoUploading(false);
    };

    return (
      <div style={styles.container}>
        <Header title="Détail" />
        <div style={styles.content}>
          <div style={styles.detailCard}>
            {/* Photo avec bouton d'ajout */}
            <div style={styles.photoContainer}>
              {photo ? (
                <img src={photo} alt={fields.Name} style={styles.photo} />
              ) : (
                <div style={styles.photoPlaceholder}>
                  <span style={styles.cameraIcon}>📷</span>
                  <span style={styles.photoText}>Pas de photo</span>
                </div>
              )}
              <label style={styles.photoAddButton}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />
                {photoUploading ? '⏳' : '📸 Ajouter'}
              </label>
            </div>

            {/* Nom */}
            <h2 style={styles.detailName}>{fields.Name || 'Sans nom'}</h2>
            {fields.Titre && <p style={styles.detailSubtitle}>{fields.Titre}</p>}

            {/* Quantité */}
            <div style={styles.quantitySection}>
              <span style={styles.sectionLabel}>Quantité</span>
              <div style={styles.quantityControls}>
                <button
                  style={styles.qtyButton}
                  onClick={() => updateRecord(selectedRecord.id, 'CORISCA', String(Math.max(0, qty - 1)))}
                >
                  −
                </button>
                <span style={styles.qtyValue}>{qty}</span>
                <button
                  style={styles.qtyButton}
                  onClick={() => updateRecord(selectedRecord.id, 'CORISCA', String(qty + 1))}
                >
                  +
                </button>
              </div>
            </div>

            {/* État du matériel */}
            <div style={styles.fieldSection}>
              <span style={styles.sectionLabel}>🔍 État</span>
              <div style={styles.stateButtons}>
                {['Bon', 'Endommagé', 'À vérifier'].map((state) => (
                  <button
                    key={state}
                    style={{
                      ...styles.stateButton,
                      backgroundColor: fields.Etat === state 
                        ? (state === 'Bon' ? '#22c55e' : state === 'Endommagé' ? '#ef4444' : '#f59e0b')
                        : '#f1f5f9',
                      color: fields.Etat === state ? '#fff' : '#64748b',
                    }}
                    onClick={() => updateRecord(selectedRecord.id, 'Etat', state)}
                  >
                    {state === 'Bon' ? '✓' : state === 'Endommagé' ? '✗' : '?'} {state}
                  </button>
                ))}
              </div>
            </div>

            {/* Description des dommages (si endommagé) */}
            {fields.Etat === 'Endommagé' && (
              <div style={styles.fieldSection}>
                <span style={styles.sectionLabel}>⚠️ Description des dommages</span>
                <textarea
                  style={{...styles.textareaField, borderColor: '#ef4444'}}
                  value={fields.Dommages || ''}
                  onChange={(e) => updateRecord(selectedRecord.id, 'Dommages', e.target.value)}
                  placeholder="Décrivez les dommages constatés..."
                  rows={2}
                />
              </div>
            )}

            {/* Dimensions */}
            <div style={styles.fieldSection}>
              <span style={styles.sectionLabel}>📐 Dimensions</span>
              <input
                type="text"
                style={styles.textInput}
                value={fields.Dimensions || ''}
                onChange={(e) => updateRecord(selectedRecord.id, 'Dimensions', e.target.value)}
                placeholder="Ex: 50x40cm, 2m, 10L..."
              />
            </div>

            {/* Date de péremption */}
            <div style={styles.fieldSection}>
              <span style={styles.sectionLabel}>📅 Date de péremption</span>
              <input
                type="date"
                style={styles.textInput}
                value={fields.Peremption || ''}
                onChange={(e) => updateRecord(selectedRecord.id, 'Peremption', e.target.value)}
              />
            </div>

            {/* Localisation */}
            <div style={styles.fieldSection}>
              <span style={styles.sectionLabel}>📍 Rangement (caisse/tiroir)</span>
              <input
                type="text"
                style={styles.textInput}
                value={fields.Rangement || ''}
                onChange={(e) => updateRecord(selectedRecord.id, 'Rangement', e.target.value)}
                placeholder="Ex: Caisse nautique, Palette 3..."
              />
            </div>

            {/* Numéro d'inventaire */}
            <div style={styles.fieldSection}>
              <span style={styles.sectionLabel}>🏷️ Numéro d'inventaire</span>
              <input
                type="text"
                style={styles.textInput}
                value={fields.NumeroInventaire || ''}
                onChange={(e) => updateRecord(selectedRecord.id, 'NumeroInventaire', e.target.value)}
                placeholder="Numéro unique..."
              />
            </div>

            {/* Commentaire */}
            <div style={styles.fieldSection}>
              <span style={styles.sectionLabel}>💬 Commentaire</span>
              <textarea
                style={styles.textareaField}
                value={fields.Commentaire || ''}
                onChange={(e) => updateRecord(selectedRecord.id, 'Commentaire', e.target.value)}
                placeholder="Notes, précautions particulières..."
                rows={3}
              />
            </div>

            {/* Checklist Photos */}
            <div style={styles.photoChecklist}>
              <span style={styles.sectionLabel}>📸 Checklist Photos</span>
              <div style={styles.checklistItems}>
                {[
                  { key: 'photo_individuel', label: 'Photo individuelle' },
                  { key: 'photo_reference', label: 'Référence produit visible' },
                  { key: 'photo_angles', label: 'Différents angles' },
                  { key: 'photo_range', label: 'Rangé dans sa caisse' },
                  { key: 'photo_contexte', label: 'Contexte (autres éléments caisse)' },
                ].map((item) => (
                  <button
                    key={item.key}
                    style={{
                      ...styles.checklistItem,
                      backgroundColor: fields[item.key] ? '#dcfce7' : '#fff',
                      borderColor: fields[item.key] ? '#22c55e' : '#e2e8f0',
                    }}
                    onClick={() => updateRecord(selectedRecord.id, item.key, !fields[item.key])}
                  >
                    <span style={styles.checklistCheck}>
                      {fields[item.key] ? '✓' : '○'}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date de mise à jour */}
            <div style={styles.updateInfo}>
              <div>Mis à jour par : <strong>{fields['Enregistré par'] || currentUser}</strong></div>
              {fields.Date && <div>Le : {fields.Date}</div>}
            </div>

            {/* Bouton supprimer */}
            <button
              style={styles.deleteButton}
              onClick={() => deleteItem(selectedRecord.id)}
            >
              🗑️ Supprimer cet article
            </button>
          </div>
        </div>
        <UserBar user={currentUser} onLogout={() => setCurrentUser(null)} pendingCount={pendingChanges.length} onSync={syncPendingChanges} isOnline={isOnline} isSyncing={isSyncing} />
        <SyncNotification />
        {showGuide && <GuideModal />}
        {showPhotoUpload && <PhotoUploadModal />}
      </div>
    );
  }

  return null;
}

// Barre utilisateur
function UserBar({ user, onLogout, pendingCount, onSync, isOnline, isSyncing }) {
  return (
    <div style={styles.userBar}>
      <div style={styles.userInfo}>
        <span style={styles.userAvatar}>👤</span>
        <span style={styles.userName}>{user}</span>
      </div>
      {pendingCount > 0 && (
        <button 
          style={{
            ...styles.pendingBadge,
            opacity: isSyncing ? 0.7 : 1,
          }} 
          onClick={onSync}
          disabled={!isOnline || isSyncing}
        >
          {isSyncing ? '⟳ Sync...' : `${pendingCount} en attente`} {isOnline && !isSyncing && '↻'}
        </button>
      )}
      <button style={styles.logoutButton} onClick={onLogout}>
        Changer
      </button>
    </div>
  );
}

// Styles
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    maxWidth: '500px',
    margin: '0 auto',
    backgroundColor: '#f8fafc',
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  userSelectScreen: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: '24px',
    background: 'linear-gradient(180deg, #FCE4F2 0%, #E0FAFA 100%)', // Rose vers Turquoise
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  logo: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  appTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#E91E8C', // Rose Femina
    margin: '0 0 8px 0',
  },
  appSubtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: 0,
  },
  userSelectContainer: {
    width: '100%',
  },
  userSelectLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '16px',
    textAlign: 'center',
  },
  userButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '18px 20px',
    marginBottom: '12px',
    backgroundColor: '#fff',
    border: '2px solid #E91E8C', // Rose Femina
    borderRadius: '16px',
    fontSize: '17px',
    fontWeight: '500',
    color: '#1e293b',
    cursor: 'pointer',
  },
  userIcon: {
    fontSize: '24px',
  },
  regionButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '24px 20px',
    marginBottom: '16px',
    backgroundColor: '#fff',
    border: '3px solid #00CED1', // Turquoise Femina
    borderRadius: '20px',
    fontSize: '17px',
    fontWeight: '500',
    color: '#1e293b',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  regionFlag: {
    fontSize: '48px',
  },
  regionName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
  },
  regionCount: {
    fontSize: '14px',
    color: '#64748b',
  },
  changeRegionLink: {
    width: '100%',
    padding: '12px',
    marginTop: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '14px',
    color: '#64748b',
    cursor: 'pointer',
    textAlign: 'center',
  },
  regionBadge: {
    padding: '4px 8px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    marginRight: '4px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    minWidth: '80px',
  },
  backButton: {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '20px',
    color: '#E91E8C', // Rose Femina
    fontWeight: '600',
    cursor: 'pointer',
  },
  homeButton: {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
  },
  headerSpacer: {
    width: '80px',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '80px',
    justifyContent: 'flex-end',
  },
  onlineIndicator: {
    fontSize: '14px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  addButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#E91E8C', // Rose Femina
    color: '#fff',
    fontSize: '20px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchToggle: {
    padding: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
    paddingBottom: '80px',
  },
  loadingBar: {
    textAlign: 'center',
    padding: '12px',
    backgroundColor: '#FCE4F2', // Rose clair Femina
    color: '#E91E8C', // Rose Femina
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  errorBanner: {
    textAlign: 'center',
    padding: '12px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  categoryGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  categoryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    textAlign: 'left',
  },
  categoryIcon: {
    fontSize: '28px',
  },
  categoryName: {
    flex: 1,
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
  },
  categoryArrow: {
    fontSize: '24px',
    color: '#94a3b8',
  },
  tableList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  tableCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 20px',
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    textAlign: 'left',
    width: '100%',
    marginBottom: '10px',
  },
  tableName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
  },
  tableArrow: {
    fontSize: '24px',
    color: '#E91E8C', // Rose Femina
  },
  tableList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  itemCard: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 18px',
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    textAlign: 'left',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemLocation: {
    fontSize: '13px',
    color: '#64748b',
  },
  pendingTag: {
    fontSize: '11px',
    color: '#f59e0b',
    fontWeight: '500',
  },
  quantityBadge: {
    padding: '8px 14px',
    borderRadius: '10px',
    fontSize: '18px',
    fontWeight: '700',
    marginLeft: '12px',
  },
  emptyState: {
    textAlign: 'center',
    color: '#64748b',
    padding: '40px 20px',
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  photoContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16/10',
    backgroundColor: '#f1f5f9',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  cameraIcon: {
    fontSize: '48px',
    opacity: 0.5,
  },
  photoText: {
    fontSize: '14px',
    color: '#64748b',
  },
  detailName: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 4px 0',
  },
  detailSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 24px 0',
  },
  quantitySection: {
    marginBottom: '24px',
  },
  sectionLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
    marginBottom: '12px',
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
  },
  qtyButton: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    border: '2px solid #E91E8C', // Rose Femina
    backgroundColor: '#fff',
    fontSize: '32px',
    fontWeight: '600',
    color: '#E91E8C', // Rose Femina
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#1e293b',
    minWidth: '80px',
    textAlign: 'center',
  },
  fieldSection: {
    marginBottom: '20px',
  },
  textInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    backgroundColor: '#fff',
    color: '#1e293b',
    boxSizing: 'border-box',
  },
  textareaField: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    backgroundColor: '#fff',
    color: '#1e293b',
    resize: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  updateInfo: {
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: '20px',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
  },
  deleteButton: {
    width: '100%',
    padding: '14px',
    marginTop: '20px',
    backgroundColor: '#fee2e2',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    color: '#dc2626',
    cursor: 'pointer',
    fontWeight: '500',
  },
  searchInput: {
    width: '100%',
    padding: '16px 20px',
    fontSize: '17px',
    border: '2px solid #e2e8f0',
    borderRadius: '14px',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    marginBottom: '12px',
  },
  searchHint: {
    fontSize: '14px',
    color: '#94a3b8',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 16px 0',
  },
  modalInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    marginBottom: '16px',
    boxSizing: 'border-box',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
  },
  modalCancel: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    color: '#64748b',
    cursor: 'pointer',
    fontWeight: '500',
  },
  modalConfirm: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#E91E8C', // Rose Femina
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
  },
  // Styles CRUD modals
  modalConfirmEdit: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#00CED1', // Turquoise Femina
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
  },
  modalConfirmDelete: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#EF4444',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
  },
  modalDelete: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '24px',
    width: '90%',
    maxWidth: '340px',
    textAlign: 'center',
  },
  deleteWarningIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  deleteTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 12px 0',
  },
  deleteText: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 8px 0',
  },
  deleteWarning: {
    fontSize: '13px',
    color: '#EF4444',
    backgroundColor: '#fee2e2',
    padding: '8px 12px',
    borderRadius: '8px',
    margin: '0 0 20px 0',
  },
  crudActionBar: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  crudAddButton: {
    padding: '12px 24px',
    backgroundColor: '#E91E8C', // Rose Femina
    color: '#fff',
    border: 'none',
    borderRadius: '25px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(233, 30, 140, 0.3)',
  },
  tableCardWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  itemCardWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  itemActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  itemEditBtn: {
    padding: '8px',
    backgroundColor: '#E0FAFA',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  itemDeleteBtn: {
    padding: '8px',
    backgroundColor: '#fee2e2',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  damagedTag: {
    fontSize: '11px',
    color: '#EF4444',
    backgroundColor: '#fee2e2',
    padding: '2px 6px',
    borderRadius: '4px',
    marginTop: '2px',
    display: 'inline-block',
  },
  checkTag: {
    fontSize: '11px',
    color: '#F59E0B',
    backgroundColor: '#fef3c7',
    padding: '2px 6px',
    borderRadius: '4px',
    marginTop: '2px',
    display: 'inline-block',
  },
  userBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e2e8f0',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  userAvatar: {
    fontSize: '20px',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
  },
  pendingBadge: {
    fontSize: '12px',
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    padding: '6px 12px',
    borderRadius: '20px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
  },
  logoutButton: {
    padding: '8px 14px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
    fontWeight: '500',
  },
  // Styles pour la notification de synchronisation
  syncNotification: {
    padding: '12px 20px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    animation: 'slideDown 0.3s ease-out',
  },
  syncSpinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
    fontSize: '16px',
  },
  // Nouveaux styles pour le guide et les fonctionnalités avancées
  guideButton: {
    padding: '6px 10px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
  },
  guideOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
    padding: '16px',
  },
  guideModal: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '85vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  guideHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#FCE4F2', // Rose clair Femina
  },
  guideTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#E91E8C', // Rose Femina
    margin: 0,
  },
  guideClose: {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '20px',
    color: '#64748b',
    cursor: 'pointer',
  },
  guideContent: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  guideSection: {
    marginBottom: '24px',
  },
  guideSectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#E91E8C', // Rose Femina
    margin: '0 0 12px 0',
  },
  guideList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#475569',
    fontSize: '14px',
    lineHeight: '1.8',
  },
  precautionCard: {
    backgroundColor: '#fef3c7',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '10px',
    fontSize: '14px',
    color: '#92400e',
  },
  // Styles pour état du matériel
  stateButtons: {
    display: 'flex',
    gap: '8px',
  },
  stateButton: {
    flex: 1,
    padding: '12px 8px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  // Styles pour checklist photos
  photoChecklist: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
  },
  checklistItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    fontSize: '14px',
    color: '#475569',
    cursor: 'pointer',
    textAlign: 'left',
  },
  checklistCheck: {
    fontSize: '16px',
    fontWeight: '600',
  },
  // ==========================================
  // STYLES MODULE PHOTO
  // ==========================================
  photoAddButton: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    padding: '10px 16px',
    backgroundColor: '#00CED1', // Turquoise Femina
    color: '#fff',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 206, 209, 0.4)',
  },
  photoModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 400,
    padding: '16px',
  },
  photoModal: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '450px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  photoModalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
  },
  photoModalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  photoModalContent: {
    padding: '16px 20px',
    overflowY: 'auto',
    flex: 1,
  },
  photoPreviewContainer: {
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '16px',
    backgroundColor: '#f1f5f9',
  },
  photoPreview: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  compressionInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  compressionBadge: {
    padding: '6px 12px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  compressionSaved: {
    fontSize: '12px',
    color: '#22c55e',
    fontWeight: '600',
  },
  analysisResults: {
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    padding: '16px',
  },
  analysisHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  analysisTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
  },
  analysisScore: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '700',
  },
  analysisCriteria: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  criterionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '10px',
  },
  criterionIcon: {
    fontSize: '16px',
  },
  criterionText: {
    fontSize: '13px',
    color: '#475569',
  },
  analysisWarning: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#fef3c7',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#92400e',
    textAlign: 'center',
  },
  photoModalActions: {
    display: 'flex',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid #e2e8f0',
  },
  photoRetakeButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    color: '#64748b',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
  },
  photoConfirmButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#E91E8C', // Rose Femina
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
