import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Database, Download, Eye, Star, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import DatasetCard from '../components/DatasetCard';

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

const ProfilePage = () => {
  const { username } = useParams();
  const [profile, setProfile]   = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [profileRes, datasetsRes] = await Promise.all([
          api.get(`/users/${username}`),
          api.get(`/users/${username}/datasets?limit=20&sort=-downloadCount`),
        ]);
        setProfile(profileRes.data);
        setDatasets(datasetsRes.data.datasets);
      } catch {
        setError('User not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
      <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
      <Link to="/search" className="btn-primary mt-4">Explore Datasets</Link>
    </div>
  );

  const { user, stats } = profile;

  const statItems = [
    { icon: Database, val: stats.totalDatasets,  label: 'Datasets',  color: 'text-primary-400' },
    { icon: Download, val: stats.totalDownloads, label: 'Downloads',  color: 'text-green-400' },
    { icon: Eye,      val: stats.totalViews,     label: 'Total Views', color: 'text-blue-400' },
    { icon: Star,     val: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—', label: 'Avg Rating', color: 'text-yellow-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Profile Header */}
      <div className="card mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-3xl font-bold text-white overflow-hidden flex-shrink-0 shadow-xl shadow-primary-600/20">
            {user.avatar
              ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              : user.username?.[0]?.toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 mb-2">
              <h1 className="text-2xl font-bold text-white">{user.username}</h1>
              {user.role === 'admin' && (
                <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">Admin</span>
              )}
            </div>
            {user.bio
              ? <p className="text-gray-400 leading-relaxed max-w-xl">{user.bio}</p>
              : <p className="text-gray-600 italic text-sm">No bio yet.</p>}
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 text-xs text-gray-500">
              <Calendar size={12} /> Member since {formatDate(user.createdAt)}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-dark-600">
          {statItems.map(({ icon: Icon, val, label, color }) => (
            <div key={label} className="text-center">
              <Icon size={18} className={`mx-auto mb-1 ${color}`} />
              <p className="text-xl font-bold text-white">{String(val)}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Datasets Section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title text-xl">Datasets by {user.username}</h2>
        <span className="text-sm text-gray-500">{datasets.length} public datasets</span>
      </div>

      {datasets.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {datasets.map((ds) => <DatasetCard key={ds._id} dataset={ds} />)}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Database size={40} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-500">{user.username} hasn't uploaded any datasets yet.</p>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
