import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, FileText, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import api from '../api/axios';

const CATEGORIES = ['General', 'Health', 'Economics', 'Education', 'Environment', 'Business',
  'Technology', 'Science', 'Social', 'Sports', 'Politics', 'Human Resources', 'Other'];

const ALLOWED_TYPES = ['.csv', '.json', '.xlsx', '.xls', '.tsv', '.txt'];

const UploadPage = () => {
  const navigate  = useNavigate();
  const fileRef   = useRef(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'General', tags: '' });
  const [file, setFile]         = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFileDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSetFile(f);
  };

  const validateAndSetFile = (f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(ext)) {
      setError(`File type ${ext} not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}`);
      return;
    }
    if (f.size > 50 * 1024 * 1024) { setError('File too large. Max 50MB.'); return; }
    setFile(f); setError('');
  };

  const formatBytes = (b) => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file to upload.'); return; }
    setError(''); setLoading(true);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('category', form.category);
    // Convert comma-separated tags to JSON array
    const tagsArr = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    fd.append('tags', JSON.stringify(tagsArr));

    try {
      const { data } = await api.post('/datasets', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
      setTimeout(() => navigate(`/dataset/${data.dataset._id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center animate-slide-up">
        <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Dataset Uploaded!</h2>
        <p className="text-gray-400">Redirecting to your dataset...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="section-title mb-1">Upload Dataset</h1>
        <p className="text-gray-500 text-sm">Share your data with the community. Supports CSV, JSON, XLSX, TSV, TXT (max 50MB).</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
          <AlertCircle size={16} className="flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Drop Zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
            ${dragOver ? 'border-primary-500 bg-primary-600/10' : 'border-dark-500 hover:border-primary-500/50 hover:bg-dark-700/50'}
            ${file ? 'border-green-500/50 bg-green-500/5' : ''}`}
        >
          <input ref={fileRef} type="file" className="hidden"
            accept={ALLOWED_TYPES.join(',')}
            onChange={(e) => e.target.files[0] && validateAndSetFile(e.target.files[0])} />

          {file ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle size={40} className="text-green-400" />
              <div>
                <p className="font-semibold text-white">{file.name}</p>
                <p className="text-sm text-gray-400">{formatBytes(file.size)} · {file.name.split('.').pop().toUpperCase()}</p>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
                <X size={13} /> Remove file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-dark-600 border border-dark-500 flex items-center justify-center">
                <Upload size={24} className="text-primary-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Drag & drop your file here</p>
                <p className="text-sm text-gray-500 mt-1">or click to browse</p>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                {ALLOWED_TYPES.map((t) => (
                  <span key={t} className="badge-gray font-mono text-xs">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Metadata Fields */}
        <div className="card space-y-5">
          <h2 className="font-semibold text-white">Dataset Information</h2>

          <div>
            <label className="label">Title <span className="text-red-400">*</span></label>
            <input name="title" value={form.title} onChange={handleChange} required maxLength={100}
              className="input" placeholder="e.g. World Population Statistics 2024" />
            <p className="text-xs text-gray-600 mt-1 text-right">{form.title.length}/100</p>
          </div>

          <div>
            <label className="label">Description <span className="text-red-400">*</span></label>
            <textarea name="description" value={form.description} onChange={handleChange}
              required maxLength={2000} rows={4}
              className="input resize-none"
              placeholder="Describe your dataset: what it contains, source, methodology, and potential use cases..." />
            <p className="text-xs text-gray-600 mt-1 text-right">{form.description.length}/2000</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tags</label>
              <div className="relative">
                <Plus size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input name="tags" value={form.tags} onChange={handleChange}
                  className="input pl-9" placeholder="health, covid, who (comma-separated)" />
              </div>
              <p className="text-xs text-gray-600 mt-1">Comma-separated, helps with discovery</p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading || !file}
          className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed">
          {loading
            ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Upload size={18} /> Upload Dataset</>}
        </button>
      </form>
    </div>
  );
};

export default UploadPage;
