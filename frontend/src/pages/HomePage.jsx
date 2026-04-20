import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Database, Download, Eye, Users, Star, Zap, Shield, Globe, TrendingUp, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DatasetCard from '../components/DatasetCard';

const StatCounter = ({ value, label, icon: Icon, color }) => (
  <div className="flex flex-col items-center gap-1 p-4">
    <Icon size={22} className={color} />
    <span className="text-2xl font-bold text-white">{value?.toLocaleString() ?? '—'}</span>
    <span className="text-xs text-gray-500 text-center">{label}</span>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc, color }) => (
  <div className="card group hover:border-primary-500/30 transition-all duration-300">
    <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4`}>
      <Icon size={22} className="text-white" />
    </div>
    <h3 className="font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

const HomePage = () => {
  const { isAuthenticated }         = useAuth();
  const [stats, setStats]           = useState(null);
  const [featured, setFeatured]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, datasetsRes, catsRes] = await Promise.all([
          api.get('/search/stats'),
          api.get('/datasets?limit=6&sort=-downloadCount'),
          api.get('/search/categories'),
        ]);
        setStats(statsRes.data.stats);
        setFeatured(datasetsRes.data.datasets);
        setCategories(catsRes.data.categories.slice(0, 8));
      } finally {
        setLoadingData(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Background glow orbs */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl animate-float" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-600/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-8">
            <Zap size={14} fill="currentColor" />
            Open Dataset Platform for Researchers & Data Scientists
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 text-balance">
            Discover, Share &amp; Collaborate<br />
            on <span className="gradient-text">Datasets</span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your datasets, explore contributions from the community, preview data before downloading, 
            and engage in discussions — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search" className="btn-primary text-base px-8 py-3">
              Explore Datasets <ArrowRight size={18} />
            </Link>
            {isAuthenticated ? (
              <Link to="/upload" className="btn-secondary text-base px-8 py-3">
                <Upload size={18} className="mr-1.5 inline" /> Upload Dataset
              </Link>
            ) : (
              <Link to="/register" className="btn-secondary text-base px-8 py-3">
                Start Contributing
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-20">
        <div className="glass rounded-2xl border border-dark-500">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-dark-600">
            <StatCounter value={stats?.totalDatasets}  label="Total Datasets"  icon={Database} color="text-primary-400" />
            <StatCounter value={stats?.totalDownloads} label="Downloads"       icon={Download} color="text-green-400" />
            <StatCounter value={stats?.totalViews}     label="Dataset Views"   icon={Eye}      color="text-blue-400" />
            <StatCounter value={stats?.totalUsers}     label="Contributors"    icon={Users}    color="text-violet-400" />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="text-center mb-12">
          <h2 className="section-title mb-3">Everything you need</h2>
          <p className="text-gray-400">A complete platform for the open data community</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard icon={Database}   color="bg-primary-600" title="Upload & Share"      desc="Upload CSV, JSON, XLSX and more. Add descriptions, tags, and categories to help others find your data." />
          <FeatureCard icon={Eye}        color="bg-blue-600"    title="Preview Before Download" desc="Browse the first 10 rows of any dataset before committing to a download." />
          <FeatureCard icon={TrendingUp} color="bg-green-600"   title="Usage Analytics"    desc="Track downloads, views, and ratings on datasets you've contributed." />
          <FeatureCard icon={Globe}      color="bg-violet-600"  title="Advanced Search"     desc="Filter by type, category, tags, contributor, or rating to find exactly what you need." />
          <FeatureCard icon={Users}      color="bg-orange-600"  title="Community Discussions" desc="Comment and reply on datasets. Discuss methodology, ask questions, share insights." />
          <FeatureCard icon={Shield}     color="bg-red-600"     title="Secure &amp; Reliable"   desc="JWT authentication, bcrypt hashing, and role-based access keep your account and data safe." />
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title">Browse by Category</h2>
            <Link to="/search" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map(({ category, count }) => (
              <Link key={category}
                to={`/search?category=${encodeURIComponent(category)}`}
                className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 border border-dark-500 hover:border-primary-500/40 rounded-xl text-sm text-gray-300 hover:text-primary-400 transition-all duration-200 group">
                {category}
                <span className="badge-gray group-hover:badge-primary text-xs">{count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Datasets ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title">Popular Datasets</h2>
            <p className="text-gray-500 text-sm mt-1">Most downloaded this month</p>
          </div>
          <Link to="/search?sort=downloads" className="btn-secondary text-sm py-2">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {loadingData ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-5 bg-dark-600 rounded-lg mb-3 w-3/4" />
                <div className="h-4 bg-dark-600 rounded mb-2 w-full" />
                <div className="h-4 bg-dark-600 rounded mb-4 w-2/3" />
                <div className="h-px bg-dark-600 mb-4" />
                <div className="h-4 bg-dark-600 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((ds) => <DatasetCard key={ds._id} dataset={ds} />)}
          </div>
        ) : (
          <div className="card text-center py-16 text-gray-500">
            <Database size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">No datasets yet.</p>
            <Link to="/upload" className="btn-primary mt-4 inline-flex">Upload the first one</Link>
          </div>
        )}
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-violet-700 p-10 text-center">
          <div className="absolute inset-0 bg-gradient-radial from-white/5 to-transparent" />
          <h2 className="text-3xl font-bold text-white mb-3 relative">Ready to contribute?</h2>
          <p className="text-primary-200 mb-8 relative">Share your dataset with thousands of researchers and data scientists.</p>
          {isAuthenticated ? (
            <Link to="/upload" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors shadow-xl relative">
              Upload Your Dataset <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors shadow-xl relative">
              Get Started Free <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
