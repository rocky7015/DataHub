import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Database, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const strength = (pw) => {
  let s = 0;
  if (pw.length >= 6) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

const RegisterPage = () => {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const pw_strength = strength(form.password);
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/30">
            <Database size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 mt-1 text-sm">Join the DataHub community today</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input type="text" name="username" value={form.username} onChange={handleChange}
                className="input" placeholder="johndoe" required autoFocus
                pattern="^[a-zA-Z0-9_]+$" minLength={3} maxLength={30} />
              <p className="text-xs text-gray-600 mt-1">Letters, numbers, underscores only</p>
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  className="input pr-11" placeholder="Min. 6 characters" required minLength={6} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Password strength bar */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= pw_strength ? STRENGTH_COLORS[pw_strength] : 'bg-dark-500'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{STRENGTH_LABELS[pw_strength]}</p>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="bg-dark-700 rounded-xl p-3 space-y-1.5">
              {['Free to use forever', 'Upload unlimited datasets', 'Join the community'].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-xs text-gray-400">
                  <Check size={13} className="text-green-400 flex-shrink-0" /> {benefit}
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><UserPlus size={17} /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
