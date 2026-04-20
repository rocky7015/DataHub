import { useState, useEffect } from 'react';
import { Users, Database, ShieldAlert, CheckCircle, XCircle, Trash2, Shield } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, datasetsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users?limit=50'),
          api.get('/admin/datasets?limit=50'),
        ]);
        setStats(statsRes.data.stats);
        setUsers(usersRes.data.users);
        setDatasets(datasetsRes.data.datasets);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDatasetStatus = async (id, status) => {
    try {
      await api.put(`/admin/datasets/${id}/status`, { status });
      setDatasets((prev) => prev.map((ds) => (ds._id === id ? { ...ds, status } : ds)));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user and ALL their datasets/comments?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      // Refresh stats and datasets after a user deletion
      const [statsRes, datasetsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/datasets?limit=50'),
      ]);
      setStats(statsRes.data.stats);
      setDatasets(datasetsRes.data.datasets);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Shield size={28} className="text-red-500" />
        <div>
          <h1 className="section-title">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage users and moderate datasets</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-600 pb-2">
        {['overview', 'users', 'datasets'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', val: stats?.totalUsers, icon: Users, color: 'text-violet-400' },
            { label: 'Total Datasets', val: stats?.totalDatasets, icon: Database, color: 'text-primary-400' },
            { label: 'Pending Moderation', val: stats?.pendingDatasets, icon: ShieldAlert, color: 'text-yellow-400' },
            { label: 'Total Comments', val: stats?.totalComments, icon: CheckCircle, color: 'text-green-400' },
          ].map(({ label, val, icon: Icon, color }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`p-3 bg-dark-700 rounded-xl ${color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{val}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-dark-700 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-dark-600 hover:bg-dark-700/50">
                  <td className="px-4 py-3 font-medium text-white">{u.username}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-dark-500 text-gray-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {user._id !== u._id && (
                      <button onClick={() => handleDeleteUser(u._id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'datasets' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-dark-700 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Dataset Title</th>
                <th className="px-4 py-3">Uploader</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((ds) => (
                <tr key={ds._id} className="border-b border-dark-600 hover:bg-dark-700/50">
                  <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate">{ds.title}</td>
                  <td className="px-4 py-3">{ds.uploader?.username || 'Unknown'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold
                      ${ds.status === 'approved' ? 'bg-green-500/20 text-green-400' : ds.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {ds.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/dataset/${ds._id}`} target="_blank" rel="noreferrer" className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded" title="View">
                        <Database size={16} />
                      </a>
                      {ds.status !== 'approved' && (
                        <button onClick={() => handleDatasetStatus(ds._id, 'approved')} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded" title="Approve">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {ds.status !== 'rejected' && (
                        <button onClick={() => handleDatasetStatus(ds._id, 'rejected')} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded" title="Reject">
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
