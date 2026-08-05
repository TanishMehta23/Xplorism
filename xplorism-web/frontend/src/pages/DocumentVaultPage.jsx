import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, ShieldAlert, Plus, Trash2, Download, Edit3, 
  FolderLock, Calendar, FileType, CheckCircle, HelpCircle, 
  FileImage, Loader2, ArrowLeft, ShieldCheck 
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
  const [docNumber, setDocNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState(''); // base64 string
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.get('/documents');
      setDocuments(data || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError(t('error_connecting'));
    } finally {
      setLoading(false);
    }
  };

  // Convert uploaded file to base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
    setDocNumber('');
    setExpiryDate('');
    setNotes('');
    setFileName('');
    setFileContent('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc) => {
    setEditingId(doc.id);
    setTitle(doc.title);
    setType(doc.type);
    setDocNumber(doc.doc_number || '');
    // Format date string for HTML input (YYYY-MM-DD)
    if (doc.expiry_date) {
      const dateObj = new Date(doc.expiry_date);
      const formattedDate = dateObj.toISOString().split('T')[0];
      setExpiryDate(formattedDate);
    } else {
      setExpiryDate('');
    }
    setNotes(doc.notes || '');
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
      doc_number: docNumber,
      expiry_date: expiryDate || null,
      notes,
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
      fetchDocuments();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to save document.';
      alert('Error: ' + errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert('Failed to delete document.');
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
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition cursor-pointer"
                        title={t('delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Metadata */}
                  <div className="space-y-2.5 text-xs border-t border-[var(--border-primary)] pt-3">
                    {doc.doc_number && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)] font-bold">{t('doc_number')}:</span>
                        <span className="font-extrabold text-[var(--text-primary)]">{doc.doc_number}</span>
                      </div>
                    )}
                    {doc.expiry_date && (
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-secondary)] font-bold">{t('expiry_date')}:</span>
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                          <span className={`font-extrabold ${isExpired ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-[var(--text-primary)]'}`}>
                            {new Date(doc.expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                    {doc.notes && (
                      <div className="flex flex-col space-y-1">
                        <span className="text-[var(--text-secondary)] font-bold">{t('notes')}:</span>
                        <p className="text-[11px] text-[var(--text-secondary)] font-medium bg-[var(--bg-tertiary)] p-2 rounded-lg border border-[var(--border-primary)] max-h-16 overflow-y-auto whitespace-pre-line">
                          {doc.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Attachment Footer */}
                  {doc.file_name && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs">
                      <div className="flex items-center space-x-2 truncate max-w-[200px]">
                        <FileText className="h-4 w-4 text-rose-500 flex-shrink-0" />
                        <span className="text-[var(--text-primary)] truncate font-semibold text-[11px]">{doc.file_name}</span>
                      </div>
                      <button
                        onClick={() => downloadFile(doc.file_content, doc.file_name)}
                        className="p-1 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] flex items-center space-x-1 cursor-pointer transition shadow-sm active:scale-95"
                      >
                        <Download className="h-3 w-3" />
                        <span>{t('download')}</span>
                      </button>
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
                <div className="grid grid-cols-2 gap-3">
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

                  {/* Doc Number */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[var(--text-secondary)]">Document Number</label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="e.g. Z1234567"
                      className="p-3.5 rounded-2xl border text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                    />
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[var(--text-secondary)]">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="p-3.5 rounded-2xl border text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                  />
                </div>

                {/* Notes */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[var(--text-secondary)]">{t('notes')}</label>
                  <textarea
                    rows="2.5"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter additional details or remarks..."
                    className="p-3.5 rounded-2xl border text-sm focus:outline-none resize-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                  />
                </div>

                {/* File Upload */}
                <div className="flex flex-col space-y-2 border border-dashed rounded-2xl p-4.5 text-center transition" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'rgba(244, 63, 94, 0.03)' }}>
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <FileImage className="h-6 w-6 text-rose-500" />
                    <span className="text-[10px] text-[var(--text-secondary)]">Attach File (PDF, Image, text)</span>
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
    </div>
  );
}
