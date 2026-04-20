import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Database, Download, Eye, Star, Bookmark, Upload,
  TrendingUp, Edit2, Save, X, CheckCircle
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import DatasetCard from '../components/DatasetCard';

const StatCard = ({ icon: Icon, value, label, color, subLabel }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center bg-opacity-20`}>
        <Icon size={16} className="text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
    {subLabel && <p className="text-xs text-gray-500 mt-1">{subLabel}</p>}
  </div>
);

const DashboardPage = () => {
  const { user, updateUser } = useAuth();
  const [dash, setDash]     = useState(null);
  const [tab, setTab]       = useState('datasets');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ bio: '', avatar: '' });
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    const fetchDash = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/users/dashboard/me');
        setDash(data);
        setProfileForm({ bio: user?.bio || '', avatar: user?.avatar || '' });
      } finally {
        setLoading(false);
      }
    };
    fetchDash();
  }, [user?._id]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const { data } = await api.put('/users/profile', profileForm);
    updateUser(data.user);
    setSaveMsg('Profile saved!');
    setEditing(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { stats, recentDatasets = [], topDatasets = [], bookmarks = [] } = dash || {};
  const TABS = [
    { id: 'datasets',  label: 'My Datasets',  count: stats?.totalDatasets },
    { id: 'bookmarks', label: 'Bookmarks',    count: bookmarks.length },
    { id: 'top',       label: 'Top Performing', count: null },
    { id: 'profile',   label: 'Edit Profile', count: null },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, <span className="text-primary-400 font-medium">{user?.username}</span></p>
        </div>
        <Link to="/upload" className="btn-primary">
          <Upload size={16} /> Upload Dataset
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Database}   value={stats?.totalDatasets}           label="Total Datasets"  color="bg-primary-600" subLabel={`${stats?.publicDatasets} public`} />
        <StatCard icon={Download}   value={stats?.totalDownloads?.toLocaleString()} label="Total Downloads" color="bg-green-600"   />
        <StatCard icon={Eye}        value={stats?.totalViews?.toLocaleString()}     label="Total Views"     color="bg-blue-600"    />
        <StatCard icon={Star}       value={stats?.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'} label="Avg Rating" color="bg-yellow-600" subLabel={`${stats?.totalRatings} ratings`} />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-dark-700 rounded-xl p-1 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${tab === id ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
            {label}
            {count != null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-primary-500' : 'bg-dark-500 text-gray-500'}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'datasets' && (
        <div>
          {recentDatasets.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recentDatasets.map((ds) => <DatasetCard key={ds._id} dataset={ds} />)}
            </div>
          ) : (
            <div className="card text-center py-16">
              <Database size={40} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 mb-4">You haven't uploaded any datasets yet.</p>
              <Link to="/upload" className="btn-primary">Upload Your First Dataset</Link>
            </div>
          )}
        </div>
      )}

      {tab === 'bookmarks' && (
        <div>
          {bookmarks.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {bookmarks.map((ds) => <DatasetCard key={ds._id} dataset={ds} />)}
            </div>
          ) : (
            <div className="card text-center py-16">
              <Bookmark size={40} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 mb-4">No bookmarked datasets yet.</p>
              <Link to="/search" className="btn-primary">Explore Datasets</Link>
            </div>
          )}
        </div>
      )}

      {tab === 'top' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-4">Your best-performing datasets by downloads</p>
          {topDatasets.length > 0 ? topDatasets.map((ds, i) => (
            <Link key={ds._id} to={`/dataset/${ds._id}`}
              className="card-hover flex items-center gap-4 p-4">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0
                ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-gray-400/20 text-gray-400' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-dark-600 text-gray-500'}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{ds.title}</p>
                <p className="text-xs text-gray-500">{ds.fileType?.toUpperCase()} · {ds.category}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                <span className="flex items-center gap-1"><Download size={12} className="text-green-400" />{ds.downloadCount}</span>
                <span className="flex items-center gap-1"><Eye size={12} className="text-blue-400" />{ds.viewCount}</span>
                {ds.averageRating > 0 && <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400" />{ds.averageRating.toFixed(1)}</span>}
              </div>
            </Link>
          )) : (
            <div className="card text-center py-16">
              <TrendingUp size={40} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No data yet. Upload datasets to see performance.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <div className="max-w-lg">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-white">Edit Profile</h3>
              {saveMsg && (
                <span className="flex items-center gap-1.5 text-sm text-green-400">
                  <CheckCircle size={14} /> {saveMsg}
                </span>
              )}
            </div>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input value={user?.username} disabled className="input opacity-50 cursor-not-allowed" />
                <p className="text-xs text-gray-600 mt-1">Contact support to change username</p>
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea value={profileForm.bio}
                  onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                  maxLength={300} rows={3} className="input resize-none"
                  placeholder="Tell the community about yourself..." />
                <p className="text-xs text-gray-600 mt-1 text-right">{profileForm.bio.length}/300</p>
              </div>
              <div>
                <label className="label">Avatar URL</label>
                <input value={profileForm.avatar}
                  onChange={(e) => setProfileForm((p) => ({ ...p, avatar: e.target.value }))}
                  className="input" placeholder="https://..." type="url" />
                {profileForm.avatar && (
                  <img src={profileForm.avatar} alt="Preview"
                    className="mt-3 w-16 h-16 rounded-full object-cover border-2 border-dark-500"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                )}
              </div>
              <button type="submit" className="btn-primary">
                <Save size={16} /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
