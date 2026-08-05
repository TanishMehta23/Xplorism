import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, ShieldAlert, Plus, Trash2, Download, Edit3, 
  FolderLock, CheckCircle, HelpCircle, 
  FileImage, Loader2, ArrowLeft, ShieldCheck, Eye 
} from 'lucide-react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

export default function DocumentVaultPage() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('passport');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState(''); // base64 string
  
  // Document Viewer states
  const [viewingDoc, setViewingDoc] = useState(null);
  const [viewContent, setViewContent] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [loadingView, setLoadingView] = useState(false);
  
  // Custom Delete Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState('all');

  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Fetch documents on mount
  useEffect(() => {
    let hasCache = false;
    const cached = localStorage.getItem('xplorism_documents_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setDocuments(parsed);
        setLoading(false);
        hasCache = true;
      } catch (e) {
        console.error('Error parsing cached documents:', e);
      }
    }
    fetchDocuments(hasCache);
  }, []);

  const fetchDocuments = async (hasCache = false) => {
    if (!hasCache) {
      setLoading(true);
    }
    try {
      const data = await api.get('/documents');
      const docs = data || [];
      setDocuments(docs);
      setError('');
      try {
        localStorage.setItem('xplorism_documents_cache', JSON.stringify(docs));
      } catch (e) {
        console.warn('Failed to save documents to localStorage cache (quota limit exceeded):', e);
      }
    } catch (err) {
      console.error(err);
      const cached = localStorage.getItem('xplorism_documents_cache');
      if (cached) {
        try {
          setDocuments(JSON.parse(cached));
          setError('');
        } catch (e) {
          setError(t('error_connecting'));
        }
      } else {
        setError(t('error_connecting'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Convert uploaded file to base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 10MB
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_SIZE) {
      showToast('File size exceeds the 10MB limit.', 'error');
      e.target.value = ''; // Reset input
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileContent(reader.result); // yields data URL (data:image/png;base64,...)
    };
    reader.onerror = (error) => {
      console.error('File conversion error:', error);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setTitle('');
    setType('passport');
    setFileName('');
    setFileContent('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc) => {
    setEditingId(doc.id);
    setTitle(doc.title);
    setType(doc.type);
    setFileName(doc.file_name || '');
    setFileContent(doc.file_content || '');
    setIsModalOpen(true);
  };

  const handleSaveDocument = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title,
      type,
      file_name: fileName,
      file_content: fileContent
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/documents/${editingId}`, payload);
      } else {
        await api.post('/documents', payload);
      }
      setIsModalOpen(false);
      fetchDocuments(true);
    } catch (err) {
      console.error('API save failed, falling back to local cache:', err);
      // Fallback: save to LocalStorage cache
      const cachedStr = localStorage.getItem('xplorism_documents_cache');
      let cached = [];
      if (cachedStr) {
        try {
          cached = JSON.parse(cachedStr);
        } catch (e) {
          console.error(e);
        }
      }
      
      if (editingId) {
        const updated = cached.map(d => 
          d.id === editingId ? { ...d, ...payload } : d
        );
        try {
          localStorage.setItem('xplorism_documents_cache', JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to save documents to localStorage cache (quota limit):', e);
        }
        setDocuments(updated);
      } else {
        const newDoc = {
          ...payload,
          id: `local-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        const updated = [newDoc, ...cached];
        try {
          localStorage.setItem('xplorism_documents_cache', JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to save documents to localStorage cache (quota limit):', e);
        }
        setDocuments(updated);
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const triggerDeleteConfirm = (doc) => {
    setDocToDelete(doc);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteDocument = async (id) => {
    try {
      if (!id.toString().startsWith('local-')) {
        await api.delete(`/documents/${id}`);
      }
      const cachedStr = localStorage.getItem('xplorism_documents_cache');
      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr);
          const updated = cached.filter(d => d.id !== id);
          localStorage.setItem('xplorism_documents_cache', JSON.stringify(updated));
          setDocuments(updated);
        } catch (e) {
          console.error(e);
        }
      }
      if (!id.toString().startsWith('local-')) {
        fetchDocuments(true);
      }
    } catch (err) {
      console.error('API delete failed, removing from local cache anyway:', err);
      const cachedStr = localStorage.getItem('xplorism_documents_cache');
      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr);
          const updated = cached.filter(d => d.id !== id);
          localStorage.setItem('xplorism_documents_cache', JSON.stringify(updated));
          setDocuments(updated);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const downloadFile = (content, name) => {
    if (!content) return;
    const link = document.createElement('a');
    link.href = content;
    link.download = name || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadDocument = async (doc) => {
    if (doc.id.toString().startsWith('local-')) {
      downloadFile(doc.file_content, doc.file_name);
      return;
    }

    try {
      const data = await api.get(`/documents/${doc.id}/download`);
      downloadFile(data.file_content, data.file_name || doc.file_name);
    } catch (err) {
      console.error('Failed to download document:', err);
      showToast('Failed to download document. Please try again.', 'error');
    }
  };

  const handleViewDocument = async (doc) => {
    setViewingDoc(doc);
    setIsViewerOpen(true);
    setViewContent(null);
    setLoadingView(true);

    if (doc.id.toString().startsWith('local-')) {
      setViewContent(doc.file_content);
      setLoadingView(false);
      return;
    }

    try {
      const data = await api.get(`/documents/${doc.id}/download`);
      setViewContent(data.file_content);
    } catch (err) {
      console.error('Failed to view document:', err);
      showToast('Failed to load document preview.', 'error');
      setIsViewerOpen(false);
    } finally {
      setLoadingView(false);
    }
  };

  // Helper to check expiration status
  // Returns: { status: 'expired' | 'warning' | 'ok', daysRemaining: number }
  const getExpirationStatus = (expiryDateStr) => {
    if (!expiryDateStr) return { status: 'ok', daysRemaining: null };
    
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const diffTime = expiry - today;
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) {
      return { status: 'expired', daysRemaining };
    } else if (daysRemaining <= 180) { // 6 months
      return { status: 'warning', daysRemaining };
    }
    return { status: 'ok', daysRemaining };
  };

  const getTypeIcon = (docType) => {
    switch (docType) {
      case 'passport': return '🛂';
      case 'visa': return '📄';
      case 'ticket': return '✈️';
      case 'hotel_voucher': return '🏨';
      case 'insurance': return '🛡️';
      default: return '📂';
    }
  };

  // Filtered list
  const filteredDocuments = documents.filter(doc => 
    activeFilter === 'all' ? true : doc.type === activeFilter
  );

  // Critical alerts (expired or expiring in < 180 days)
  const alertDocuments = documents.filter(doc => {
    const { status } = getExpirationStatus(doc.expiry_date);
    return status === 'expired' || status === 'warning';
  });

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar activeTab="vault" />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
              <FolderLock className="h-8 w-8 text-rose-500" />
              <span>{t('vault_title')}</span>
            </h1>
            <p className="text-sm font-medium text-[var(--text-secondary)]">{t('vault_subtitle')}</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-5 py-3 rounded-2xl transition cursor-pointer shadow-lg active:scale-95 text-sm"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>{t('add_document')}</span>
          </button>
        </div>

        {/* Warning Alerts Section (Expired or Expiring soon) */}
        {alertDocuments.length > 0 && (
          <div className="p-4.5 rounded-2xl border bg-rose-500/10 border-rose-500/25 space-y-3">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="h-4.5 w-4.5" />
              <span>Security Warnings / Attention Required</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alertDocuments.map(doc => {
                const { status, daysRemaining } = getExpirationStatus(doc.expiry_date);
                const isExpired = status === 'expired';
                return (
                  <div 
                    key={doc.id}
                    className="p-3.5 rounded-xl border flex items-center justify-between text-xs backdrop-blur-md"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{getTypeIcon(doc.type)}</span>
                      <div>
                        <p className="font-extrabold text-[var(--text-primary)] truncate max-w-[150px]">{doc.title}</p>
                        <p className="text-[10px] text-[var(--text-secondary)] font-semibold">{doc.doc_number}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      isExpired ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {isExpired ? t('expired') : `${daysRemaining} Days Left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter categories */}
        <div className="flex flex-wrap items-center gap-2 pb-2">
          {['all', 'passport', 'visa', 'ticket', 'hotel_voucher', 'insurance', 'other'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border active:scale-95 ${
                activeFilter === filter 
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md' 
                  : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border-[var(--border-primary)]'
              }`}
            >
              <span className="mr-1.5">{getTypeIcon(filter)}</span>
              <span className="capitalize">{filter === 'all' ? 'All' : t(filter)}</span>
            </button>
          ))}
        </div>

        {/* Documents Grid / Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
            <p className="text-sm text-[var(--text-secondary)] font-bold">Accessing secure vaults...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 border rounded-2xl" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
            <p className="text-sm font-bold text-rose-500">{error}</p>
            <button onClick={fetchDocuments} className="mt-4 text-xs font-bold text-rose-500 underline cursor-pointer">Try again</button>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div 
            className="text-center py-20 border rounded-2xl flex flex-col items-center justify-center p-6 space-y-4"
            style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <FolderLock className="h-12 w-12 text-[var(--text-tertiary)]" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">No secure documents found</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm">{t('no_documents')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocuments.map(doc => {
              const { status } = getExpirationStatus(doc.expiry_date);
              const isExpired = status === 'expired';
              const isWarning = status === 'warning';
              
              return (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border p-5 flex flex-col justify-between space-y-4 backdrop-blur-md relative overflow-hidden group shadow-lg transition-all duration-300"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderColor: isExpired ? 'rgba(239, 68, 68, 0.4)' : isWarning ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-primary)' 
                  }}
                >
                  {/* Top Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="text-3xl p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center">
                        {getTypeIcon(doc.type)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[var(--text-primary)] text-base leading-tight group-hover:text-rose-500 transition">{doc.title}</h4>
                        <p className="text-[10px] uppercase font-bold text-rose-500 mt-1">{t(doc.type)}</p>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center space-x-1.5 opacity-80 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => handleOpenEditModal(doc)}
                        className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                        title={t('edit')}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => triggerDeleteConfirm(doc)}
                        className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition cursor-pointer"
                        title={t('delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Attachment Footer */}
                  {doc.file_name && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs">
                      <div className="flex items-center space-x-2 truncate max-w-[200px]">
                        <FileText className="h-4 w-4 text-rose-500 flex-shrink-0" />
                        <span className="text-[var(--text-primary)] truncate font-semibold text-[11px]">{doc.file_name}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className="p-1 px-2.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] font-extrabold text-[10px] flex items-center space-x-1 cursor-pointer transition active:scale-95"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="p-1 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] flex items-center space-x-1 cursor-pointer transition shadow-sm active:scale-95"
                        >
                          <Download className="h-3 w-3" />
                          <span>{t('download')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* Secure Document Uploader Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--modal-overlay)' }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-3xl border p-6 max-w-md w-full shadow-2xl relative"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            >
              <h2 className="text-xl font-black mb-1.5 flex items-center gap-2">
                <FolderLock className="h-5.5 w-5.5 text-rose-500" />
                <span>{editingId ? 'Edit Document' : t('add_document')}</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mb-4 font-semibold">Your documents are securely encrypted and cached locally.</p>

              <form onSubmit={handleSaveDocument} className="space-y-4 font-semibold text-xs">
                {/* Document Title */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[var(--text-secondary)]">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. My Passport"
                    className="p-3.5 rounded-2xl border text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                  />
                </div>

                {/* Type Selection */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[var(--text-secondary)]">Document Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="p-3.5 rounded-2xl border text-sm cursor-pointer focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                  >
                    <option value="passport">🛂 Passport</option>
                    <option value="visa">📄 Visa</option>
                    <option value="ticket">✈️ Ticket</option>
                    <option value="hotel_voucher">🏨 Hotel Voucher</option>
                    <option value="insurance">🛡️ Insurance</option>
                    <option value="other">📂 Other</option>
                  </select>
                </div>

                {/* File Upload */}
                <div className="flex flex-col space-y-2 border border-dashed rounded-2xl p-4.5 text-center transition" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'rgba(244, 63, 94, 0.03)' }}>
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <FileImage className="h-6 w-6 text-rose-500" />
                    <span className="text-[10px] text-[var(--text-secondary)]">Attach File (PDF, Image, text - Max 10MB)</span>
                    {fileName && <span className="text-[var(--text-primary)] text-xs font-black truncate max-w-[250px]">{fileName}</span>}
                  </div>
                  <input
                    type="file"
                    disabled={isSaving}
                    onChange={handleFileChange}
                    className="hidden"
                    id="document-file-picker"
                  />
                  <label
                    htmlFor="document-file-picker"
                    className={`mx-auto px-4 py-2 rounded-xl border text-[var(--text-primary)] font-extrabold text-[10px] transition cursor-pointer active:scale-95 ${isSaving ? 'opacity-50 pointer-events-none' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    Choose File
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end space-x-3 border-t pt-4" style={{ borderColor: 'var(--border-primary)' }}>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 rounded-2xl border font-extrabold transition cursor-pointer active:scale-95 text-xs disabled:opacity-50"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold transition cursor-pointer active:scale-95 text-xs shadow-md flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{isSaving ? 'Saving...' : t('save')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Preview Viewer Modal */}
      <AnimatePresence>
        {isViewerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--modal-overlay)' }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-3xl border p-6 max-w-3xl w-full shadow-2xl relative flex flex-col max-h-[85vh]"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            >
              <h2 className="text-lg font-black mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-primary)' }}>
                <span className="truncate max-w-[80%]">{viewingDoc?.title} ({viewingDoc?.file_name})</span>
                <button 
                  onClick={() => setIsViewerOpen(false)}
                  className="text-xs font-bold text-[var(--text-secondary)] hover:text-rose-500 cursor-pointer"
                >
                  Close
                </button>
              </h2>
              
              <div className="flex-1 overflow-auto flex items-center justify-center p-2 min-h-[300px]">
                {loadingView ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">Decrypting secure file...</p>
                  </div>
                ) : viewContent ? (
                  <>
                    {viewContent.startsWith('data:image/') ? (
                      <img 
                        src={viewContent} 
                        alt={viewingDoc?.title} 
                        className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-md border" 
                        style={{ borderColor: 'var(--border-primary)' }}
                      />
                    ) : viewContent.startsWith('data:application/pdf') ? (
                      <object 
                        data={viewContent} 
                        type="application/pdf" 
                        className="w-full h-[60vh] rounded-xl border"
                        style={{ borderColor: 'var(--border-primary)' }}
                      >
                        <iframe 
                          src={viewContent} 
                          className="w-full h-[60vh] rounded-xl border-0" 
                          title={viewingDoc?.title}
                        />
                      </object>
                    ) : viewContent.startsWith('data:text/') || typeof viewContent === 'string' && !viewContent.startsWith('data:') ? (
                      <pre className="w-full p-4 rounded-xl text-left font-mono text-xs overflow-auto whitespace-pre-wrap max-h-[60vh] border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                        {viewContent.startsWith('data:') ? atob(viewContent.split(',')[1]) : viewContent}
                      </pre>
                    ) : (
                      <div className="text-center space-y-3">
                        <span className="text-3xl">📂</span>
                        <p className="text-xs text-[var(--text-secondary)] font-bold">No preview available for this file type.</p>
                        <button
                          onClick={() => {
                            downloadFile(viewContent, viewingDoc?.file_name);
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs active:scale-95 transition cursor-pointer"
                        >
                          Download to View
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-rose-500 font-bold">Failed to load content.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--modal-overlay)' }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-3xl border p-6 max-w-sm w-full shadow-2xl relative text-center space-y-4"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl">
                ⚠️
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black">Delete Document</h3>
                <p className="text-xs text-[var(--text-secondary)] font-semibold">
                  Are you sure you want to delete <span className="font-extrabold text-[var(--text-primary)]">"{docToDelete?.title}"</span>? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border font-extrabold transition cursor-pointer active:scale-95 text-xs"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setIsDeleteModalOpen(false);
                    if (docToDelete) {
                      await confirmDeleteDocument(docToDelete.id);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold transition cursor-pointer active:scale-95 text-xs shadow-md"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center space-x-2 border backdrop-blur-md"
            style={{
              backgroundColor: 'var(--toast-bg)',
              color: toast.type === 'error' ? 'rgba(239, 68, 68, 1)' : 'rgba(16, 185, 129, 1)',
              borderColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'
            }}
          >
            <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
