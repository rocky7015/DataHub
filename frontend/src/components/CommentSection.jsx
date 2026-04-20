import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Edit2, CornerDownRight, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const timeAgo = (dateStr) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const Avatar = ({ user, size = 8 }) => (
  <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0`}>
    {user?.avatar
      ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
      : user?.username?.[0]?.toUpperCase() || '?'}
  </div>
);

const CommentInput = ({ onSubmit, placeholder = 'Write a comment...', buttonLabel = 'Comment', compact = false }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    await onSubmit(text.trim());
    setText('');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-3 ${compact ? 'mt-3' : ''}`}>
      {!compact && <Avatar user={user} />}
      <div className="flex-1 flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={compact ? 1 : 2}
          className="input resize-none text-sm py-2"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
        />
        <button type="submit" disabled={!text.trim() || loading} className="btn-primary px-3 self-end">
          <Send size={15} />
        </button>
      </div>
    </form>
  );
};

const CommentItem = ({ comment, datasetId, onDeleted, onReplyAdded }) => {
  const { user, isAuthenticated } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const isOwner = user && String(user._id) === String(comment.author?._id);

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;
    await api.delete(`/comments/${comment._id}`);
    onDeleted(comment._id);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const { data } = await api.put(`/comments/${comment._id}`, { content: editText });
    comment.content = data.comment.content;
    setEditing(false);
  };

  const handleReply = async (content) => {
    const { data } = await api.post(`/comments/${comment._id}/reply`, { content });
    onReplyAdded(comment._id, data.comment);
    setShowReply(false);
    setShowReplies(true);
  };

  return (
    <div className="flex gap-3 animate-fade-in">
      <Avatar user={comment.author} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white">{comment.author?.username}</span>
          <span className="text-xs text-gray-500">{timeAgo(comment.createdAt)}</span>
        </div>

        {editing ? (
          <form onSubmit={handleEdit} className="flex gap-2">
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
              className="input text-sm py-2 resize-none flex-1" rows={2} />
            <div className="flex flex-col gap-1">
              <button type="submit" className="btn-primary px-3 py-1.5 text-xs">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary px-3 py-1.5 text-xs">Cancel</button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{comment.content}</p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-2">
          {isAuthenticated && (
            <button onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-400 transition-colors">
              <CornerDownRight size={12} /> Reply
            </button>
          )}
          {comment.replies?.length > 0 && (
            <button onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
              <ChevronDown size={12} className={`transition-transform ${showReplies ? 'rotate-180' : ''}`} />
              {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
          {isOwner && (
            <>
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-400 transition-colors">
                <Edit2 size={11} /> Edit
              </button>
              <button onClick={handleDelete}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 size={11} /> Delete
              </button>
            </>
          )}
        </div>

        {/* Reply Input */}
        {showReply && (
          <CommentInput onSubmit={handleReply} placeholder="Write a reply..." buttonLabel="Reply" compact />
        )}

        {/* Nested Replies */}
        {showReplies && comment.replies?.length > 0 && (
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-dark-500">
            {comment.replies.map((reply) => (
              <div key={reply._id} className="flex gap-3">
                <Avatar user={reply.author} size={7} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{reply.author?.username}</span>
                    <span className="text-xs text-gray-500">{timeAgo(reply.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CommentSection = ({ datasetId }) => {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchComments = async (pg = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/comments/dataset/${datasetId}?page=${pg}&limit=10`);
      setComments(pg === 1 ? data.comments : (prev) => [...prev, ...data.comments]);
      setTotal(data.total);
      setHasMore(pg < data.pages);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(1); }, [datasetId]);

  const handleAdd = async (content) => {
    const { data } = await api.post(`/comments/dataset/${datasetId}`, { content });
    setComments((prev) => [data.comment, ...prev]);
    setTotal((t) => t + 1);
  };

  const handleDeleted = (commentId) => {
    setComments((prev) => prev.filter((c) => c._id !== commentId));
    setTotal((t) => t - 1);
  };

  const handleReplyAdded = (parentId, reply) => {
    setComments((prev) =>
      prev.map((c) => c._id === parentId ? { ...c, replies: [...(c.replies || []), reply] } : c)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare size={20} className="text-primary-400" />
        <h3 className="text-lg font-semibold text-white">
          Discussion <span className="text-gray-500 text-sm font-normal">({total})</span>
        </h3>
      </div>

      {isAuthenticated
        ? <CommentInput onSubmit={handleAdd} />
        : <div className="card text-center py-6 text-gray-400 text-sm">
            <a href="/login" className="text-primary-400 hover:underline">Sign in</a> to join the discussion
          </div>
      }

      {loading && comments.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
          <p>No comments yet. Be the first to start the discussion!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((c) => (
            <CommentItem key={c._id} comment={c} datasetId={datasetId}
              onDeleted={handleDeleted} onReplyAdded={handleReplyAdded} />
          ))}
          {hasMore && (
            <button onClick={() => fetchComments(page + 1)}
              className="btn-secondary w-full justify-center text-sm">
              Load more comments
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
