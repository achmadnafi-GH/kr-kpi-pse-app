import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  setDoc, 
  doc,
  deleteDoc
} from 'firebase/firestore';
import { 
  Users, BarChart3, FileEdit, Save, AlertCircle, TrendingUp, Award, 
  Activity, PieChart, UsersRound, ShieldCheck, UserCircle, Crown, X, 
  FileText, Search, LogOut, Briefcase, Plus, ListTodo, RefreshCw, Trash2, 
  Download, Upload
} from 'lucide-react';

// --- INIT FIREBASE (Siap untuk Netlify & Canvas) ---
let app, auth, db;

try {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) {
    app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    });
  } 
  else if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    app = initializeApp(JSON.parse(__firebase_config));
  }

  if (app) {
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.warn('Firebase tidak terkonfigurasi. Berjalan dalam mode offline.', error);
}

// Fungsi bantu database (Mengikuti aturan canvas/Netlify)
const getCollectionRef = (colName) => {
  if (typeof __app_id !== 'undefined') return collection(db, 'artifacts', __app_id, 'public', 'data', colName);
  return collection(db, colName); 
};
const getDocRef = (colName, id) => {
  if (typeof __app_id !== 'undefined') return doc(db, 'artifacts', __app_id, 'public', 'data', colName, id);
  return doc(db, colName, id); 
};

// --- DATA & KONFIGURASI ---
const PSE_NAMES = [
  'Dayat', 'Yanuar', 'Arfindo', 'Damardjati', 'Eko Kuncoro', 
  'Fakhri', 'Ghazy', 'Pankaj', 'Syamil', 'Hakim', 'Tyan', 'Reisya'
];

const SCORING_RULES = [
  { min: 120, score: 10, label: 'Outstanding', color: 'bg-green-100 text-green-800', barColor: 'bg-green-500' },
  { min: 101, score: 8, label: 'Exceeds Exp.', color: 'bg-blue-100 text-blue-800', barColor: 'bg-blue-500' },
  { min: 85, score: 6, label: 'Meets Exp.', color: 'bg-yellow-100 text-yellow-800', barColor: 'bg-yellow-500' },
  { min: 70, score: 4, label: 'Below Exp.', color: 'bg-orange-100 text-orange-800', barColor: 'bg-orange-500' },
  { min: 0, score: 2, label: 'Unsatisfactory', color: 'bg-red-100 text-red-800', barColor: 'bg-red-500' }
];

const METRICS_CONFIG = {
  kuantitatif: {
    title: 'A. KPI Kuantitatif', weight: 0.40, type: 'auto',
    desc: 'Berdasarkan data operasional. Bisa disinkronisasi dari Project Tracking.',
    items: [
      { id: 'q1', label: 'Pipeline Generation', target: 5, unit: 'Opp/bln' },
      { id: 'q2', label: 'Win Rate', target: 30, unit: '%' },
      { id: 'q3', label: 'Proposal / RFP Submitted', target: 4, unit: '/bln' },
      { id: 'q4', label: 'Demo / PoC Conducted', target: 3, unit: '/bln' }
    ]
  },
  kualitatif: {
    title: 'B. KPI Kualitatif', weight: 0.20, type: 'manual',
    desc: 'Penilaian objektif 360° dari 3 sudut pandang.',
    items: [
      { id: 'k1', label: 'Kualitas Presentasi & Solusi' },
      { id: 'k2', label: 'Kualitas Dokumen (HLD/LLD)' }
    ]
  },
  pengembangan: {
    title: 'C. Pengembangan Diri', weight: 0.20, type: 'manual',
    desc: 'Penilaian objektif 360° dari 3 sudut pandang.',
    items: [
      { id: 'p1', label: 'Sertifikasi' },
      { id: 'p2', label: 'Training / Workshop' },
      { id: 'p3', label: 'Internal Knowledge Sharing' }
    ]
  },
  kultur: {
    title: 'D. KPI Kultur', weight: 0.20, type: 'manual',
    desc: 'Penilaian objektif 360° dari 3 sudut pandang.',
    items: [
      { id: 'c1', label: 'Responsivitas & Komunikasi' },
      { id: 'c2', label: 'Disiplin & Kehadiran' },
      { id: 'c3', label: 'Attitude & Etika Kerja' }
    ]
  }
};

const INITIAL_EVALUATIONS = [
  { id: '1', name: 'Dayat', spec: 'Network & CyberSec', scores: { kuantitatif: 8.14, kualitatif: 8.40, pengembangan: 2.00, kultur: 8.10 }, finalScore: 6.96, status: 'Meets Exp.', submittedRoles: ['manager'], rawMetrics: {} },
  { id: '6', name: 'Fakhri', spec: 'UC', scores: { kuantitatif: 8.54, kualitatif: 8.72, pengembangan: 9.16, kultur: 9.04 }, finalScore: 8.80, status: 'Exceeds Exp.', submittedRoles: ['manager', 'peer'], rawMetrics: {} }
];

const INITIAL_PROJECTS = [
  { id: 'p1', client: 'Kejaksaan Agung', priority: 'Low', pm: 'Syamil', backup: 'Yanuar', status: 'Not started', phase: 'Penawaran & Proposal', solution: 'UC' },
  { id: 'p2', client: 'Adhi Cakra', priority: 'Low', pm: 'Damardjati', backup: 'Fakhri', status: 'Pending', phase: 'PoC & Testing', solution: 'UC' },
  { id: 'p3', client: 'Traveloka', priority: 'Low', pm: 'Syamil', backup: 'Hakim', status: 'Completed', phase: 'Instalasi', solution: 'UC' },
  { id: 'p4', client: 'CPI', priority: 'Low', pm: 'Damardjati', backup: 'Pankaj', status: 'Completed', phase: 'PoC & Testing', solution: 'UC' },
  { id: 'p5', client: 'Pernod Richard', priority: 'Low', pm: 'Dayat', backup: 'Pankaj', status: 'In progress', phase: 'Instalasi', solution: 'Network & CyberSec' },
  { id: 'p6', client: 'Pepsico - MSPC', priority: 'Low', pm: 'Pankaj', backup: 'Hakim', status: 'In progress', phase: 'Penawaran & Proposal', solution: 'UC' },
];

const ROLE_CONFIG = {
  manager: { id: 'manager', label: 'Manager', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50 border-blue-200', scoreKey: 'skorManager', noteKey: 'catatanManager' },
  peer: { id: 'peer', label: 'Rekan / Divisi', icon: UserCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', scoreKey: 'skorPeer', noteKey: 'catatanPeer' },
  top: { id: 'top', label: 'Top Management', icon: Crown, color: 'text-purple-600 bg-purple-50 border-purple-200', scoreKey: 'skorTop', noteKey: 'catatanTop' },
};

// --- FUNGSI PARSER CSV NATIVE (Bebas dari dependensi external) ---
function parseCSV(str) {
  const arr = [];
  let quote = false;
  let col = 0, row = 0;
  for (let c = 0; c < str.length; c++) {
      let cc = str[c], nc = str[c+1];
      arr[row] = arr[row] || [];
      arr[row][col] = arr[row][col] || '';
      if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
      if (cc == '"') { quote = !quote; continue; }
      if (cc == ',' && !quote) { ++col; continue; }
      if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
      if (cc == '\n' && !quote) { ++row; col = 0; continue; }
      if (cc == '\r' && !quote) { ++row; col = 0; continue; }
      arr[row][col] += cc;
  }
  return arr;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('projects'); 
  const [evaluations, setEvaluations] = useState(INITIAL_EVALUATIONS);
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selectedPseDetailId, setSelectedPseDetailId] = useState(null); 
  
  // State Auth & Form Penilaian
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState('manager');
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', spec: 'UC', metrics: {} });

  // State Form Project
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ id: '', client: '', priority: 'Medium', pm: '', backup: '', status: 'Not started', phase: 'Identifikasi', solution: 'UC' });

  // State Filter & Search Project Tracking
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilters, setProjectFilters] = useState({ priority: '', pm: '', phase: '', status: '' });

  // Init Auth Firebase
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else if (typeof __app_id !== 'undefined') {
          await signInAnonymously(auth); 
        }
      } catch (e) {
        console.warn("Simulator Auth:", e);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Sinkronisasi Real-Time Database
  useEffect(() => {
    if (!user || !db) return;
    try {
      const evalColRef = getCollectionRef('kpi_evaluations');
      const unsubEvals = onSnapshot(evalColRef, (snapshot) => {
        const dbData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        if (dbData.length > 0) setEvaluations(dbData);
      }, (error) => console.error("Gagal sinkronisasi Eval DB:", error));

      const projColRef = getCollectionRef('project_tracking');
      const unsubProjects = onSnapshot(projColRef, (snapshot) => {
        const dbData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        if (dbData.length > 0) setProjects(dbData);
      }, (error) => console.error("Gagal sinkronisasi Project DB:", error));

      return () => { unsubEvals(); unsubProjects(); };
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const handleGoogleLogin = async () => {
    if (!auth) {
      alert("Konfigurasi Firebase belum ada. Gunakan .env di Netlify.");
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert("Terjadi kesalahan saat login Google.");
    }
  };

  useEffect(() => {
    setIsRevisionMode(false);
    if (formData.name) {
      const existing = evaluations.find(e => e.name === formData.name);
      if (existing && existing.rawMetrics) {
        setFormData(prev => ({ ...prev, spec: existing.spec, metrics: JSON.parse(JSON.stringify(existing.rawMetrics)) }));
      } else {
        setFormData(prev => ({ ...prev, metrics: {} }));
      }
    }
  }, [formData.name, evaluations, activeRole]);

  // --- NATIVE EXCEL/CSV EXPORT & IMPORT LOGIC ---

  const downloadCSV = (headers, rows, filename) => {
    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleExportProjects = () => {
    const headers = ['ID Sistem (Abaikan)', 'Nama Klien / Project', 'Solusi Utama', 'Prioritas', 'PM (Primary PSE)', 'Backup PSE', 'Fase / Milestone', 'Status', 'Terakhir Diupdate'];
    const rows = projects.map(p => [
      p.id, p.client, p.solution, p.priority, p.pm, p.backup, p.phase, p.status, p.lastUpdatedBy || '-'
    ]);
    downloadCSV(headers, rows, "Project_Monitoring_Export.csv");
  };

  const handleImportProjects = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!user || user.isAnonymous) {
      alert('Anda harus Sign-In dengan Akun Google terlebih dahulu untuk melakukan import ke Database Cloud!');
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const rows = parseCSV(text);
        
        if (rows.length < 2) {
          alert("File kosong atau format tidak sesuai.");
          return;
        }

        const headers = rows[0].map(h => h.trim());
        const data = rows.slice(1).map(row => {
          const obj = {};
          headers.forEach((h, i) => { obj[h] = row[i]; });
          return obj;
        });

        let importedCount = 0;
        const newProjectsList = [...projects];

        for (const row of data) {
          const client = row['Nama Klien / Project'] || row['User'] || row['Client'];
          if (!client || !client.trim()) continue;

          const newProj = {
            id: row['ID Sistem (Abaikan)'] || Date.now().toString() + Math.random().toString(36).substr(2, 5),
            client: client,
            solution: row['Solusi Utama'] || row['Solution'] || 'UC',
            priority: row['Prioritas'] || row['Priority'] || 'Medium',
            pm: row['PM (Primary PSE)'] || row['PM'] || '',
            backup: row['Backup PSE'] || row['Backup'] || '',
            phase: row['Fase / Milestone'] || row['Milestone'] || 'Identifikasi',
            status: row['Status'] || row['Status Project'] || 'Not started',
            lastUpdatedBy: user.displayName || user.email
          };

          const existingIndex = newProjectsList.findIndex(p => p.id === newProj.id || p.client === newProj.client);
          
          if (existingIndex >= 0) {
            newProjectsList[existingIndex] = { ...newProjectsList[existingIndex], ...newProj }; // Update
          } else {
            newProjectsList.push(newProj); // Insert
          }

          if (db) {
            const docRef = getDocRef('project_tracking', newProj.id);
            await setDoc(docRef, newProj);
          }
          importedCount++;
        }

        setProjects(newProjectsList);
        alert(`Berhasil mengimpor/memperbarui ${importedCount} project dari file!`);
      } catch (error) {
        console.error("Error import data:", error);
        alert("Terjadi kesalahan saat membaca file. Pastikan Anda mengunggah file berekstensi .csv (Comma Separated Values).");
      }
      e.target.value = null; 
    };
    reader.readAsText(file);
  };

  const handleExportKPI = () => {
    const headers = [
      'Rank', 'Nama PSE', 'Spesialisasi', 'Skor Kuantitatif (40%)', 'Skor Kualitatif (20%)',
      'Skor Pengembangan (20%)', 'Skor Kultur (20%)', 'Skor Akhir Tertimbang', 
      'Status Performa', 'Dinilai Oleh (Role)', 'Terakhir Diupdate'
    ];
    
    const rows = evaluations.map((e, idx) => [
      idx + 1, e.name, e.spec, 
      Number(e.scores?.kuantitatif || 0).toFixed(2),
      Number(e.scores?.kualitatif || 0).toFixed(2),
      Number(e.scores?.pengembangan || 0).toFixed(2),
      Number(e.scores?.kultur || 0).toFixed(2),
      Number(e.finalScore || 0).toFixed(2),
      e.status, e.submittedRoles?.join(', ') || '-', e.lastUpdatedBy || '-'
    ]);

    downloadCSV(headers, rows, `Laporan_KPI_PSE_${new Date().getFullYear()}.csv`);
  };

  // --- LOGIC CALCULATOR & HANDLERS ---
  const getScoreInfo = (finalScore) => {
    if (finalScore >= 9) return SCORING_RULES[0];
    if (finalScore >= 7) return SCORING_RULES[1];
    if (finalScore >= 5) return SCORING_RULES[2];
    if (finalScore >= 3) return SCORING_RULES[3];
    return SCORING_RULES[4];
  };

  const calculateAutoScore = (realisasi, target) => {
    if (!realisasi && realisasi !== 0) return 0;
    const percentage = (Number(realisasi) / target) * 100;
    const rule = SCORING_RULES.find(r => percentage >= r.min) || SCORING_RULES[4];
    return rule.score;
  };

  const handleMetricChange = (categoryId, itemId, field, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (!newData.metrics[categoryId]) newData.metrics[categoryId] = {};
      if (!newData.metrics[categoryId][itemId]) newData.metrics[categoryId][itemId] = {};
      
      newData.metrics[categoryId][itemId][field] = value;
      const catType = METRICS_CONFIG[categoryId].type;

      if (catType === 'auto' && field === 'realisasi') {
        const target = METRICS_CONFIG[categoryId].items.find(i => i.id === itemId).target;
        newData.metrics[categoryId][itemId].skor = calculateAutoScore(value, target);
      }
      
      if (catType === 'manual' && field.startsWith('skor')) {
        const m = Number(newData.metrics[categoryId][itemId].skorManager) || 0;
        const p = Number(newData.metrics[categoryId][itemId].skorPeer) || 0;
        const t = Number(newData.metrics[categoryId][itemId].skorTop) || 0;
        
        let count = 0, sum = 0;
        if (m) { sum += m; count++; }
        if (p) { sum += p; count++; }
        if (t) { sum += t; count++; }

        newData.metrics[categoryId][itemId].skor = count > 0 ? (sum / count).toFixed(2) : 0;
      }
      return newData;
    });
  };

  const syncFromProjectTracking = () => {
    if (!formData.name) return;
    const pseName = formData.name;
    
    const pseProjects = projects.filter(p => p.pm === pseName || p.backup === pseName);
    const pipelineCount = pseProjects.length;
    const completedCount = pseProjects.filter(p => p.status === 'Completed').length;
    const winRate = pipelineCount > 0 ? (completedCount / pipelineCount) * 100 : 0;
    const proposalCount = pseProjects.filter(p => ['Penawaran & Proposal', 'PoC & Testing', 'Instalasi', 'BAST'].includes(p.phase)).length;
    const pocCount = pseProjects.filter(p => ['PoC & Testing', 'Instalasi', 'BAST'].includes(p.phase)).length;

    handleMetricChange('kuantitatif', 'q1', 'realisasi', pipelineCount);
    handleMetricChange('kuantitatif', 'q1', 'bukti', 'Auto-Sync dari Modul Project Tracker');
    handleMetricChange('kuantitatif', 'q1', 'catatan', `Total pipeline aktif/selesai: ${pipelineCount} opp`);

    handleMetricChange('kuantitatif', 'q2', 'realisasi', winRate.toFixed(2));
    handleMetricChange('kuantitatif', 'q2', 'bukti', 'Auto-Sync dari Modul Project Tracker');
    handleMetricChange('kuantitatif', 'q2', 'catatan', `${completedCount} won dari ${pipelineCount} opp`);

    handleMetricChange('kuantitatif', 'q3', 'realisasi', proposalCount);
    handleMetricChange('kuantitatif', 'q3', 'bukti', 'Auto-Sync dari Modul Project Tracker');
    
    handleMetricChange('kuantitatif', 'q4', 'realisasi', pocCount);
    handleMetricChange('kuantitatif', 'q4', 'bukti', 'Auto-Sync dari Modul Project Tracker');

    alert(`Data Kuantitatif untuk ${pseName} berhasil dikalkulasi dan ditarik dari Project Tracking!`);
  };

  const calculateLiveAverages = () => {
    let totals = { kuantitatif: 0, kualitatif: 0, pengembangan: 0, kultur: 0 };
    let counts = { kuantitatif: 0, kualitatif: 0, pengembangan: 0, kultur: 0 };

    Object.entries(formData.metrics).forEach(([catId, items]) => {
      Object.values(items).forEach(item => {
        if (item.skor && Number(item.skor) > 0) {
          totals[catId] += Number(item.skor);
          counts[catId]++;
        }
      });
    });

    const averages = {
      kuantitatif: counts.kuantitatif ? (totals.kuantitatif / counts.kuantitatif) : 0,
      kualitatif: counts.kualitatif ? (totals.kualitatif / counts.kualitatif) : 0,
      pengembangan: counts.pengembangan ? (totals.pengembangan / counts.pengembangan) : 0,
      kultur: counts.kultur ? (totals.kultur / counts.kultur) : 0,
    };

    const finalScore = 
      (averages.kuantitatif * METRICS_CONFIG.kuantitatif.weight) +
      (averages.kualitatif * METRICS_CONFIG.kualitatif.weight) +
      (averages.pengembangan * METRICS_CONFIG.pengembangan.weight) +
      (averages.kultur * METRICS_CONFIG.kultur.weight);

    return { averages, finalScore };
  };

  const handleSaveKpi = async () => {
    if (!user || user.isAnonymous) {
      alert('Harap Sign-In dengan Akun Google Anda terlebih dahulu untuk menyimpan ke Cloud Database!');
      return;
    }
    if (!formData.name) {
      alert('Nama PSE wajib dipilih!');
      return;
    }

    const { averages, finalScore } = calculateLiveAverages();
    const scoreInfo = getScoreInfo(finalScore);
    const existingIndex = evaluations.findIndex(e => e.name === formData.name);
    let currentSubmittedRoles = existingIndex >= 0 && evaluations[existingIndex].submittedRoles ? [...evaluations[existingIndex].submittedRoles] : [];
    
    if (!currentSubmittedRoles.includes(activeRole)) currentSubmittedRoles.push(activeRole);

    const newEval = {
      id: existingIndex >= 0 ? evaluations[existingIndex].id : Date.now().toString(),
      name: formData.name,
      spec: formData.spec,
      scores: averages,
      finalScore: finalScore.toFixed(2),
      status: scoreInfo.label,
      rawMetrics: JSON.parse(JSON.stringify(formData.metrics)), 
      submittedRoles: currentSubmittedRoles,
      lastUpdatedBy: user.displayName || user.email || 'Unknown User'
    };

    if (db) {
      try {
        const docRef = getDocRef('kpi_evaluations', newEval.id);
        await setDoc(docRef, newEval);
      } catch (error) {
        alert("Gagal menyimpan ke Cloud Database. Pastikan koneksi dan API Key valid.");
      }
    } else {
      if (existingIndex >= 0) {
        const updatedEvals = [...evaluations];
        updatedEvals[existingIndex] = newEval;
        setEvaluations(updatedEvals);
      } else {
        setEvaluations(prev => [...prev, newEval]);
      }
    }
    
    alert(`Penilaian ${formData.name} berhasil disubmit!`);
    setIsRevisionMode(false);
    setActiveTab('dashboard');
    setFormData({ name: '', spec: 'UC', metrics: {} });
  };

  // --- LOGIC PROJECT TRACKING ---
  const handleSaveProject = async () => {
    if (!user || user.isAnonymous) {
      alert('Harap Sign-In dengan Akun Google Anda terlebih dahulu!'); return;
    }
    if (!projectForm.client || !projectForm.pm) {
      alert('Nama Client dan PM Wajib diisi!'); return;
    }

    const newProject = {
      ...projectForm,
      id: projectForm.id || Date.now().toString(),
      lastUpdatedBy: user.displayName || user.email
    };

    if (db) {
      try {
        const docRef = getDocRef('project_tracking', newProject.id);
        await setDoc(docRef, newProject);
      } catch (error) {
        alert("Gagal menyimpan Project ke Cloud Database.");
      }
    } else {
      const existingIndex = projects.findIndex(p => p.id === newProject.id);
      if (existingIndex >= 0) {
        const updated = [...projects];
        updated[existingIndex] = newProject;
        setProjects(updated);
      } else {
        setProjects(prev => [...prev, newProject]);
      }
    }

    setIsProjectModalOpen(false);
    setProjectForm({ id: '', client: '', priority: 'Medium', pm: '', backup: '', status: 'Not started', phase: 'Identifikasi', solution: 'UC' });
  };

  const handleDeleteProject = async (id) => {
    if(!confirm('Anda yakin ingin menghapus project ini?')) return;
    if (db && user && !user.isAnonymous) {
      await deleteDoc(getDocRef('project_tracking', id));
    } else {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  // Fitur Inline Editing untuk Tabel
  const handleInlineProjectUpdate = async (id, field, value) => {
    if (!user || user.isAnonymous) {
      alert('Mode Simulasi: Silakan Sign-In dengan Google untuk menyimpan perubahan secara permanen!');
    }

    const updatedProjects = projects.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value, lastUpdatedBy: user?.displayName || user?.email || 'Unknown User' };
      }
      return p;
    });
    setProjects(updatedProjects); 

    if (db && user && !user.isAnonymous) {
      try {
        const targetProj = updatedProjects.find(p => p.id === id);
        const docRef = getDocRef('project_tracking', id);
        await setDoc(docRef, targetProj); 
      } catch (error) {
        console.error("Gagal update inline:", error);
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setProjectFilters({ priority: '', pm: '', phase: '', status: '' });
  };

  // Filtering Project Data
  const filteredProjects = projects.filter(proj => {
    const matchSearch = proj.client.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (proj.solution && proj.solution.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchPriority = projectFilters.priority ? proj.priority === projectFilters.priority : true;
    const matchPM = projectFilters.pm ? (proj.pm === projectFilters.pm || proj.backup === projectFilters.pm) : true;
    const matchPhase = projectFilters.phase ? proj.phase === projectFilters.phase : true;
    const matchStatus = projectFilters.status ? proj.status === projectFilters.status : true;

    return matchSearch && matchPriority && matchPM && matchPhase && matchStatus;
  });


  // --- RENDERERS ---

  const renderDetailModal = () => {
    if (!selectedPseDetailId) return null;
    const emp = evaluations.find(e => e.id === selectedPseDetailId);
    if (!emp) return null;

    const statusConfig = SCORING_RULES.find(r => r.label === emp.status) || SCORING_RULES[4];
    const raw = emp.rawMetrics || {};

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-gray-200 animate-in slide-in-from-bottom-4">
          <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-start bg-slate-50 relative">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-inner ${statusConfig.barColor}`}>
                {String(emp.name || 'U').charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">{emp.name}</h2>
                <p className="text-sm font-semibold text-gray-500 bg-gray-200 inline-block px-2 py-0.5 rounded mt-1">{emp.spec}</p>
              </div>
            </div>
            <div className="text-right mr-8">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Skor Akhir</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-gray-800 leading-none">{Number(emp.finalScore || 0).toFixed(2)}</span>
                <span className={`px-3 py-1 rounded-md text-xs font-bold shadow-sm ${statusConfig.color}`}>{emp.status}</span>
              </div>
            </div>
            <button onClick={() => setSelectedPseDetailId(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 hover:bg-gray-200 p-2 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 md:p-6 overflow-y-auto bg-white flex-1 space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                <FileText className="text-blue-500" size={20} />
                <h3 className="text-lg font-bold text-gray-800">Detail Aktivitas & Pekerjaan Kuantitatif</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {METRICS_CONFIG.kuantitatif.items.map(item => {
                  const data = raw.kuantitatif?.[item.id] || {};
                  const isFilled = data.realisasi !== undefined;
                  return (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-gray-700 text-sm">{item.label}</p>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${isFilled ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>Skor: {data.skor || '-'}</span>
                      </div>
                      <div className="mt-3 flex items-end gap-2">
                        <span className="text-3xl font-black text-gray-800">{isFilled ? data.realisasi : '-'}</span>
                        <span className="text-sm font-semibold text-gray-500 mb-1">{item.unit}</span>
                      </div>
                      {isFilled && (
                        <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-100">
                          <p><span className="font-bold text-gray-500">Bukti:</span> {data.bukti || '-'}</p>
                          {data.catatan && <p className="mt-1"><span className="font-bold text-gray-500">Catatan:</span> {data.catatan}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectTracking = () => {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
          <div className="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Briefcase className="mr-2 text-blue-600" size={20}/> Database Project Monitoring 2026
              </h2>
              <p className="text-xs text-gray-500 font-semibold mt-1">Data dari tracker ini akan digunakan sebagai landasan perhitungan otomatis KPI Kuantitatif PSE.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                id="excel-import" 
                accept=".csv" 
                className="hidden" 
                onChange={handleImportProjects} 
              />
              <button 
                onClick={() => document.getElementById('excel-import').click()}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm"
                title="Upload data dari file CSV (Excel)"
              >
                <Upload size={16} className="mr-2" /> Import CSV
              </button>
              
              <button 
                onClick={handleExportProjects}
                className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm"
                title="Download Data Project (bisa dibuka di Excel)"
              >
                <Download size={16} className="mr-2" /> Export
              </button>

              <button 
                onClick={() => { setProjectForm({ id: '', client: '', priority: 'Medium', pm: '', backup: '', status: 'Not started', phase: 'Identifikasi', solution: 'UC' }); setIsProjectModalOpen(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm ml-2"
              >
                <Plus size={16} className="mr-2" /> Tambah Project
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 border-collapse min-w-[800px]">
              <thead className="bg-slate-50 text-gray-700 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Nama Klien / Project</th>
                  <th className="px-4 py-3">Prioritas</th>
                  <th className="px-4 py-3">Tim PSE (PM / BU)</th>
                  <th className="px-4 py-3">Fase (Milestone)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center rounded-tr-lg">Aksi</th>
                </tr>
                <tr className="bg-gray-100/60 border-y border-gray-200 shadow-inner">
                  <th className="px-4 py-2">
                    <div className="flex items-center bg-white border border-gray-300 rounded px-2 py-1 shadow-sm">
                      <Search size={12} className="text-gray-400 mr-1"/>
                      <input type="text" placeholder="Cari nama project..." className="bg-transparent text-xs outline-none w-full font-normal normal-case" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                  </th>
                  <th className="px-4 py-2">
                    <select className="w-full text-xs border border-gray-300 rounded px-1 py-1 font-normal bg-white shadow-sm outline-none normal-case" value={projectFilters.priority} onChange={(e) => setProjectFilters({...projectFilters, priority: e.target.value})}>
                      <option value="">Semua Prioritas</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </th>
                  <th className="px-4 py-2">
                    <select className="w-full text-xs border border-gray-300 rounded px-1 py-1 font-normal bg-white shadow-sm outline-none normal-case" value={projectFilters.pm} onChange={(e) => setProjectFilters({...projectFilters, pm: e.target.value})}>
                      <option value="">Semua PSE</option>
                      {PSE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </th>
                  <th className="px-4 py-2">
                    <select className="w-full text-xs border border-gray-300 rounded px-1 py-1 font-normal bg-white shadow-sm outline-none normal-case" value={projectFilters.phase} onChange={(e) => setProjectFilters({...projectFilters, phase: e.target.value})}>
                      <option value="">Semua Fase</option>
                      <option value="Identifikasi">Identifikasi Awal</option>
                      <option value="Penawaran & Proposal">Penawaran & Proposal</option>
                      <option value="PoC & Testing">PoC & Testing</option>
                      <option value="Instalasi">Instalasi & Deployment</option>
                      <option value="BAST">BAST / Handover</option>
                    </select>
                  </th>
                  <th className="px-4 py-2">
                    <select className="w-full text-xs border border-gray-300 rounded px-1 py-1 font-normal bg-white shadow-sm outline-none normal-case" value={projectFilters.status} onChange={(e) => setProjectFilters({...projectFilters, status: e.target.value})}>
                      <option value="">Semua Status</option>
                      <option value="Not started">Not started</option>
                      <option value="In progress">In progress</option>
                      <option value="Pending">Pending (Hold)</option>
                      <option value="Completed">Completed (Won)</option>
                    </select>
                  </th>
                  <th className="px-4 py-2 text-center normal-case">
                    <button onClick={clearFilters} className="text-[10px] text-gray-500 hover:text-red-600 underline font-semibold transition-colors">Clear Filter</button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProjects.map((proj) => {
                  
                  let statusColor = "bg-gray-50 text-gray-600 border-gray-200";
                  if(proj.status === 'Completed') statusColor = "bg-green-50 text-green-700 border-green-200";
                  else if(proj.status === 'In progress') statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                  else if(proj.status === 'Pending') statusColor = "bg-orange-50 text-orange-700 border-orange-200";

                  let priorityColor = "bg-gray-50 text-gray-600 border-gray-200";
                  if(proj.priority === 'High') priorityColor = "bg-red-50 text-red-600 border-red-200";
                  else if(proj.priority === 'Medium') priorityColor = "bg-yellow-50 text-yellow-600 border-yellow-200";

                  return (
                    <tr key={proj.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-800 text-base">{proj.client}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{proj.solution}</p>
                      </td>
                      <td className="px-4 py-3 w-32">
                        <select 
                          value={proj.priority} 
                          onChange={(e) => handleInlineProjectUpdate(proj.id, 'priority', e.target.value)}
                          className={`w-full text-[11px] font-bold px-2 py-1.5 rounded border outline-none cursor-pointer transition ${priorityColor}`}
                          title="Ubah Prioritas secara instan"
                        >
                          <option value="High">HIGH</option>
                          <option value="Medium">MEDIUM</option>
                          <option value="Low">LOW</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="flex items-center"><span className="font-semibold text-blue-600 bg-blue-50 px-1 rounded mr-1">PM:</span> {proj.pm || '-'}</span>
                          <span className="flex items-center"><span className="font-semibold text-gray-500 bg-gray-100 px-1 rounded mr-1">BU:</span> {proj.backup || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 w-44">
                        <select 
                          value={proj.phase} 
                          onChange={(e) => handleInlineProjectUpdate(proj.id, 'phase', e.target.value)}
                          className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded px-1 py-1 text-xs font-semibold text-gray-700 outline-none cursor-pointer transition-colors"
                          title="Ubah Fase secara instan"
                        >
                          <option value="Identifikasi">Identifikasi Awal</option>
                          <option value="Penawaran & Proposal">Penawaran & Proposal</option>
                          <option value="PoC & Testing">PoC & Testing</option>
                          <option value="Instalasi">Instalasi & Deployment</option>
                          <option value="BAST">BAST / Handover</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center w-36">
                        <select 
                          value={proj.status} 
                          onChange={(e) => handleInlineProjectUpdate(proj.id, 'status', e.target.value)}
                          className={`w-full px-2 py-1.5 rounded text-[11px] font-bold border shadow-sm outline-none cursor-pointer text-center transition ${statusColor}`}
                          title="Ubah Status secara instan"
                        >
                          <option value="Not started">Not started</option>
                          <option value="In progress">In progress</option>
                          <option value="Pending">Pending (Hold)</option>
                          <option value="Completed">Completed (Won)</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => {setProjectForm(proj); setIsProjectModalOpen(true);}} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded transition opacity-60 hover:opacity-100" title="Edit Detail (Modal)"><FileEdit size={16}/></button>
                          <button onClick={() => handleDeleteProject(proj.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded transition opacity-60 hover:opacity-100" title="Hapus"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredProjects.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-10 text-gray-500 font-medium">Tidak ada project yang sesuai dengan filter pencarian.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Form Project */}
        {isProjectModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-gray-800">{projectForm.id ? 'Edit Project' : 'Tambah Project Baru'}</h3>
                <button onClick={() => setIsProjectModalOpen(false)} className="text-gray-400 hover:text-gray-800"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nama Client / Project</label>
                  <input type="text" value={projectForm.client} onChange={e=>setProjectForm({...projectForm, client: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Traveloka - Upgrade UC" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Prioritas</label>
                    <select value={projectForm.priority} onChange={e=>setProjectForm({...projectForm, priority: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                      <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Solusi Utama</label>
                    <select value={projectForm.solution} onChange={e=>setProjectForm({...projectForm, solution: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                      <option value="UC">Unified Communications (UC)</option>
                      <option value="Network & CyberSec">Network & CyberSec</option>
                      <option value="Other">Lainnya</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">PM (Primary PSE)</label>
                    <select value={projectForm.pm} onChange={e=>setProjectForm({...projectForm, pm: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                      <option value="">- Pilih PSE -</option>
                      {PSE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Backup PSE</label>
                    <select value={projectForm.backup} onChange={e=>setProjectForm({...projectForm, backup: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                      <option value="">- Opsional -</option>
                      {PSE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Fase / Milestone Saat Ini</label>
                    <select value={projectForm.phase} onChange={e=>setProjectForm({...projectForm, phase: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none bg-blue-50 font-medium">
                      <option value="Identifikasi">Identifikasi Awal</option>
                      <option value="Penawaran & Proposal">Penawaran & Proposal</option>
                      <option value="PoC & Testing">PoC & Testing</option>
                      <option value="Instalasi">Instalasi & Deployment</option>
                      <option value="BAST">BAST / Handover</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Status Progres</label>
                    <select value={projectForm.status} onChange={e=>setProjectForm({...projectForm, status: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                      <option value="Not started">Not started</option>
                      <option value="In progress">In progress</option>
                      <option value="Pending">Pending (Hold)</option>
                      <option value="Completed">Completed (Won)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                <button onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg">Batal</button>
                <button onClick={handleSaveProject} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center">
                  <Save size={16} className="mr-2"/> Simpan Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDashboard = () => {
    const sortedEvals = [...evaluations].sort((a, b) => b.finalScore - a.finalScore);
    const avgTeamScore = evaluations.length > 0 ? (evaluations.reduce((acc, curr) => acc + Number(curr.finalScore || 0), 0) / evaluations.length).toFixed(2) : 0;
    const topPerformers = sortedEvals.slice(0, 5);

    const distribution = SCORING_RULES.map(rule => ({
      ...rule,
      count: evaluations.filter(e => e.status === rule.label).length
    }));
    const maxDistribution = Math.max(...distribution.map(d => d.count), 1);

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm flex items-center space-x-4">
            <div className="p-4 bg-blue-600 text-white rounded-xl shadow-inner"><Users size={28} /></div>
            <div>
              <p className="text-sm text-blue-600 font-semibold mb-1 uppercase tracking-wide">Total Tim Dinilai</p>
              <p className="text-3xl font-black text-gray-800">{evaluations.length} <span className="text-lg font-medium text-gray-500">PSE</span></p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center space-x-4">
            <div className="p-4 bg-emerald-500 text-white rounded-xl shadow-inner"><Activity size={28} /></div>
            <div>
              <p className="text-sm text-emerald-600 font-semibold mb-1 uppercase tracking-wide">Rata-rata Skor Tim</p>
              <p className="text-3xl font-black text-gray-800">{avgTeamScore} <span className="text-lg font-medium text-gray-500">/ 10.0</span></p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-2xl border border-purple-100 shadow-sm flex items-center space-x-4">
            <div className="p-4 bg-purple-600 text-white rounded-xl shadow-inner"><Award size={28} /></div>
            <div>
              <p className="text-sm text-purple-600 font-semibold mb-1 uppercase tracking-wide">Top Performer</p>
              <p className="text-2xl font-black text-gray-800 truncate">{sortedEvals[0]?.name || '-'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 flex items-center mb-6">
              <PieChart size={20} className="mr-2 text-blue-500" /> Distribusi Level Performa
            </h3>
            <div className="space-y-4">
              {distribution.map(item => (
                <div key={item.label} className="flex items-center text-sm">
                  <div className="w-32 font-medium text-gray-600">{item.label}</div>
                  <div className="flex-1 ml-4 relative h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`absolute top-0 left-0 h-full ${item.barColor} transition-all duration-1000 ease-out`} style={{ width: `${(item.count / maxDistribution) * 100}%` }} />
                  </div>
                  <div className="w-12 text-right font-bold text-gray-800">{item.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 flex items-center mb-6">
              <TrendingUp size={20} className="mr-2 text-emerald-500" /> Top 5 Performers
            </h3>
            <div className="space-y-5">
              {topPerformers.map((emp, index) => {
                const colorConfig = getScoreInfo(emp.finalScore).barColor;
                return (
                  <div key={emp.id} className="relative cursor-pointer group" onClick={() => setSelectedPseDetailId(emp.id)}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-gray-700 flex items-center group-hover:text-blue-600 transition">
                        <span className="w-5 h-5 inline-flex items-center justify-center bg-gray-100 text-gray-500 rounded-full text-xs mr-2">{index + 1}</span>
                        {emp.name} <span className="text-xs text-gray-400 font-normal ml-2">({emp.spec})</span>
                      </span>
                      <span className="font-bold text-gray-900 group-hover:text-blue-600">{Number(emp.finalScore || 0).toFixed(2)}</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colorConfig} rounded-full transition-all duration-1000`} style={{ width: `${(emp.finalScore / 10) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
          <div className="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Detail Skor Tim Gabungan (360°)</h2>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleExportKPI} 
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm"
              >
                <Download size={16} className="mr-2" /> Export Rekap KPI (.csv)
              </button>
              
              <button 
                onClick={() => setActiveTab('form')} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm"
              >
                <FileEdit size={16} className="mr-2" /> Isi Nilai Baru
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Nama PSE</th>
                  <th className="px-6 py-4 text-center">Kuantitatif<br/><span className="text-[10px] text-gray-400 font-normal">(40%)</span></th>
                  <th className="px-6 py-4 text-center">Kualitatif<br/><span className="text-[10px] text-gray-400 font-normal">(20%)</span></th>
                  <th className="px-6 py-4 text-center">Pengembangan<br/><span className="text-[10px] text-gray-400 font-normal">(20%)</span></th>
                  <th className="px-6 py-4 text-center">Kultur<br/><span className="text-[10px] text-gray-400 font-normal">(20%)</span></th>
                  <th className="px-6 py-4 text-center font-bold text-blue-600">Skor Akhir</th>
                  <th className="px-6 py-4">Status Performa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedEvals.map((emp, idx) => {
                  const statusConfig = SCORING_RULES.find(r => r.label === emp.status) || SCORING_RULES[4];
                  return (
                    <tr key={emp.id} onClick={() => setSelectedPseDetailId(emp.id)} className="hover:bg-blue-50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 font-medium text-gray-900">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.spec}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-mono">{Number(emp.scores?.kuantitatif || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center font-mono">{Number(emp.scores?.kualitatif || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center font-mono">{Number(emp.scores?.pengembangan || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center font-mono">{Number(emp.scores?.kultur || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center font-bold font-mono text-gray-900 bg-gray-50/50">{Number(emp.finalScore || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-md text-xs font-bold shadow-sm ${statusConfig.color}`}>{emp.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        {renderDetailModal()}
      </div>
    );
  };

  const renderForm = () => {
    const activeRoleConfig = ROLE_CONFIG[activeRole];
    const ActiveIcon = activeRoleConfig.icon;

    const currentEval = evaluations.find(e => e.name === formData.name);
    const hasSubmitted = currentEval?.submittedRoles?.includes(activeRole);
    const isLocked = hasSubmitted && !isRevisionMode;

    const liveStats = calculateLiveAverages();
    const liveScoreInfo = getScoreInfo(liveStats.finalScore);

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4">
        {(!user || user.isAnonymous) && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="shrink-0 mt-0.5 text-red-600" size={20} />
            <div>
              <h4 className="font-bold text-sm">Akses Database Terbatas (Simulasi)</h4>
              <p className="text-sm mt-1 text-red-700">Agar data benar-benar terkunci secara *online* dan tersimpan di database, Anda diwajibkan untuk <b>Sign-In dengan Akun Google</b> di pojok kanan atas.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
          <div className={`flex items-center px-4 py-3 rounded-lg ${activeRoleConfig.color}`}>
            <ActiveIcon size={20} className="mr-3" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest mb-0.5 opacity-80">Hak Akses Form Saat Ini:</p>
              <p className="font-black text-sm">{activeRoleConfig.label}</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <button onClick={() => setActiveTab('dashboard')} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-semibold transition-colors">Batal</button>
             {isLocked ? (
               <button onClick={() => setIsRevisionMode(true)} className="flex-1 md:flex-none flex justify-center items-center px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold shadow-md transition-colors">
                 <FileEdit size={16} className="mr-2" /> Revisi Nilai
               </button>
             ) : (
               <button onClick={handleSaveKpi} className="flex-1 md:flex-none flex justify-center items-center px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-semibold shadow-md transition-colors">
                 <Save size={16} className="mr-2" /> {hasSubmitted ? 'Simpan Revisi' : 'Simpan Form'}
               </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-3">Pilih Karyawan yang Dinilai</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap PSE <span className="text-red-500">*</span></label>
                  <select value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-medium">
                    <option value="" disabled>-- Pilih Karyawan --</option>
                    {PSE_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Spesialisasi</label>
                  <select value={formData.spec} disabled={true} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none bg-gray-100 text-gray-500 cursor-not-allowed">
                    <option value="UC">Unified Communications (UC)</option>
                    <option value="Network & CyberSec">Network & CyberSec</option>
                  </select>
                </div>
              </div>
            </div>

            {!formData.name ? (
              <div className="bg-slate-50 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-500 font-medium">
                Pilih karyawan di atas untuk mulai mengisi form penilaian.
              </div>
            ) : (
              Object.entries(METRICS_CONFIG).map(([catId, category]) => {
                if (category.type === 'auto' && activeRole !== 'manager') return null;

                return (
                  <div key={catId} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in duration-300">
                    <div className="flex justify-between items-end border-b pb-3 mb-5">
                      <div>
                        <h3 className="text-lg font-extrabold text-gray-800">{category.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{category.desc}</p>
                      </div>
                      
                      {category.type === 'auto' && (
                        <button 
                          onClick={syncFromProjectTracking}
                          disabled={isLocked}
                          className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold border transition ${isLocked ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                        >
                          <RefreshCw size={14} className="mr-2" /> Auto-Sync Data Project
                        </button>
                      )}
                      
                      {category.type !== 'auto' && (
                        <span className="text-sm font-bold text-gray-600 bg-gray-100 border border-gray-200 px-3 py-1 rounded-md shadow-sm whitespace-nowrap">
                          Bobot: {category.weight * 100}%
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      {category.items.map(item => {
                        const itemData = formData.metrics[catId]?.[item.id] || {};
                        const myScoreKey = activeRoleConfig.scoreKey;
                        const myNoteKey = activeRoleConfig.noteKey;

                        return (
                          <div key={item.id} className="p-5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-4 transition hover:border-gray-300">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-gray-800">{item.label}</p>
                                {category.type === 'auto' && (
                                  <p className="text-xs text-gray-500 mt-1 bg-white inline-block px-2 py-0.5 border rounded">Target: <span className="font-bold text-gray-700">{item.target} {item.unit}</span></p>
                                )}
                              </div>
                              <div className="text-right hidden lg:block">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Skor Dihasilkan</span>
                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-black text-sm border-2 ${itemData.skor > 0 ? 'border-blue-200 text-blue-700 bg-white' : 'border-gray-200 text-gray-400 bg-white'}`}>
                                  {itemData.skor || '-'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-2">
                              {category.type === 'auto' ? (
                                <>
                                  <div className="md:col-span-3">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Aktual Realisasi</label>
                                    <input type="number" step="0.01" min="0" disabled={isLocked} value={itemData.realisasi || ''} onChange={(e) => handleMetricChange(catId, item.id, 'realisasi', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none" />
                                  </div>
                                  <div className="md:col-span-5">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Bukti / Evidence <span className="text-red-500">*</span></label>
                                    <input type="text" disabled={isLocked} value={itemData.bukti || ''} onChange={(e) => handleMetricChange(catId, item.id, 'bukti', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none" placeholder="Link/CRM..." />
                                  </div>
                                  <div className="md:col-span-4">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Catatan Anda</label>
                                    <input type="text" disabled={isLocked} value={itemData.catatan || ''} onChange={(e) => handleMetricChange(catId, item.id, 'catatan', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none" placeholder="Konteks..." />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="md:col-span-4">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Beri Skor (1 - 10)</label>
                                    <select value={itemData[myScoreKey] || ''} disabled={isLocked} onChange={(e) => handleMetricChange(catId, item.id, myScoreKey, e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none font-semibold">
                                      <option value="">- Pilih -</option>
                                      {[10,9,8,7,6,5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                  </div>
                                  <div className="md:col-span-8">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Catatan Anda</label>
                                    <input type="text" disabled={isLocked} value={itemData[myNoteKey] || ''} onChange={(e) => handleMetricChange(catId, item.id, myNoteKey, e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none" placeholder="Alasan penilaian..." />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}

          </div>

          <div className="lg:col-span-1 hidden lg:block">
            {formData.name && (
              <div className="bg-slate-800 rounded-2xl p-6 shadow-xl sticky top-24 text-white border border-slate-700 animate-in fade-in">
                <h3 className="text-lg font-bold mb-6 flex items-center border-b border-slate-700 pb-4">
                  <BarChart3 className="mr-3 text-blue-400" /> Live Preview
                </h3>
                <div className="space-y-4 mb-8">
                  {activeRole === 'manager' && (
                    <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                      <span className="text-slate-300 text-sm font-medium">Kuantitatif (40%)</span>
                      <span className="font-mono text-lg font-bold text-blue-300">{Number(liveStats.averages.kuantitatif || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                    <span className="text-slate-300 text-sm font-medium">Kualitatif (20%)</span>
                    <span className="font-mono text-lg font-bold text-emerald-300">{Number(liveStats.averages.kualitatif || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                    <span className="text-slate-300 text-sm font-medium">Pengembangan (20%)</span>
                    <span className="font-mono text-lg font-bold text-purple-300">{Number(liveStats.averages.pengembangan || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                    <span className="text-slate-300 text-sm font-medium">Kultur (20%)</span>
                    <span className="font-mono text-lg font-bold text-yellow-300">{Number(liveStats.averages.kultur || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="bg-slate-950 rounded-xl p-6 border border-slate-700 text-center shadow-inner">
                  <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-3">Estimasi Skor Akhir</p>
                  <p className="text-6xl font-black text-white mb-4 drop-shadow-md">
                    {liveStats.finalScore > 0 ? Number(liveStats.finalScore || 0).toFixed(2) : '0.00'}
                  </p>
                  <div className={`inline-block px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm ${liveScoreInfo.color.replace('bg-', 'bg-opacity-20 bg-')}`}>
                    {liveStats.finalScore > 0 ? liveScoreInfo.label : 'Belum Ada Nilai'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 pb-12">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-indigo-900 rounded-xl flex items-center justify-center shadow-md">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-800 tracking-tight">PSE Workspace</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Project & KPI Hub</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex bg-gray-100 p-1.5 rounded-xl shadow-inner border border-gray-200">
              <button onClick={() => setActiveTab('projects')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center ${activeTab === 'projects' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-900'}`}>
                <ListTodo size={16} className="mr-2" /> Project Tracker
              </button>
              <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center ${activeTab === 'dashboard' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-900'}`}>
                <Activity size={16} className="mr-2" /> KPI Dashboard
              </button>
              <button onClick={() => setActiveTab('form')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center ${activeTab === 'form' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-900'}`}>
                <FileEdit size={16} className="mr-2" /> Form Penilaian
              </button>
            </div>

            <div className="flex items-center gap-4 md:border-l md:border-gray-300 md:pl-6">
              {user && !user.isAnonymous ? (
                <div className="flex items-center gap-3 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                    {user.photoURL ? <img src={user.photoURL} alt="Avatar" /> : String(user.displayName || user.email || 'U').charAt(0)}
                  </div>
                  <div className="flex flex-col hidden sm:flex">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Logged in:</span>
                    <span className="text-xs font-black text-blue-700 truncate max-w-[120px]">{user.displayName || user.email || 'User'}</span>
                  </div>
                  <button onClick={() => auth.signOut()} className="ml-2 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={handleGoogleLogin} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg> Sign In 
                </button>
              )}

              <div className="flex flex-col border-l border-gray-300 pl-4 hidden md:flex">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Akses View:</span>
                <select value={activeRole} onChange={(e) => setActiveRole(e.target.value)} className="bg-transparent border-none text-sm font-black text-gray-800 cursor-pointer outline-none hover:text-gray-600 transition pl-0 py-0">
                  <option value="manager">👤 Manager</option>
                  <option value="peer">👥 Rekan Divisi</option>
                  <option value="top">👑 Top Mgmt</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' ? renderDashboard() : activeTab === 'projects' ? renderProjectTracking() : renderForm()}
      </main>
    </div>
  );
}
