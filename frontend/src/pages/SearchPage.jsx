import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import api from '../api/axios';
import DatasetCard from '../components/DatasetCard';

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest' },
  { value: 'oldest',    label: 'Oldest' },
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'views',     label: 'Most Viewed' },
  { value: 'rating',    label: 'Highest Rated' },
  { value: 'title',     label: 'A → Z' },
];
const FILE_TYPES = ['csv', 'json', 'xlsx', 'tsv', 'txt'];

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tags, setTags]         = useState([]);

  // Form state mirrors query params
  const [q, setQ]               = useState(searchParams.get('q') || '');
  const [sort, setSort]         = useState(searchParams.get('sort') || 'newest');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [fileType, setFileType] = useState(searchParams.get('fileType') || '');
  const [tagFilter, setTagFilter] = useState(searchParams.get('tags') || '');
  const [page, setPage]         = useState(Number(searchParams.get('page')) || 1);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q)        params.set('q', q);
    if (sort)     params.set('sort', sort);
    if (category) params.set('category', category);
    if (fileType) params.set('fileType', fileType);
    if (tagFilter) params.set('tags', tagFilter);
    params.set('page', page);
    params.set('limit', 12);
    try {
      const { data } = await api.get(`/search?${params.toString()}`);
      setResults(data.datasets);
      setTotal(data.total);
      setPages(data.pages || 1);
    } finally {
      setLoading(false);
    }
  }, [q, sort, category, fileType, tagFilter, page]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  // Fetch tag cloud once
  useEffect(() => {
    api.get('/search/tags').then(({ data }) => setTags(data.tags?.slice(0, 20) || []));
  }, []);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); };
  const clearFilter = (setter) => { setter(''); setPage(1); };
  const activeFilters = [category, fileType, tagFilter].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="section-title mb-1">Explore Datasets</h1>
        <p className="text-gray-500 text-sm">{total > 0 ? `${total.toLocaleString()} dataset${total !== 1 ? 's' : ''} found` : 'Search the dataset library'}</p>
      </div>

      {/* Search + Controls */}
      <div className="flex gap-3 mb-6 flex-col sm:flex-row">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, description, or tags..."
            className="input pl-11 pr-4 w-full" />
        </form>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="input w-auto min-w-36 bg-dark-700">
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary whitespace-nowrap ${activeFilters ? 'border-primary-500 text-primary-400' : ''}`}>
          <SlidersHorizontal size={16} />
          Filters {activeFilters > 0 && <span className="badge-primary">{activeFilters}</span>}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card mb-6 grid sm:grid-cols-3 gap-4 animate-slide-up">
          <div>
            <label className="label">Category</label>
            <div className="flex gap-2">
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Economics" className="input text-sm py-2 flex-1" />
              {category && <button onClick={() => clearFilter(setCategory)} className="text-gray-500 hover:text-red-400"><X size={16} /></button>}
            </div>
          </div>
          <div>
            <label className="label">File Type</label>
            <div className="flex flex-wrap gap-1.5">
              {FILE_TYPES.map((ft) => (
                <button key={ft} onClick={() => { setFileType(fileType === ft ? '' : ft); setPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold border transition-all ${fileType === ft ? 'bg-primary-600/20 text-primary-400 border-primary-500/40' : 'bg-dark-700 text-gray-400 border-dark-500 hover:border-gray-500'}`}>
                  .{ft}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Tags</label>
            <div className="flex gap-2">
              <input value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="e.g. health,covid" className="input text-sm py-2 flex-1" />
              {tagFilter && <button onClick={() => clearFilter(setTagFilter)} className="text-gray-500 hover:text-red-400"><X size={16} /></button>}
            </div>
          </div>
        </div>
      )}

      {/* Popular Tags */}
      {tags.length > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.slice(0, 12).map(({ tag }) => (
            <button key={tag} onClick={() => { setTagFilter(tag); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${tagFilter === tag ? 'bg-primary-600/20 text-primary-400 border-primary-500/40' : 'bg-dark-700 text-gray-400 border-dark-500 hover:border-gray-500'}`}>
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-5 bg-dark-600 rounded w-3/4 mb-3" />
              <div className="h-4 bg-dark-600 rounded mb-2" />
              <div className="h-4 bg-dark-600 rounded w-2/3 mb-4" />
              <div className="h-px bg-dark-600 mb-4" />
              <div className="h-4 bg-dark-600 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((ds) => <DatasetCard key={ds._id} dataset={ds} />)}
          </div>
          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary p-2 disabled:opacity-40">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-400">Page <span className="text-white font-medium">{page}</span> of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="btn-secondary p-2 disabled:opacity-40">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-20">
          <Database size={48} className="mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No datasets found</h3>
          <p className="text-gray-500 text-sm mb-6">Try adjusting your search terms or filters</p>
          <Link to="/upload" className="btn-primary">Upload a Dataset</Link>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
