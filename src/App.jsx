import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
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
  Activity, PieChart, ShieldCheck, UserCircle, Crown, X, 
  FileText, Search, LogOut, Briefcase, Plus, ListTodo, RefreshCw, Trash2, 
  Download, Upload, Lock, Settings, UserCog, ShieldAlert, Send, Printer, CheckCircle2
} from 'lucide-react';

// --- INIT FIREBASE ---
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
  console.error('Firebase Setup Error:', error);
}

const getCollectionRef = (colName) => {
  if (typeof __app_id !== 'undefined') return collection(db, 'artifacts', __app_id, 'public', 'data', colName);
  return collection(db, colName); 
};
const getDocRef = (colName, id) => {
  if (typeof __app_id !== 'undefined') return doc(db, 'artifacts', __app_id, 'public', 'data', colName, id);
  return doc(db, colName, id); 
};

// --- DATA & KONFIGURASI DEFAULT ---
const PSE_NAMES = [
  'Dayat', 'Yanuar', 'Arfindo', 'Damardjati', 'Eko Kuncoro', 
  'Fakhri', 'Ghazy', 'Pankaj', 'Syamil', 'Hakim', 'Tyan', 'Reisya'
];

const SALES_NAMES = [
  'Ayu Arviani', 'Bondan Adi', 'Inaya Wulandari', 'Inneke Twita',
  'Johnsy Hein Pitoi', 'Lestari Rumata Nancy', 'Lie Sunardi Fenery',
  'Paulus Gideon', 'Rifan Septian', 'Ryan Dharmatirta', 'Sri Evi Wulandari'
];

const DEFAULT_ROLES = {
  'nafi@kayreach.com': 'admin',
  'bayu.setiawan@kayreach.com': 'manager_pse',
  'ayu.arviani@kayreach.com': 'manager_other',
  'paulus@kayreach.com': 'manager_other',
  'bondan.adi@kayreach.com': 'manager_other',
  'rdharmatirta@kayreach.com': 'manager_other',
  'mhidayat@kayreach.com': 'staff',
  'arfindo.laksono@kayreach.com': 'staff',
  'ghazyi.dzulfaqar@kayreach.com': 'staff',
  'yanuar.saputra@kayreach.com': 'staff',
  'abdul.hakim@kayreach.com': 'staff',
  'damardjati@kayreach.com': 'staff',
  'eko.kuncoro@kayreach.com': 'staff',
  'fakhri.putra@kayreach.com': 'staff',
  'pankaj.sismitono@kayreach.com': 'staff',
  'syamil.umairha@kayreach.com': 'staff'
};

const EMAIL_TO_PSE_MAP = {
  'mhidayat@kayreach.com': 'Dayat',
  'arfindo.laksono@kayreach.com': 'Arfindo',
  'ghazyi.dzulfaqar@kayreach.com': 'Ghazy',
  'yanuar.saputra@kayreach.com': 'Yanuar',
  'abdul.hakim@kayreach.com': 'Hakim',
  'damardjati@kayreach.com': 'Damardjati',
  'eko.kuncoro@kayreach.com': 'Eko Kuncoro',
  'fakhri.putra@kayreach.com': 'Fakhri',
  'pankaj.sismitono@kayreach.com': 'Pankaj',
  'syamil.umairha@kayreach.com': 'Syamil'
};

const SCORING_RULES = [
  { min: 120, score: 10, label: 'Outstanding', color: 'bg-green-100 text-green-800', barColor: 'bg-green-500' },
  { min: 101, score: 8, label: 'Exceeds Exp.', color: 'bg-blue-100 text-blue-800', barColor: 'bg-blue-500' },
  { min: 85, score: 6, label: 'Meets Exp.', color: 'bg-yellow-100 text-yellow-800', barColor: 'bg-yellow-500' },
  { min: 70, score: 4, label: 'Below Exp.', color: 'bg-orange-100 text-orange-800', barColor: 'bg-orange-500' },
  { min: 0, score: 2, label: 'Unsatisfactory', color: 'bg-red-100 text-red-800', barColor: 'bg-red-500' }
];

const METRICS_CONFIG = {
  kuantitatif: {
    title: 'A. KPI Kuantitatif (Otomatis dari Tracker)', weight: 0.40, type: 'auto',
    desc: 'Berdasarkan rekap project yang dihandle sebagai PM atau Backup',
    items: [
      { id: 'q1', label: 'Pipeline / Project Terlibat', target: 5, unit: 'Project' },
      { id: 'q2', label: 'Win Rate (Completed)', target: 30, unit: '%' },
      { id: 'q3', label: 'Proposal / RFP / Penawaran', target: 4, unit: 'Project' },
      { id: 'q4', label: 'Demo / PoC / Instalasi', target: 3, unit: 'Project' }
    ]
  },
  kualitatif: {
    title: 'B. KPI Kualitatif', weight: 0.20, type: 'manual',
    items: [ { id: 'k1', label: 'Kualitas Presentasi & Solusi' }, { id: 'k2', label: 'Kualitas Dokumen (HLD/LLD)' } ]
  },
  pengembangan: {
    title: 'C. Pengembangan Diri', weight: 0.20, type: 'manual',
    items: [ { id: 'p1', label: 'Sertifikasi / Exam' }, { id: 'p2', label: 'Training / Workshop' }, { id: 'p3', label: 'Internal Knowledge Sharing' } ]
  },
  kultur: {
    title: 'D. KPI Kultur', weight: 0.20, type: 'manual',
    items: [ { id: 'c1', label: 'Responsivitas & Komunikasi' }, { id: 'c2', label: 'Disiplin & Kehadiran' }, { id: 'c3', label: 'Attitude & Etika Kerja' } ]
  }
};

const ROLE_CONFIG = {
  admin: { id: 'admin', label: 'Owner / Admin', icon: Crown, color: 'text-purple-600 bg-purple-50 border-purple-200', scoreKey: 'skorTop', canRateQuant: true, isQuantRequired: false, isOtherRequired: false },
  manager_pse: { id: 'manager_pse', label: 'Manager PSE', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50 border-blue-200', scoreKey: 'skorManager', canRateQuant: true, isQuantRequired: true, isOtherRequired: true },
  manager_other: { id: 'manager_other', label: 'Manager Div. Lain', icon: FileText, color: 'text-orange-600 bg-orange-50 border-orange-200', scoreKey: 'skorPeerManager', canRateQuant: false, isQuantRequired: false, isOtherRequired: false },
  staff: { id: 'staff', label: 'Staff / PSE', icon: UserCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', scoreKey: 'skorPeer', canRateQuant: false, isQuantRequired: false, isOtherRequired: false }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [evaluations, setEvaluations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedPseDetailId, setSelectedPseDetailId] = useState(null); 
  
  const [dialog, setDialog] = useState(null);
  const showMessage = (msg) => setDialog({ type: 'alert', message: msg });
  const showConfirm = (msg, onConfirmFn) => setDialog({ type: 'confirm', message: msg, onConfirm: onConfirmFn });

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeUser, setActiveUser] = useState(null);

  const [managedRoles, setManagedRoles] = useState([]); 
  const [userRole, setUserRole] = useState('guest'); 
  const [staffIdentity, setStaffIdentity] = useState(''); 
  const [activeRoleConfig, setActiveRoleConfig] = useState(ROLE_CONFIG.staff); 
  const [userProfiles, setUserProfiles] = useState({}); 

  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', metrics: {} });

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ id: '', client: '', priority: 'Medium', pm: '', backup: '', sales: '', status: 'Not started', phase: 'Identifikasi', startDate: '', endDate: '', linkDoc: '', noteHistory: [] });
  const [newNotesMap, setNewNotesMap] = useState({}); 
  const [selectedProjects, setSelectedProjects] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilters, setProjectFilters] = useState({ priority: '', pm: '', phase: '', status: '' });

  useEffect(() => {
    if (!auth) { setIsLoadingAuth(false); return; }
    const initAuth = async () => {
      try { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token); } 
      catch (e) { console.warn("Auth init error:", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setActiveUser(currentUser);
      setIsLoadingAuth(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeUser || !db) return;

    if (activeUser.email) {
      const profileData = { email: activeUser.email, displayName: activeUser.displayName || '' };
      if (activeUser.photoURL) profileData.photoURL = activeUser.photoURL; 
      setDoc(getDocRef('users_profile', activeUser.email), profileData, { merge: true }).catch(() => {});
    }

    try {
      const unsubEvals = onSnapshot(getCollectionRef('kpi_evaluations'), snap => setEvaluations(snap.docs.map(doc => ({id: doc.id, ...doc.data()}))));
      const unsubProjects = onSnapshot(getCollectionRef('project_tracking'), snap => setProjects(snap.docs.map(doc => ({id: doc.id, ...doc.data()}))));
      const unsubRoles = onSnapshot(getCollectionRef('user_roles'), snap => setManagedRoles(snap.docs.map(doc => ({id: doc.id, ...doc.data()}))));
      const unsubProfiles = onSnapshot(getCollectionRef('users_profile'), snap => {
        const profilesData = {}; snap.docs.forEach(doc => profilesData[doc.id] = doc.data()); setUserProfiles(profilesData);
      });
      return () => { unsubEvals(); unsubProjects(); unsubRoles(); unsubProfiles(); };
    } catch (err) { console.error(err); }
  }, [activeUser]);

  useEffect(() => {
    if (activeUser) {
      const email = activeUser.email?.toLowerCase() || '';
      let currentRole = 'staff';
      const customDbRole = managedRoles.find(r => r.id === email);
      if (customDbRole) currentRole = customDbRole.role;
      else if (DEFAULT_ROLES[email]) currentRole = DEFAULT_ROLES[email];
      if (email === 'nafi@kayreach.com') currentRole = 'admin';

      setUserRole(currentRole);
      setActiveRoleConfig(ROLE_CONFIG[currentRole] || ROLE_CONFIG.staff);

      if (currentRole === 'staff') {
        if (EMAIL_TO_PSE_MAP[email]) setStaffIdentity(EMAIL_TO_PSE_MAP[email]);
        else {
          const match = PSE_NAMES.find(n => (activeUser.displayName || '').toLowerCase().includes(n.toLowerCase()));
          if (match) setStaffIdentity(match);
        }
      }
    } else setUserRole('guest');
  }, [activeUser, managedRoles]);

  const canDeleteProject = ['admin', 'manager_pse'].includes(userRole);
  const canManageProjectFull = ['admin', 'manager_pse'].includes(userRole);

  const visibleProjects = projects.filter(proj => {
    if (userRole === 'staff') return proj.pm === staffIdentity || proj.backup === staffIdentity;
    return true; 
  });

  const visibleEvaluations = evaluations.filter(e => {
    if (userRole === 'staff') return e.name === staffIdentity;
    return true; 
  });

  const handleGoogleLogin = async () => {
    if (!auth) { showMessage("Firebase belum dikonfigurasi. Periksa file .env Anda."); return; }
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (error) { showMessage("Login Gagal: " + error.message); }
  };

  const handleLogout = () => { if (auth) auth.signOut(); };

  // OTOMATIS KALKULASI NILAI KUANTITATIF SAAT FORM DIBUKA/NAMA DIGANTI
  useEffect(() => {
    setIsRevisionMode(false);
    if (formData.name) {
      const existing = evaluations.find(e => e.name === formData.name);
      let initialMetrics = existing && existing.rawMetrics ? JSON.parse(JSON.stringify(existing.rawMetrics)) : {};

      // LOGIKA PENILAIAN OTOMATIS DARI PROJECT MONITORING
      const userProjects = projects.filter(p => p.pm === formData.name || p.backup === formData.name);
      const totalProjects = userProjects.length;
      const completedCount = userProjects.filter(p => p.status === 'Completed').length;
      const winRate = totalProjects > 0 ? (completedCount / totalProjects) * 100 : 0;
      
      const proposalPhases = ['Penawaran & Proposal', 'PoC & Testing', 'Instalasi', 'BAST'];
      const pocPhases = ['PoC & Testing', 'Instalasi', 'BAST'];
      
      const proposalCount = userProjects.filter(p => proposalPhases.includes(p.phase) || p.status === 'Completed').length;
      const pocCount = userProjects.filter(p => pocPhases.includes(p.phase) || p.status === 'Completed').length;

      if (!initialMetrics.kuantitatif) initialMetrics.kuantitatif = {};
      
      // Inject otomatis nilai realisasi
      initialMetrics.kuantitatif.q1 = { ...initialMetrics.kuantitatif.q1, realisasi: totalProjects };
      initialMetrics.kuantitatif.q2 = { ...initialMetrics.kuantitatif.q2, realisasi: winRate.toFixed(1) };
      initialMetrics.kuantitatif.q3 = { ...initialMetrics.kuantitatif.q3, realisasi: proposalCount };
      initialMetrics.kuantitatif.q4 = { ...initialMetrics.kuantitatif.q4, realisasi: pocCount };

      setFormData(prev => ({ ...prev, metrics: initialMetrics }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name]); // Hanya triger ulang jika nama berganti untuk mencegah pengetikan field lain kereset


  const getScoreInfo = (finalScore) => {
    if (finalScore >= 9) return SCORING_RULES[0];
    if (finalScore >= 7) return SCORING_RULES[1];
    if (finalScore >= 5) return SCORING_RULES[2];
    if (finalScore >= 3) return SCORING_RULES[3];
    return SCORING_RULES[4];
  };

  const calculateStatsForForm = (metricsData, roleCfg) => {
    let totals = { kuantitatif: 0, kualitatif: 0, pengembangan: 0, kultur: 0 };
    let counts = { kuantitatif: 0, kualitatif: 0, pengembangan: 0, kultur: 0 };
    
    Object.entries(METRICS_CONFIG).forEach(([catId, category]) => {
        category.items.forEach(item => {
            const itemData = metricsData[catId]?.[item.id] || {};
            let val = 0;
            if (category.type === 'auto') {
                if (itemData.realisasi) val = Math.min((Number(itemData.realisasi) / item.target) * 10, 10);
                else if (itemData.skor) val = itemData.skor;
            } else val = itemData[roleCfg.scoreKey] || itemData.skor;
            if (val && Number(val) > 0) { totals[catId] += Number(val); counts[catId]++; }
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

  // HANDLERS PROJECT
  const handleAddNoteToProject = async (projectId) => {
    const draftText = newNotesMap[projectId];
    if (!draftText || !draftText.trim()) return;

    const newNoteObj = { text: draftText.trim(), timestamp: new Date().toISOString(), author: activeUser?.displayName || activeUser?.email || 'Anonymous' };
    const projectTarget = projects.find(p => p.id === projectId);
    const updatedHistory = [...(projectTarget.noteHistory || []), newNoteObj];

    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, noteHistory: updatedHistory, lastUpdatedBy: newNoteObj.author } : p));
    setNewNotesMap(prev => ({...prev, [projectId]: ''}));

    if (db) {
      try { await setDoc(getDocRef('project_tracking', projectId), { ...projectTarget, noteHistory: updatedHistory, lastUpdatedBy: newNoteObj.author }); } 
      catch (e) { showMessage("Simpan Catatan Gagal!\nError: " + e.message); }
    }
  };

  const handleSaveProject = async () => {
    if (!projectForm.client || !projectForm.pm) { showMessage('Nama Client dan PM Wajib diisi!'); return; }
    const newProject = { ...projectForm, lastUpdatedBy: activeUser?.displayName || activeUser?.email || 'Anonymous' };
    if (!newProject.id) newProject.id = Date.now().toString();
    if (newProject.newDraftNote && newProject.newDraftNote.trim()) {
      newProject.noteHistory = [...(newProject.noteHistory || []), { text: newProject.newDraftNote.trim(), timestamp: new Date().toISOString(), author: newProject.lastUpdatedBy }];
    }
    delete newProject.newDraftNote;

    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === newProject.id);
      if (idx >= 0) { const up = [...prev]; up[idx] = newProject; return up; }
      return [newProject, ...prev];
    });
    
    setIsProjectModalOpen(false); 
    setProjectForm({ id: '', client: '', priority: 'Medium', pm: '', backup: '', sales: '', status: 'Not started', phase: 'Identifikasi', startDate: '', endDate: '', linkDoc: '', noteHistory: [] });

    if (db) {
      try { await setDoc(getDocRef('project_tracking', newProject.id), newProject); } 
      catch (error) { showMessage("Simpan Form Gagal!\nError: " + error.message); }
    }
  };

  const handleDeleteProject = (id) => {
    showConfirm('Anda yakin ingin menghapus project ini secara permanen?', async () => {
      if (canDeleteProject && db) {
        setProjects(prev => prev.filter(p => p.id !== id));
        setSelectedProjects(prev => prev.filter(pid => pid !== id));
        try { await deleteDoc(getDocRef('project_tracking', id)); } catch(e) { showMessage("Hapus Data Gagal: " + e.message); }
      }
    });
  };

  const handleBulkDeleteProjects = () => {
    if (selectedProjects.length === 0) return;
    showConfirm(`Hapus ${selectedProjects.length} project terpilih secara permanen?`, async () => {
      if (canDeleteProject && db) {
        setProjects(prev => prev.filter(p => !selectedProjects.includes(p.id)));
        const idsToDelete = [...selectedProjects];
        setSelectedProjects([]);
        try { await Promise.all(idsToDelete.map(id => deleteDoc(getDocRef('project_tracking', id)))); } 
        catch (error) { showMessage("Gagal Bulk Delete: " + error.message); }
      }
    });
  };

  const handleInlineProjectUpdate = async (id, field, value) => {
    let updatedItemObj = null;
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        updatedItemObj = { ...p, [field]: value, lastUpdatedBy: activeUser?.displayName || activeUser?.email || 'Anonymous' };
        return updatedItemObj;
      }
      return p;
    })); 
    if (db && updatedItemObj) {
      try { await setDoc(getDocRef('project_tracking', id), updatedItemObj); } 
      catch (error) { showMessage("Inline Update Gagal: " + error.message); }
    }
  };

  // HANDLERS ADMIN ROLE
  const handleSaveUserRole = async (e) => {
    e.preventDefault();
    if (userRole !== 'admin') return;

    const formEmail = e.target.email.value.toLowerCase().trim();
    const roleValue = e.target.role.value;
    if (!formEmail || !formEmail.includes('@')) { showMessage("Format email tidak valid!"); return; }
    if (formEmail === 'nafi@kayreach.com') { showMessage("Email Owner utama tidak bisa diubah."); return; }

    const roleData = { id: formEmail, email: formEmail, role: roleValue, lastUpdatedBy: activeUser?.email || 'System', updatedAt: new Date().toISOString() };
    setManagedRoles(prev => {
      const idx = prev.findIndex(r => r.id === formEmail);
      if(idx >= 0) { const up = [...prev]; up[idx] = roleData; return up; }
      return [...prev, roleData];
    });
    e.target.reset();

    if (db) {
      try { await setDoc(getDocRef('user_roles', formEmail), roleData); } 
      catch (error) { showMessage("Gagal menyimpan role: " + error.message); }
    }
  };

  const handleDeleteUserRole = (emailToDelete) => {
    showConfirm(`Hapus kustomisasi role untuk ${emailToDelete}?`, async () => {
      if (userRole === 'admin' && db) {
        setManagedRoles(prev => prev.filter(r => r.id !== emailToDelete));
        try { await deleteDoc(getDocRef('user_roles', emailToDelete)); } 
        catch (error) { showMessage("Gagal menghapus role: " + error.message); }
      }
    });
  };

  // HANDLER FORM KPI
  const handleSimpanFormClick = async () => {
    let isMissingMandatoryOther = false;
    if (activeRoleConfig.isOtherRequired) {
      ['kualitatif', 'pengembangan', 'kultur'].forEach(catId => {
        METRICS_CONFIG[catId].items.forEach(item => {
          if (!formData.metrics[catId]?.[item.id]?.[activeRoleConfig.scoreKey]) isMissingMandatoryOther = true;
        });
      });
    }

    if (isMissingMandatoryOther) { showMessage("Terdapat skor yang WAJIB Anda isi (1-10)."); return; }
    
    const stats = calculateStatsForForm(formData.metrics, activeRoleConfig);
    const scoreInfo = getScoreInfo(stats.finalScore);
    const newEvalData = {
       id: `eval_${Date.now()}`, name: formData.name, scores: stats.averages, finalScore: stats.finalScore, status: scoreInfo.label,
       rawMetrics: formData.metrics, submittedRoles: [activeRoleConfig.id] 
    };

    setEvaluations(prev => {
       const idx = prev.findIndex(e => e.name === formData.name);
       if (idx >= 0) {
          const updated = [...prev];
          newEvalData.id = updated[idx].id;
          newEvalData.submittedRoles = [...new Set([...(updated[idx].submittedRoles || []), activeRoleConfig.id])];
          updated[idx] = { ...updated[idx], ...newEvalData };
          return updated;
       }
       return [newEvalData, ...prev];
    });

    showMessage("Nilai KPI Berhasil Disimpan!");
    setFormData({ name: '', metrics: {} });
    setActiveTab('dashboard'); 

    if (db) {
      try { await setDoc(getDocRef('kpi_evaluations', newEvalData.id), newEvalData); } 
      catch(e) { showMessage("Gagal menyimpan KPI: " + e.message); }
    }
  };

  // EXPORT / IMPORT
  const downloadCSV = (headers, rows, filename) => {
    const csvContent = [headers, ...rows].map(row => row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; link.click();
  };

  const handleExportKPI = () => {
    const headers = ['Nama PSE', 'Skor Kuantitatif', 'Skor Kualitatif', 'Skor Pengembangan', 'Skor Kultur', 'Skor Akhir', 'Status'];
    const rows = evaluations.map(emp => [
      emp.name || '-', Number(emp.scores?.kuantitatif || 0).toFixed(2), Number(emp.scores?.kualitatif || 0).toFixed(2),
      Number(emp.scores?.pengembangan || 0).toFixed(2), Number(emp.scores?.kultur || 0).toFixed(2), Number(emp.finalScore || 0).toFixed(2), emp.status || '-'
    ]);
    downloadCSV(headers, rows, "Rekap_KPI_Export.csv");
  };

  const handleExportProjects = () => {
    const headers = ['ID Sistem', 'Nama Klien / Project', 'Prioritas', 'PM (Primary PSE)', 'Backup PSE', 'Sales', 'Start Date', 'Estimation End Date', 'Fase / Milestone', 'Status', 'Riwayat Catatan', 'Link Dokumentasi', 'Terakhir Diupdate'];
    const rows = projects.map(p => {
      const notesMerged = p.noteHistory?.map(n => `[${new Date(n.timestamp).toLocaleDateString()}] ${n.author}: ${n.text}`).join(' | ') || '-';
      return [ p.id, p.client, p.priority, p.pm, p.backup, p.sales || '-', p.startDate || '-', p.endDate || '-', p.phase, p.status, notesMerged, p.linkDoc || '-', p.lastUpdatedBy || '-' ];
    });
    downloadCSV(headers, rows, "Project_Monitoring_Export.csv");
  };

  const handleImportProjects = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (!window.XLSX) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          script.onload = resolve; script.onerror = () => reject(new Error('Gagal memuat library Excel')); document.body.appendChild(script);
        });
      }

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = window.XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonRows = window.XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "" });

          if (jsonRows.length === 0) { showMessage("File kosong atau format salah."); return; }

          const mapPseName = (val) => {
            if (!val || typeof val !== 'string') return '';
            const v = val.toLowerCase();
            if (v.includes('dayat') || v.includes('hidayat')) return 'Dayat';
            if (v.includes('yanuar')) return 'Yanuar';
            if (v.includes('arfindo')) return 'Arfindo';
            if (v.includes('damardjati')) return 'Damardjati';
            if (v.includes('kuncoro')) return 'Eko Kuncoro';
            if (v.includes('fakhri')) return 'Fakhri';
            if (v.includes('ghazy')) return 'Ghazy';
            if (v.includes('pankaj')) return 'Pankaj';
            if (v.includes('syamil')) return 'Syamil';
            if (v.includes('hakim')) return 'Hakim';
            return val.split(' ')[0]; 
          };

          const parseExcelDate = (val) => {
             if (!val) return '';
             if (val.match(/^\d{4}-\d{2}-\d{2}$/)) return val;
             try { const d = new Date(val); if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]; } catch(e) {}
             return '';
          };

          let importedCount = 0;
          const newProjectsList = [...projects];
          const firestorePromises = [];

          for (const row of jsonRows) {
            const getVal = (keys) => {
              const rowKeys = Object.keys(row);
              for (let k of keys) {
                const foundKey = rowKeys.find(rk => rk.trim().toLowerCase() === k.toLowerCase());
                if (foundKey && row[foundKey]) return String(row[foundKey]).trim();
              }
              return '';
            };

            const client = getVal(['Nama Klien / Project', 'User', 'Client', 'Nama Klien']);
            if (!client || client === '' || client.includes(',,,,')) continue;

            const initialNoteText = getVal(['Catatan Update', 'Catatan', 'Notes', 'Milestone Deskripsi']);
            const initialNoteHistory = initialNoteText ? [{ text: initialNoteText, timestamp: new Date().toISOString(), author: 'System Import' }] : [];

            const newProj = {
              id: getVal(['ID Sistem']) || `proj_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
              client: client,
              priority: getVal(['Prioritas', 'Priority']) || 'Medium',
              pm: mapPseName(getVal(['PM (Primary PSE)', 'PM'])),
              backup: mapPseName(getVal(['Backup PSE', 'Backup'])),
              sales: getVal(['Sales', 'Nama Sales', 'Sales Person']) || '',
              phase: getVal(['Fase / Milestone', 'Status Project', 'Milestone']) || 'Identifikasi',
              status: getVal(['Status']) || 'Not started',
              startDate: parseExcelDate(getVal(['Start date', 'Start'])),
              endDate: parseExcelDate(getVal(['End date', 'End', 'Estimation End'])),
              linkDoc: getVal(['Link Documentation', 'Link Dokumen', 'Link']) || '',
              noteHistory: initialNoteHistory,
              lastUpdatedBy: activeUser?.displayName || activeUser?.email || 'System'
            };

            const existingIndex = newProjectsList.findIndex(p => p.id === newProj.id || p.client.toLowerCase() === newProj.client.toLowerCase());
            
            if (existingIndex >= 0) {
              const oldNotes = newProjectsList[existingIndex].noteHistory || [];
              if (initialNoteHistory.length > 0) newProj.noteHistory = [...oldNotes, ...initialNoteHistory];
              newProjectsList[existingIndex] = { ...newProjectsList[existingIndex], ...newProj };
            } else newProjectsList.push(newProj);

            if (db) firestorePromises.push(setDoc(getDocRef('project_tracking', newProj.id), newProj));
            importedCount++;
          }

          setProjects(newProjectsList); 
          if (firestorePromises.length > 0 && db) {
             try { await Promise.all(firestorePromises); }
             catch(e) { showMessage("Gagal Push ke Firebase (sebagian/semua): " + e.message); }
          }
          showMessage(`Berhasil! ${importedCount} project sukses diimpor dan dipetakan.`);
        } catch (error) { showMessage("Terjadi kesalahan saat membaca file. Pastikan format file sesuai."); }
        e.target.value = null; 
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      showMessage("Gagal memuat library pemroses Excel.");
      e.target.value = null;
    }
  };


  // --- RENDERERS ---
  const renderDialog = () => {
    if (!dialog) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 print:hidden">
        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            {dialog.type === 'confirm' ? <AlertCircle className="text-orange-500 mr-2"/> : <AlertCircle className="text-blue-500 mr-2"/>}
            {dialog.type === 'confirm' ? 'Konfirmasi Aksi' : 'Informasi Sistem'}
          </h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed whitespace-pre-line">{dialog.message}</p>
          <div className="flex justify-end gap-3">
            {dialog.type === 'confirm' && (
              <button onClick={() => setDialog(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Batal</button>
            )}
            <button onClick={() => {
              if (dialog.type === 'confirm' && dialog.onConfirm) dialog.onConfirm();
              setDialog(null);
            }} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
              {dialog.type === 'confirm' ? 'Ya, Lanjutkan' : 'Tutup'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedPseDetailId) return null;
    const emp = evaluations.find(e => e.id === selectedPseDetailId);
    if (!emp) return null;

    const statusConfig = SCORING_RULES.find(r => r.label === emp.status) || SCORING_RULES[4];
    const raw = emp.rawMetrics || {};
    const empProjects = projects.filter(p => p.pm === emp.name || p.backup === emp.name);

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200 print:absolute print:inset-0 print:p-0 print:bg-white print:overflow-visible">
        <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-gray-200 animate-in slide-in-from-bottom-4 print:border-none print:shadow-none print:max-h-none print:overflow-visible">
          
          <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-start bg-slate-50 relative print:bg-white print:border-b-2 print:border-gray-800">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-inner print:border print:border-gray-300 print:text-black print:bg-white ${statusConfig.barColor}`}>
                {String(emp.name || 'U').charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Rapor Kinerja: {emp.name}</h2>
                <p className="text-sm font-semibold text-gray-500 print:text-black">Pre-Sales Engineer (PSE)</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-center mr-8 print:mr-0">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1 print:text-gray-800">Skor Akhir</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black text-gray-800 leading-none">{Number(emp.finalScore || 0).toFixed(2)}</span>
                  <span className={`px-3 py-1 rounded-md text-xs font-bold shadow-sm print:border print:border-gray-400 ${statusConfig.color}`}>{emp.status}</span>
                </div>
              </div>
              <button onClick={() => window.print()} className="ml-4 flex flex-col items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors print:hidden" title="Cetak / Simpan PDF">
                <Printer size={20} className="mb-1" />
                <span className="text-[10px] font-bold uppercase">Print</span>
              </button>
            </div>

            <button onClick={() => setSelectedPseDetailId(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 hover:bg-gray-200 p-2 rounded-full transition-colors print:hidden">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 md:p-6 overflow-y-auto bg-white flex-1 space-y-8 print:overflow-visible">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4">
              {Object.entries(METRICS_CONFIG).map(([catId, category]) => (
                <section key={catId} className="break-inside-avoid">
                  <div className="flex items-center gap-2 mb-3 border-b border-gray-200 pb-2">
                    <CheckCircle2 className="text-blue-500 print:hidden" size={18} />
                    <h3 className="text-md font-bold text-gray-800 uppercase tracking-wide">{category.title}</h3>
                  </div>
                  <div className="space-y-3">
                    {category.items.map(item => {
                      const data = raw[catId]?.[item.id] || {};
                      const isAuto = category.type === 'auto';
                      const finalSkor = isAuto ? data.skor : Math.max(data.skorTop||0, data.skorManager||0, data.skorPeerManager||0, data.skorPeer||0);

                      return (
                        <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100 print:bg-white print:border-gray-300">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-gray-700 text-sm">{item.label}</p>
                            <span className="text-sm font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 print:border-none print:bg-transparent">
                              Skor: {finalSkor || '-'} / 10
                            </span>
                          </div>
                          {isAuto && data.realisasi !== undefined && (
                            <div className="mt-1.5 flex items-end gap-1">
                              <span className="text-xl font-bold text-gray-800 leading-none">{data.realisasi}</span>
                              <span className="text-[10px] font-semibold text-gray-500 mb-0.5">{item.unit}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <section className="mt-8 break-inside-avoid print:mt-4">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
                <Briefcase className="text-blue-500 print:hidden" size={20} />
                <h3 className="text-lg font-bold text-gray-800">Daftar Project Terlibat ({empProjects.length} Project)</h3>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-1 overflow-x-auto print:bg-transparent print:border-none">
                <table className="w-full text-left text-sm text-gray-600 border-collapse">
                  <thead className="bg-white text-gray-700 font-bold text-xs uppercase border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2">Nama Client / Project</th>
                      <th className="px-3 py-2">Peran</th>
                      <th className="px-3 py-2">Fase Saat Ini</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {empProjects.length > 0 ? empProjects.map((p, idx) => (
                      <tr key={idx} className="bg-white print:bg-transparent">
                        <td className="px-3 py-2 font-semibold text-gray-800">{p.client}</td>
                        <td className="px-3 py-2 text-xs">{p.pm === emp.name ? <span className="text-blue-600 font-bold">PM Utama</span> : <span className="text-orange-500 font-semibold">Backup</span>}</td>
                        <td className="px-3 py-2 text-xs">{p.phase}</td>
                        <td className="px-3 py-2 text-center text-xs font-bold">{p.status}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="text-center py-4 text-gray-400 italic">Belum ada project yang diassign ke PSE ini.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            
          </div>
        </div>
      </div>
    );
  };

  const renderAdminPanel = () => {
    if (userRole !== 'admin') {
      return (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
          <ShieldAlert size={64} className="text-red-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">Akses Ditolak</h2>
          <p className="text-gray-500 mt-2">Halaman ini eksklusif hanya untuk Owner / Admin sistem.</p>
        </div>
      );
    }

    const allKnownEmails = new Set([...Object.keys(DEFAULT_ROLES), ...managedRoles.map(r => r.id)]);
    const combinedRolesList = Array.from(allKnownEmails).map(email => {
      const customData = managedRoles.find(r => r.id === email);
      return { email: email, role: customData ? customData.role : DEFAULT_ROLES[email], isCustom: !!customData, lastUpdatedBy: customData ? customData.lastUpdatedBy : 'System Default' };
    }).sort((a, b) => {
      if (a.role === 'admin') return -1;
      if (b.role === 'admin') return 1;
      if (a.role === 'manager_pse' && b.role !== 'manager_pse') return -1;
      if (b.role === 'manager_pse' && a.role !== 'manager_pse') return 1;
      return a.email.localeCompare(b.email);
    });

    return (
      <div className="space-y-6 animate-in slide-in-from-left-4">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-lg flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black mb-2 flex items-center"><Settings className="mr-3" /> Admin & Access Control Panel</h2>
            <p className="text-slate-300 text-sm">Kelola privilege pengguna. Anda dapat mendaftarkan karyawan baru atau menaikkan status menjadi Manager tanpa perlu mengubah kode.</p>
          </div>
          <UserCog size={64} className="text-slate-700 hidden md:block" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-5">Setel Hak Akses Baru</h3>
              <form onSubmit={handleSaveUserRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Alamat Email Google</label>
                  <input type="email" name="email" required placeholder="email@kayreach.com" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Pilih Privilege Role</label>
                  <select name="role" required className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold">
                    <option value="staff">Staff / PSE (Akses Terbatas)</option>
                    <option value="manager_pse">Manager PSE (Wajib Menilai Semua)</option>
                    <option value="manager_other">Manager Divisi Lain (Opsional, Tanpa Kuantitatif)</option>
                    <option value="admin">Admin (Akses Penuh)</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center transition-colors mt-2">
                  <Save size={18} className="mr-2" /> Simpan Konfigurasi
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-slate-50">
                <h3 className="text-lg font-bold text-gray-800">Daftar Pengguna Terdaftar</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-100 text-gray-700 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Alamat Email</th>
                      <th className="px-6 py-4 text-center">Tipe Role</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {combinedRolesList.map((item) => {
                      let roleStyle = "bg-gray-100 text-gray-600";
                      if (item.role === 'admin') roleStyle = "bg-purple-100 text-purple-700 border border-purple-200";
                      else if (item.role === 'manager_pse') roleStyle = "bg-blue-100 text-blue-700 border border-blue-200";
                      else if (item.role === 'manager_other') roleStyle = "bg-orange-100 text-orange-700 border border-orange-200";
                      else if (item.role === 'staff') roleStyle = "bg-emerald-100 text-emerald-700 border border-emerald-200";

                      return (
                        <tr key={item.email} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-3 font-semibold text-gray-800">{item.email}</td>
                          <td className="px-6 py-3 text-center">
                            <span className={`px-3 py-1 rounded text-xs font-bold shadow-sm uppercase ${roleStyle}`}>{item.role === 'manager_other' ? 'Manager Div. Lain' : item.role === 'manager_pse' ? 'Manager PSE' : item.role}</span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            {item.isCustom && item.email !== 'nafi@kayreach.com' && (
                              <button onClick={() => handleDeleteUserRole(item.email)} className="p-1.5 text-red-500 hover:bg-red-100 rounded transition" title="Kembalikan ke Default / Hapus Override">
                                <Trash2 size={16}/>
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectTracking = () => {
    // FUNGSI SORTING OTOMATIS: Berdasarkan Priority (High duluan), lalu Target End (Paling cepat duluan)
    const displayProjects = visibleProjects.filter(proj => {
      const clientName = proj.client || '';
      const matchSearch = clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPriority = projectFilters.priority ? proj.priority === projectFilters.priority : true;
      const matchPM = projectFilters.pm ? (proj.pm === projectFilters.pm || proj.backup === projectFilters.pm) : true;
      const matchPhase = projectFilters.phase ? proj.phase === projectFilters.phase : true;
      const matchStatus = projectFilters.status ? proj.status === projectFilters.status : true;
      return matchSearch && matchPriority && matchPM && matchPhase && matchStatus;
    }).sort((a, b) => {
      // 1. Sort Priority
      const priorityMap = { 'High': 1, 'Medium': 2, 'Low': 3 };
      const pA = priorityMap[a.priority] || 4;
      const pB = priorityMap[b.priority] || 4;
      
      if (pA !== pB) return pA - pB;

      // 2. Sort Target End Date (Ascending / Lebih Cepat di Atas)
      const dateA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
      const dateB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
      return dateA - dateB;
    });

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
          
          <div className="px-6 py-5 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Briefcase className="mr-2 text-blue-600" size={20}/> Database Project Monitoring (Ticketing)
              </h2>
              <p className="text-xs text-gray-500 font-semibold mt-1 flex items-center">
                <Activity size={12} className="mr-1 text-emerald-500"/>
                Data terurut otomatis berdasarkan <strong className="mx-1 text-gray-700">Prioritas Tinggi</strong> dan <strong className="ml-1 text-gray-700">Target Tanggal Terdekat</strong>.
              </p>
            </div>
            
            {canManageProjectFull && (
              <div className="flex flex-wrap items-center gap-2">
                {selectedProjects.length > 0 && (
                   <button onClick={handleBulkDeleteProjects} className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm animate-in fade-in zoom-in-95 mr-1" title="Hapus Project Terpilih">
                     <Trash2 size={16} className="mr-2" /> Hapus Terpilih ({selectedProjects.length})
                   </button>
                )}
                <input type="file" id="excel-import" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleImportProjects}/>
                <button onClick={() => document.getElementById('excel-import').click()} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm" title="Upload Excel/CSV">
                  <Upload size={16} className="mr-2" /> Import Excel/CSV
                </button>
                <button onClick={handleExportProjects} className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm">
                  <Download size={16} className="mr-2" /> Export
                </button>
                <button onClick={() => { setProjectForm({ id: '', client: '', priority: 'Medium', pm: '', backup: '', sales: '', status: 'Not started', phase: 'Identifikasi', startDate: '', endDate: '', linkDoc: '', noteHistory: [] }); setIsProjectModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm ml-1">
                  <Plus size={16} className="mr-2" /> Tambah Project
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border-y border-gray-200 px-6 py-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="text-gray-400 mr-2"/>
              <input type="text" placeholder="Cari nama project / client..." className="bg-transparent text-sm outline-none w-full font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium bg-white shadow-sm outline-none hover:border-gray-400 focus:border-blue-500 transition-colors" value={projectFilters.priority} onChange={(e) => setProjectFilters({...projectFilters, priority: e.target.value})}>
              <option value="">Semua Prioritas</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select disabled={userRole === 'staff'} className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium bg-white shadow-sm outline-none disabled:bg-gray-100 disabled:text-gray-400 hover:border-gray-400 focus:border-blue-500 transition-colors" value={projectFilters.pm} onChange={(e) => setProjectFilters({...projectFilters, pm: e.target.value})}>
              <option value="">Semua PSE</option>
              {PSE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium bg-white shadow-sm outline-none hover:border-gray-400 focus:border-blue-500 transition-colors" value={projectFilters.phase} onChange={(e) => setProjectFilters({...projectFilters, phase: e.target.value})}>
              <option value="">Semua Fase</option>
              <option value="Identifikasi">Identifikasi Awal</option>
              <option value="Penawaran & Proposal">Penawaran & Proposal</option>
              <option value="PoC & Testing">PoC & Testing</option>
              <option value="Instalasi">Instalasi & Deployment</option>
              <option value="BAST">BAST / Handover</option>
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium bg-white shadow-sm outline-none hover:border-gray-400 focus:border-blue-500 transition-colors" value={projectFilters.status} onChange={(e) => setProjectFilters({...projectFilters, status: e.target.value})}>
              <option value="">Semua Status</option>
              <option value="Not started">Not started</option>
              <option value="In progress">In progress</option>
              <option value="Pending">Pending (Hold)</option>
              <option value="Completed">Completed (Won)</option>
            </select>
            {(projectFilters.priority || projectFilters.pm || projectFilters.phase || projectFilters.status || searchQuery) && (
              <button onClick={() => {setProjectFilters({priority:'', pm:'', phase:'', status:''}); setSearchQuery('');}} className="text-sm text-red-500 hover:text-red-700 font-bold px-2 py-2 flex items-center transition-colors">
                <RefreshCw size={14} className="mr-1.5"/> Reset Filter
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 border-collapse min-w-[1450px]">
              <thead className="bg-slate-50 text-gray-700 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-200">
                <tr>
                  {canDeleteProject && (
                    <th className="px-4 py-4 w-12 text-center border-r border-gray-200">
                      <input 
                        type="checkbox" 
                        onChange={(e) => handleSelectAllProjects(e, displayProjects)} 
                        checked={displayProjects.length > 0 && selectedProjects.length === displayProjects.length} 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 shadow-sm" 
                      />
                    </th>
                  )}
                  <th className="px-4 py-4 w-56">Nama Klien / Project</th>
                  <th className="px-4 py-4 w-28 text-center">Prioritas</th>
                  <th className="px-4 py-4 w-40">Tim PSE (Inline Edit)</th>
                  <th className="px-4 py-4 w-40">Sales (Inline Edit)</th>
                  <th className="px-4 py-4 w-40">Timeline (Tgl)</th>
                  <th className="px-4 py-4 w-40">Fase (Milestone)</th>
                  <th className="px-4 py-4 text-center w-36">Status</th>
                  <th className="px-4 py-4 min-w-[340px]">Histori Catatan / Update Progress</th>
                  <th className="px-4 py-4 w-44 text-center">Dokumen</th>
                  {canManageProjectFull && <th className="px-4 py-4 text-center w-24">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayProjects.map((proj) => {
                  let statusColor = "bg-gray-50 text-gray-600 border-gray-200";
                  if(proj.status === 'Completed') statusColor = "bg-green-50 text-green-700 border-green-200";
                  else if(proj.status === 'In progress') statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                  else if(proj.status === 'Pending') statusColor = "bg-orange-50 text-orange-700 border-orange-200";

                  let priorityColor = "bg-gray-50 text-gray-600 border-gray-200";
                  if(proj.priority === 'High') priorityColor = "bg-red-50 text-red-600 border-red-200";
                  else if(proj.priority === 'Medium') priorityColor = "bg-yellow-50 text-yellow-600 border-yellow-200";

                  const isSelected = selectedProjects.includes(proj.id);

                  return (
                    <tr key={proj.id} className={`hover:bg-blue-50/50 transition-colors group items-start ${isSelected ? 'bg-blue-50/70' : ''}`}>
                      {canDeleteProject && (
                        <td className="px-4 py-4 align-top text-center border-r border-gray-100">
                           <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => handleSelectProject(proj.id)} 
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 mt-1" 
                           />
                        </td>
                      )}
                      <td className="px-4 py-4 align-top">
                        <p className="font-bold text-gray-800 text-base leading-tight">{proj.client}</p>
                      </td>
                      <td className="px-4 py-4 align-top text-center">
                        <select 
                          disabled={!canManageProjectFull}
                          value={proj.priority} 
                          onChange={(e) => handleInlineProjectUpdate(proj.id, 'priority', e.target.value)}
                          className={`w-full text-[11px] font-bold px-2 py-1.5 rounded border outline-none text-center transition ${priorityColor} ${!canManageProjectFull ? 'appearance-none cursor-default opacity-80' : 'cursor-pointer hover:shadow-sm'}`}
                        >
                          <option value="High">HIGH</option><option value="Medium">MEDIUM</option><option value="Low">LOW</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">PM Utama</span>
                            <select 
                              disabled={!canManageProjectFull}
                              value={proj.pm || ''} 
                              onChange={(e) => handleInlineProjectUpdate(proj.id, 'pm', e.target.value)}
                              className={`w-full text-xs font-bold px-2 py-1.5 rounded border outline-none transition ${canManageProjectFull ? 'bg-white border-gray-300 text-blue-700 hover:border-blue-400 focus:border-blue-500 cursor-pointer shadow-sm' : 'bg-gray-50 text-gray-600 border-transparent appearance-none cursor-default'}`}
                            >
                              <option value="">- Set PM -</option>
                              {PSE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          <div className="flex flex-col mt-0.5">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Backup</span>
                            <select 
                              disabled={!canManageProjectFull}
                              value={proj.backup || ''} 
                              onChange={(e) => handleInlineProjectUpdate(proj.id, 'backup', e.target.value)}
                              className={`w-full text-xs font-semibold px-2 py-1.5 rounded border outline-none transition ${canManageProjectFull ? 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 focus:border-blue-500 cursor-pointer shadow-sm' : 'bg-gray-50 text-gray-500 border-transparent appearance-none cursor-default'}`}
                            >
                              <option value="">- Set Backup -</option>
                              {PSE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Assigned Sales</span>
                          <select 
                            disabled={!canManageProjectFull}
                            value={proj.sales || ''} 
                            onChange={(e) => handleInlineProjectUpdate(proj.id, 'sales', e.target.value)}
                            className={`w-full text-xs font-semibold px-2 py-1.5 rounded border outline-none transition ${canManageProjectFull ? 'bg-white border-gray-300 text-gray-800 hover:border-blue-400 focus:border-blue-500 cursor-pointer shadow-sm' : 'bg-gray-50 text-gray-600 border-transparent appearance-none cursor-default'}`}
                          >
                            <option value="">- Pilih Sales -</option>
                            {SALES_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          <div>
                             <span className="text-[10px] font-bold text-gray-400 block mb-0.5 uppercase tracking-wider">Start</span>
                             <input type="date" value={proj.startDate || ''} onChange={(e) => handleInlineProjectUpdate(proj.id, 'startDate', e.target.value)} className="w-full text-xs border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white bg-gray-50 rounded px-2 py-1.5 outline-none transition" />
                          </div>
                          <div>
                             <span className="text-[10px] font-bold text-gray-400 block mb-0.5 uppercase tracking-wider">Target End</span>
                             <input type="date" value={proj.endDate || ''} onChange={(e) => handleInlineProjectUpdate(proj.id, 'endDate', e.target.value)} className="w-full text-xs border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white bg-gray-50 rounded px-2 py-1.5 outline-none transition" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <select 
                          value={proj.phase} 
                          onChange={(e) => handleInlineProjectUpdate(proj.id, 'phase', e.target.value)}
                          className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded px-2 py-2 text-xs font-bold text-gray-700 outline-none cursor-pointer transition shadow-sm"
                        >
                          <option value="Identifikasi">Identifikasi Awal</option>
                          <option value="Penawaran & Proposal">Penawaran & Proposal</option>
                          <option value="PoC & Testing">PoC & Testing</option>
                          <option value="Instalasi">Instalasi & Deployment</option>
                          <option value="BAST">BAST / Handover</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 align-top text-center">
                        <select 
                          value={proj.status} 
                          onChange={(e) => handleInlineProjectUpdate(proj.id, 'status', e.target.value)}
                          className={`w-full px-2 py-2 rounded text-[11px] font-bold border shadow-sm outline-none cursor-pointer text-center transition ${statusColor}`}
                        >
                          <option value="Not started">Not started</option><option value="In progress">In progress</option><option value="Pending">Pending (Hold)</option><option value="Completed">Completed (Won)</option>
                        </select>
                      </td>
                      
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          <div className="max-h-[110px] overflow-y-auto space-y-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5 shadow-inner">
                            {proj.noteHistory && proj.noteHistory.map((n, i) => (
                               <div key={i} className="text-[11px] border-b border-gray-200 pb-1.5 last:border-0 last:pb-0">
                                 <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-gray-800">{n.author}</span>
                                    <span className="text-[9px] font-semibold text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                      {new Date(n.timestamp).toLocaleString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}
                                    </span>
                                 </div>
                                 <p className="text-gray-600 leading-relaxed">{n.text}</p>
                               </div>
                            ))}
                            {(!proj.noteHistory || proj.noteHistory.length === 0) && <span className="text-gray-400 text-[10px] italic flex items-center justify-center h-full">Belum ada catatan progres.</span>}
                          </div>
                          <div className="flex gap-1.5">
                             <input 
                               type="text" 
                               value={newNotesMap[proj.id] || ''} 
                               onChange={(e) => setNewNotesMap({...newNotesMap, [proj.id]: e.target.value})} 
                               onKeyDown={(e) => e.key === 'Enter' && handleAddNoteToProject(proj.id)} 
                               placeholder="Ketik update progres (Enter)..." 
                               className="text-xs w-full border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" 
                             />
                             <button onClick={() => handleAddNoteToProject(proj.id)} disabled={!newNotesMap[proj.id]} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg border border-transparent transition shadow-sm" title="Simpan Catatan">
                               <Send size={14}/>
                             </button>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-1.5 justify-center">
                          <input 
                            type="url" 
                            value={proj.linkDoc || ''} 
                            onChange={(e) => handleInlineProjectUpdate(proj.id, 'linkDoc', e.target.value)}
                            placeholder="Link GDrive..."
                            className="w-full text-xs border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white bg-gray-50 rounded px-2 py-2 outline-none transition"
                          />
                          {proj.linkDoc && (
                            <a href={proj.linkDoc} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition shadow-sm" title="Buka Dokumen di Tab Baru">
                              <FileText size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                      {canManageProjectFull && (
                        <td className="px-4 py-4 align-top text-center">
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <button onClick={() => {setProjectForm(proj); setIsProjectModalOpen(true);}} className="p-1.5 text-blue-600 hover:bg-blue-100 hover:text-blue-800 rounded transition" title="Edit Detail Project">
                              <FileEdit size={16}/>
                            </button>
                            {canDeleteProject && (
                              <button onClick={() => handleDeleteProject(proj.id)} className="p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700 rounded transition" title="Hapus Project">
                                <Trash2 size={16}/>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
                {displayProjects.length === 0 && (
                  <tr><td colSpan="11" className="text-center py-12 text-gray-500 font-medium bg-gray-50">Tidak ada project yang sesuai dengan filter pencarian Anda.</td></tr>
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
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nama Client / Project</label>
                  <input type="text" value={projectForm.client} onChange={e=>setProjectForm({...projectForm, client: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Traveloka - Upgrade" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Prioritas</label>
                    <select value={projectForm.priority} onChange={e=>setProjectForm({...projectForm, priority: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                      <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Sales Person</label>
                    <select value={projectForm.sales || ''} onChange={e=>setProjectForm({...projectForm, sales: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                      <option value="">- Pilih Sales -</option>
                      {SALES_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
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
                
                {/* TIMELINE FIELDS */}
                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div>
                    <label className="block text-sm font-bold text-blue-800 mb-1">Start Date</label>
                    <input type="date" value={projectForm.startDate || ''} onChange={e=>setProjectForm({...projectForm, startDate: e.target.value})} className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-800 mb-1">Estimation End Date</label>
                    <input type="date" value={projectForm.endDate || ''} onChange={e=>setProjectForm({...projectForm, endDate: e.target.value})} className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Fase / Milestone Saat Ini</label>
                    <select value={projectForm.phase} onChange={e=>setProjectForm({...projectForm, phase: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none font-medium">
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
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tambahkan Catatan Baru (Opsional)</label>
                  <textarea value={projectForm.newDraftNote || ''} onChange={e=>setProjectForm({...projectForm, newDraftNote: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows="2" placeholder="Catatan ini akan ditambahkan ke log histori..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Link Dokumentasi GDrive (Opsional)</label>
                  <input type="url" value={projectForm.linkDoc || ''} onChange={e=>setProjectForm({...projectForm, linkDoc: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://drive.google.com/..." />
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                <button onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg">Batal</button>
                <button onClick={handleSaveProject} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center shadow-md">
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
    const sortedEvals = [...visibleEvaluations].sort((a, b) => b.finalScore - a.finalScore);
    const avgTeamScore = visibleEvaluations.length > 0 ? (visibleEvaluations.reduce((acc, curr) => acc + Number(curr.finalScore || 0), 0) / visibleEvaluations.length).toFixed(2) : 0;
    const topPerformers = sortedEvals.slice(0, 5);

    const distribution = SCORING_RULES.map(rule => ({
      ...rule,
      count: visibleEvaluations.filter(e => e.status === rule.label).length
    }));
    const maxDistribution = Math.max(...distribution.map(d => d.count), 1);

    const getProfilePhoto = (pseName) => {
      const email = Object.keys(EMAIL_TO_PSE_MAP).find(e => EMAIL_TO_PSE_MAP[e] === pseName);
      if (email && userProfiles[email] && userProfiles[email].photoURL) return userProfiles[email].photoURL;
      if (activeUser && staffIdentity === pseName && activeUser.photoURL) return activeUser.photoURL;
      return null;
    };

    const top1Photo = sortedEvals[0] ? getProfilePhoto(sortedEvals[0].name) : null;

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm flex items-center space-x-4">
            <div className="p-4 bg-blue-600 text-white rounded-xl shadow-inner"><Users size={28} /></div>
            <div>
              <p className="text-sm text-blue-600 font-semibold mb-1 uppercase tracking-wide">{userRole === 'staff' ? 'Identitas PSE' : 'Total Tim Dinilai'}</p>
              <p className="text-2xl font-black text-gray-800">{userRole === 'staff' ? (staffIdentity || 'Belum dipilih') : `${visibleEvaluations.length} PSE`}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center space-x-4">
            <div className="p-4 bg-emerald-500 text-white rounded-xl shadow-inner"><Activity size={28} /></div>
            <div>
              <p className="text-sm text-emerald-600 font-semibold mb-1 uppercase tracking-wide">{userRole === 'staff' ? 'Skor Akhir Anda' : 'Rata-rata Skor Tim'}</p>
              <p className="text-3xl font-black text-gray-800">{avgTeamScore} <span className="text-lg font-medium text-gray-500">/ 10.0</span></p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-2xl border border-purple-100 shadow-sm flex items-center space-x-4">
            <div className={`flex items-center justify-center rounded-xl shadow-inner shrink-0 overflow-hidden ${top1Photo ? 'w-14 h-14 bg-white border-2 border-purple-200' : 'p-4 bg-purple-600 text-white'}`}>
              {top1Photo ? <img src={top1Photo} alt="Top 1" className="w-full h-full object-cover" /> : <Award size={28} />}
            </div>
            <div>
              <p className="text-sm text-purple-600 font-semibold mb-1 uppercase tracking-wide">{userRole === 'staff' ? 'Status Anda' : 'Top Performer'}</p>
              <p className="text-xl font-black text-gray-800 truncate">{userRole === 'staff' ? (sortedEvals[0]?.status || 'Belum ada nilai') : (sortedEvals[0]?.name || '-')}</p>
            </div>
          </div>
        </div>

        {userRole !== 'staff' && (
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
                  const photoUrl = getProfilePhoto(emp.name);
                  
                  return (
                    <div key={emp.id} className="relative cursor-pointer group" onClick={() => setSelectedPseDetailId(emp.id)}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-700 flex items-center group-hover:text-blue-600 transition">
                          <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs mr-3 overflow-hidden border border-gray-200 shrink-0">
                            {photoUrl ? <img src={photoUrl} alt={emp.name} className="w-full h-full object-cover" /> : <span>{index + 1}</span>}
                          </div>
                          {emp.name}
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
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
          <div className="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{userRole === 'staff' ? 'Detail Skor Anda' : 'Detail Skor Tim Gabungan (360°)'}</h2>
            </div>
            
            {(userRole === 'admin' || ['manager_pse', 'manager_other'].includes(userRole)) && (
              <div className="flex gap-2">
                <button onClick={handleExportKPI} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm">
                  <Download size={16} className="mr-2" /> Export Rekap KPI (.csv)
                </button>
                <button onClick={() => setActiveTab('form')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm">
                  <FileEdit size={16} className="mr-2" /> Isi Nilai Baru
                </button>
              </div>
            )}
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
                      <td className="px-6 py-4 font-medium text-gray-900">{userRole === 'staff' ? '-' : idx + 1}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{emp.name}</p>
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
                {sortedEvals.length === 0 && (
                  <tr><td colSpan="8" className="text-center py-10 text-gray-500 font-medium">Data KPI Anda belum tersedia.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {renderDetailModal()}
      </div>
    );
  };

  const renderForm = () => {
    if (userRole === 'staff') {
      return (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
          <Lock size={64} className="text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">Akses Terbatas</h2>
          <p className="text-gray-500 mt-2">Hanya Admin dan Manager yang berhak mengisi form evaluasi 360°.</p>
        </div>
      );
    }

    const ActiveIcon = activeRoleConfig.icon;
    const currentEval = evaluations.find(e => e.name === formData.name);
    const hasSubmitted = currentEval?.submittedRoles?.includes(activeRoleConfig.id);
    const isLocked = hasSubmitted && !isRevisionMode;

    const liveStats = calculateStatsForForm(formData.metrics, activeRoleConfig);
    const liveScoreInfo = getScoreInfo(liveStats.finalScore);

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
          <div className={`flex items-center px-4 py-3 rounded-lg ${activeRoleConfig.color}`}>
            <ActiveIcon size={20} className="mr-3" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest mb-0.5 opacity-80">Hak Akses Sistem:</p>
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
               <button onClick={handleSimpanFormClick} className="flex-1 md:flex-none flex justify-center items-center px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-semibold shadow-md transition-colors">
                 <Save size={16} className="mr-2" /> {hasSubmitted ? 'Simpan Revisi' : 'Simpan Form'}
               </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-3">Pilih Karyawan yang Dinilai</h3>
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap PSE <span className="text-red-500">*</span></label>
                  <select value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-medium cursor-pointer">
                    <option value="" disabled>-- Pilih Karyawan --</option>
                    {PSE_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
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
                if (category.type === 'auto' && !activeRoleConfig.canRateQuant) return null;

                return (
                  <div key={catId} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in duration-300">
                    <div className="flex justify-between items-end border-b pb-3 mb-5">
                      <div>
                        <h3 className="text-lg font-extrabold text-gray-800">{category.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{category.desc}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {category.items.map(item => {
                        const itemData = formData.metrics[catId]?.[item.id] || {};
                        const myScoreKey = activeRoleConfig.scoreKey;
                        const isAutoScore = category.type === 'auto';

                        return (
                          <div key={item.id} className="p-5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-4 transition hover:border-gray-300">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-gray-800">{item.label}</p>
                              </div>
                              <div className="text-right hidden lg:block">
                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-black text-sm border-2 ${itemData.skor > 0 ? 'border-blue-200 text-blue-700 bg-white' : 'border-gray-200 text-gray-400 bg-white'}`}>
                                  {itemData.skor || '-'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-2">
                              {isAutoScore ? (
                                <>
                                  <div className="md:col-span-12 lg:col-span-6">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex justify-between items-center">
                                      <span>Aktual Realisasi <span className="text-emerald-500 ml-1">(Otomatis Terisi)</span></span>
                                      {itemData.realisasi > 0 && (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm animate-in zoom-in">
                                          + {(((Math.min((Number(itemData.realisasi) / item.target) * 10, 10)) / category.items.length) * category.weight).toFixed(2)} pts
                                        </span>
                                      )}
                                    </label>
                                    <input 
                                      type="number" 
                                      disabled 
                                      value={itemData.realisasi || '0'} 
                                      className="w-full bg-gray-200 border border-gray-300 text-gray-500 rounded-lg px-3 py-2.5 text-sm font-bold cursor-not-allowed" 
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1.5 italic">*Diambil otomatis dari sistem Project Monitoring</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="md:col-span-12">
                                    <label className="block text-xs font-bold text-gray-700 mb-2 flex justify-between items-center">
                                      <span>Pilih Skor Anda (1 - 10) {activeRoleConfig.isOtherRequired ? <span className="text-red-500 ml-1">*Wajib</span> : <span className="text-gray-400 font-normal ml-1">Opsional</span>}</span>
                                      {itemData[myScoreKey] > 0 && (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm animate-in zoom-in">
                                          + {((Number(itemData[myScoreKey]) / category.items.length) * category.weight).toFixed(2)} pts
                                        </span>
                                      )}
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                        <button
                                          key={n}
                                          disabled={isLocked}
                                          onClick={() => {
                                            const newData = {...formData};
                                            if(!newData.metrics[catId]) newData.metrics[catId] = {};
                                            if(!newData.metrics[catId][item.id]) newData.metrics[catId][item.id] = {};
                                            newData.metrics[catId][item.id][myScoreKey] = n;
                                            setFormData(newData);
                                          }}
                                          className={`w-9 h-9 md:w-10 md:h-10 rounded-lg font-black text-sm md:text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                                            Number(itemData[myScoreKey]) === n 
                                              ? 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-300 ring-offset-1' 
                                              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-800'
                                          }`}
                                        >
                                          {n}
                                        </button>
                                      ))}
                                    </div>
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
          
          <div className="lg:col-span-1 block w-full mt-4 lg:mt-0">
            {formData.name && (
              <div className="bg-slate-800 rounded-2xl p-6 shadow-xl sticky top-24 text-white border border-slate-700 animate-in slide-in-from-bottom-4 lg:slide-in-from-right-4">
                <h3 className="text-lg font-bold mb-6 flex items-center border-b border-slate-700 pb-4">
                  <BarChart3 className="mr-3 text-blue-400" /> Live Preview
                </h3>
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

  // --- RENDERING TAMPILAN UTAMA ---
  
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Memuat sistem keamanan...</p>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        {renderDialog()}
        <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-blue-100 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform -rotate-6 relative z-10">
              <BarChart3 size={32} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight relative z-10">PSE Workspace</h1>
            <p className="text-blue-100 text-sm mt-1 font-medium relative z-10">Project Monitoring & KPI Hub</p>
          </div>
          <div className="p-8 text-center">
            <h2 className="text-gray-800 font-bold text-lg mb-2">Selamat Datang</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">Silakan masuk menggunakan akun Google (Email Perusahaan) Anda untuk mengakses sistem ini.</p>
            
            <button 
              onClick={handleGoogleLogin} 
              className="w-full flex items-center justify-center px-6 py-3.5 bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl text-gray-700 font-bold transition-all shadow-sm group"
            >
              <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign In dengan Google
            </button>
          </div>
          <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium flex items-center justify-center">
              <Lock size={12} className="mr-1.5"/> Akses dibatasi hanya untuk internal.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-gray-900 pb-12 relative ${selectedPseDetailId ? 'print:bg-white print:p-0' : ''}`}>
      <style>{`
        @media print {
          body { background-color: white !important; }
        }
      `}</style>
      
      {renderDialog()}
      
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm print:hidden">
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
            <div className="flex bg-gray-100 p-1.5 rounded-xl shadow-inner border border-gray-200 overflow-x-auto max-w-full">
              <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-900'}`}>
                <Activity size={16} className="mr-2" /> KPI Dashboard
              </button>
              <button onClick={() => setActiveTab('projects')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center whitespace-nowrap ${activeTab === 'projects' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-900'}`}>
                <ListTodo size={16} className="mr-2" /> Project Tracker
              </button>
              
              {(userRole === 'admin' || ['manager_pse', 'manager_other'].includes(userRole)) && (
                <button onClick={() => setActiveTab('form')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center ${activeTab === 'form' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-900'}`}>
                  <FileEdit size={16} className="mr-2" /> Form Penilaian
                </button>
              )}

              {userRole === 'admin' && (
                <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center ${activeTab === 'admin' ? 'bg-slate-900 shadow text-white' : 'text-purple-600 hover:text-purple-800'}`}>
                  <Settings size={16} className="mr-2" /> Admin Panel
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 md:border-l md:border-gray-300 md:pl-6">
              <div className="flex items-center gap-3 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden shadow-sm">
                  {activeUser.photoURL ? <img src={activeUser.photoURL} alt="Avatar" /> : String(activeUser.displayName || activeUser.email || 'U').charAt(0)}
                </div>
                <div className="flex flex-col hidden sm:flex">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{activeRoleConfig.label}</span>
                  <span className="text-xs font-black text-blue-700 truncate max-w-[120px]">{activeUser.displayName || activeUser.email || 'User'}</span>
                </div>
                <button onClick={handleLogout} className="ml-2 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                  <LogOut size={16} />
                </button>
              </div>

              {userRole === 'staff' && !EMAIL_TO_PSE_MAP[activeUser?.email?.toLowerCase() || ''] && (
                <div className="flex flex-col border-l border-gray-300 pl-4 hidden md:flex animate-in zoom-in">
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Identitas Anda:</span>
                  <select value={staffIdentity} onChange={(e) => setStaffIdentity(e.target.value)} className="bg-red-50 border border-red-200 rounded px-1 text-xs font-black text-red-700 cursor-pointer outline-none">
                    <option value="" disabled>Pilih Nama PSE</option>
                    {PSE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 print:p-0 print:m-0">
        <div className={selectedPseDetailId ? 'print:hidden' : ''}>
          {activeTab === 'dashboard' ? renderDashboard() : 
           activeTab === 'projects' ? renderProjectTracking() : 
           activeTab === 'admin' ? renderAdminPanel() : renderForm()}
        </div>
      </main>
    </div>
  );
}
