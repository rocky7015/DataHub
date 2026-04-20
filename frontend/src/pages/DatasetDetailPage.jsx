import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Download, Eye, Star, FileText, Calendar, Tag, User,
  Bookmark, BookmarkCheck, Table, Trash2, Edit2, AlertCircle
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RatingStars from '../components/RatingStars';
import CommentSection from '../components/CommentSection';

const formatBytes = (b) => {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const DatasetDetailPage = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [dataset, setDataset]   = useState(null);
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [error, setError]       = useState('');
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/datasets/${id}`);
        setDataset(data.dataset);

        // Load preview
        try {
          const pv = await api.get(`/datasets/${id}/preview`);
          setPreview(pv.data.preview);
        } catch { /* preview not available */ }

        // Check bookmark status
        if (user) {
          const me = await api.get('/auth/me');
          const bms = me.data.user?.bookmarks?.map((b) => String(b._id || b)) || [];
          setBookmarked(bms.includes(id));
        }
      } catch {
        setError('Dataset not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleDownload = () => {
    const baseUrl = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    window.open(`${baseUrl}/api/datasets/${id}/download`, '_blank');
    setDataset((d) => ({ ...d, downloadCount: d.downloadCount + 1 }));
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const { data } = await api.post(`/datasets/${id}/bookmark`);
    setBookmarked(data.bookmarked);
  };

  const handleRate = async (rating) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const { data } = await api.post(`/datasets/${id}/rate`, { rating });
    setDataset((d) => ({ ...d, averageRating: data.averageRating, ratingCount: data.ratingCount }));
    setRatingDone(true);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dataset? This cannot be undone.')) return;
    setDeleting(true);
    await api.delete(`/datasets/${id}`);
    navigate('/dashboard');
  };

  const isOwner = user && dataset && String(user._id) === String(dataset.uploader?._id);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
      <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
      <Link to="/search" className="btn-primary mt-4">Back to Search</Link>
    </div>
  );

  const { title, description, tags = [], fileType, fileSize, fileName,
          downloadCount, viewCount, averageRating, ratingCount,
          uploader, createdAt, category } = dataset;

  const FILE_COLORS = { csv: 'text-green-400', json: 'text-yellow-400', xlsx: 'text-blue-400', default: 'text-gray-400' };
  const ftColor = FILE_COLORS[fileType?.toLowerCase()] || FILE_COLORS.default;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="grid lg:grid-cols-3 gap-8">

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start gap-3 mb-4">
              <div className={`px-2.5 py-1 rounded-lg bg-dark-600 border border-dark-500 text-xs font-mono font-bold uppercase ${ftColor}`}>
                .{fileType}
              </div>
              {category && <span className="badge-primary text-xs">{category}</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-snug">{title}</h1>
            <p className="text-gray-400 leading-relaxed">{description}</p>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={14} className="text-gray-500" />
              {tags.map((t) => (
                <Link key={t} to={`/search?tags=${t}`} className="badge-gray hover:badge-primary transition-all">#{t}</Link>
              ))}
            </div>
          )}

          {/* Preview / Discussion Tabs */}
          <div className="card p-0 overflow-hidden">
            <div className="flex border-b border-dark-600">
              {['preview', 'discussion'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium capitalize transition-all duration-200 ${activeTab === tab ? 'text-primary-400 border-b-2 border-primary-500 bg-primary-600/5' : 'text-gray-500 hover:text-gray-300'}`}>
                  {tab === 'preview' ? <span className="flex items-center justify-center gap-1.5"><Table size={15}/> Preview</span>
                   : <span className="flex items-center justify-center gap-1.5"><Star size={15}/> Discussion</span>}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'preview' ? (
                preview ? (
                  preview.type === 'csv' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-dark-500">
                            {preview.headers?.map((h) => (
                              <th key={h} className="px-3 py-2 font-semibold text-gray-400 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.rows?.map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-dark-700/40' : ''}>
                              {preview.headers?.map((h) => (
                                <td key={h} className="px-3 py-2 text-gray-300 whitespace-nowrap font-mono">{row[h]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="text-xs text-gray-600 mt-3 text-center">
                        Showing {preview.rows?.length} of {preview.totalLines?.toLocaleString()} rows
                      </p>
                    </div>
                  ) : preview.type === 'json' ? (
                    <div>
                      <pre className="text-xs text-gray-300 overflow-x-auto bg-dark-700 rounded-xl p-4 font-mono leading-relaxed">
                        {JSON.stringify(preview.rows?.slice(0, 3), null, 2)}
                      </pre>
                      <p className="text-xs text-gray-600 mt-3 text-center">
                        Showing 3 of {preview.total} records
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText size={32} className="mx-auto mb-3 opacity-30" />
                      <p>{preview.message || 'Preview not available for this file type.'}</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <FileText size={36} className="mx-auto mb-3 opacity-20" />
                    <p>Preview not available</p>
                  </div>
                )
              ) : (
                <CommentSection datasetId={id} />
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Download Card */}
          <div className="card space-y-4">
            <button onClick={handleDownload} className="btn-primary w-full justify-center py-3 text-base">
              <Download size={19} /> Download Dataset
            </button>
            <button onClick={handleBookmark}
              className={`btn-secondary w-full justify-center py-2.5 ${bookmarked ? 'border-primary-500 text-primary-400' : ''}`}>
              {bookmarked ? <><BookmarkCheck size={17} /> Saved</> : <><Bookmark size={17} /> Save Dataset</>}
            </button>

            {/* Stats */}
            <div className="divider my-0" />
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Download, val: downloadCount?.toLocaleString(), label: 'Downloads', color: 'text-primary-400' },
                { icon: Eye,      val: viewCount?.toLocaleString(),      label: 'Views',     color: 'text-blue-400' },
              ].map(({ icon: Icon, val, label, color }) => (
                <div key={label} className="bg-dark-700 rounded-xl p-3 text-center">
                  <Icon size={16} className={`mx-auto mb-1 ${color}`} />
                  <p className="text-lg font-bold text-white">{val}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Rating */}
            <div className="bg-dark-700 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Community Rating</span>
                {ratingDone && <span className="text-xs text-green-400">✓ Rated!</span>}
              </div>
              <RatingStars rating={averageRating} count={ratingCount} />
              {isAuthenticated && !ratingDone && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Rate this dataset:</p>
                  <RatingStars rating={0} interactive onRate={handleRate} />
                </div>
              )}
            </div>
          </div>

          {/* File Info */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-white text-sm">File Information</h3>
            {[
              { label: 'Filename',  val: fileName },
              { label: 'Type',      val: fileType?.toUpperCase() },
              { label: 'Size',      val: formatBytes(fileSize) },
              { label: 'Uploaded',  val: createdAt ? formatDate(createdAt) : '—' },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-200 font-medium text-right max-w-[60%] truncate">{val}</span>
              </div>
            ))}
          </div>

          {/* Contributor */}
          {uploader && (
            <div className="card">
              <h3 className="font-semibold text-white text-sm mb-4">Contributor</h3>
              <Link to={`/profile/${uploader.username}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0">
                  {uploader.avatar
                    ? <img src={uploader.avatar} alt={uploader.username} className="w-full h-full object-cover" />
                    : uploader.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">{uploader.username}</p>
                  {uploader.bio && <p className="text-xs text-gray-500 line-clamp-1">{uploader.bio}</p>}
                </div>
              </Link>
            </div>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <div className="card space-y-2">
              <h3 className="font-semibold text-white text-sm mb-3">Manage Dataset</h3>
              <Link to={`/dataset/${id}/edit`} className="btn-secondary w-full justify-center text-sm py-2">
                <Edit2 size={14} /> Edit Metadata
              </Link>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger w-full justify-center text-sm py-2">
                <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Dataset'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatasetDetailPage;
