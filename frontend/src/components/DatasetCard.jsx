import { Link } from 'react-router-dom';
import { Download, Eye, Star, FileText, Calendar, User } from 'lucide-react';

const FILE_TYPE_COLORS = {
  csv:  'text-green-400 bg-green-400/10 border-green-400/20',
  json: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  xlsx: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  xls:  'text-blue-400 bg-blue-400/10 border-blue-400/20',
  tsv:  'text-purple-400 bg-purple-400/10 border-purple-400/20',
  txt:  'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const DatasetCard = ({ dataset }) => {
  const {
    _id, title, description, tags = [], fileType, fileSize,
    downloadCount = 0, viewCount = 0, averageRating = 0,
    uploader, createdAt,
  } = dataset;

  const typeStyle = FILE_TYPE_COLORS[fileType?.toLowerCase()] || FILE_TYPE_COLORS.txt;

  return (
    <Link to={`/dataset/${_id}`} className="card-hover flex flex-col gap-4 group animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>
        </div>
        <span className={`flex-shrink-0 text-xs font-mono font-bold px-2 py-1 rounded-lg border uppercase ${typeStyle}`}>
          {fileType || 'file'}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{description}</p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((tag) => (
            <span key={tag} className="badge-gray text-xs">{tag}</span>
          ))}
          {tags.length > 4 && (
            <span className="badge-gray text-xs">+{tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-dark-600" />

      {/* Stats Row */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Download size={12} className="text-primary-400" /> {downloadCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={12} className="text-blue-400" /> {viewCount.toLocaleString()}
          </span>
          {averageRating > 0 && (
            <span className="flex items-center gap-1">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              {averageRating.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <FileText size={12} className="text-gray-500" /> {formatBytes(fileSize)}
          </span>
        </div>
      </div>

      {/* Uploader + Date */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {uploader && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden flex-shrink-0">
              {uploader.avatar
                ? <img src={uploader.avatar} alt="" className="w-full h-full object-cover" />
                : uploader.username?.[0]?.toUpperCase()}
            </div>
            <span className="hover:text-primary-400 transition-colors">{uploader.username}</span>
          </div>
        )}
        {createdAt && (
          <span className="flex items-center gap-1">
            <Calendar size={11} /> {formatDate(createdAt)}
          </span>
        )}
      </div>
    </Link>
  );
};

export default DatasetCard;
