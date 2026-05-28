import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Trash2, Edit, Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './PostDetail.css';

const CATEGORY_COLORS = {
  Tech: 'badge-blue', Design: 'badge-purple', Development: 'badge-green',
  Lifestyle: 'badge-pink', Travel: 'badge-orange', Code: 'badge-cyan',
};

function readTime(text = '') {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200));
}

function renderContent(text) {
  return text
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
      if (line.startsWith('## '))  return <h2 key={i}>{line.slice(3)}</h2>;
      if (line.startsWith('# '))   return <h1 key={i}>{line.slice(2)}</h1>;
      if (line.startsWith('```'))  return null;
      if (line.startsWith('- ') || line.startsWith('* '))
        return <li key={i}>{line.slice(2)}</li>;
      if (line.trim() === '') return <br key={i} />;
      // Bold **text**
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i}>
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
        </p>
      );
    });
}

export default function PostDetail() {
  const { id } = useParams();
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchPost(); }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) { navigate('/'); return; }
      const data = await res.json();
      setPost(data.post);
      setComments(data.comments);
    } catch { navigate('/'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      const res = await authFetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Post deleted.'); navigate('/'); }
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error('Failed to delete post.'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) { toast.error('Comment cannot be empty.'); return; }
    if (!user) { toast.error('Please log in to comment.'); navigate('/login'); return; }
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
        toast.success('Comment added!');
      } else toast.error(data.error);
    } catch { toast.error('Failed to add comment.'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (cid) => {
    try {
      const res = await authFetch(`/api/comments/${cid}`, { method: 'DELETE' });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== cid));
        toast.success('Comment removed.');
      } else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error('Failed to delete comment.'); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /><span>Loading post...</span></div>;
  if (!post) return null;

  const isAuthor = user && user.id === post.author_id;
  const mins = readTime(post.content);
  const badge = CATEGORY_COLORS[post.category] || 'badge-purple';

  return (
    <div className="post-detail">
      {/* Cover Image */}
      {post.cover_image && (
        <div className="post-detail__cover">
          <img src={post.cover_image} alt={post.title} />
          <div className="post-detail__cover-overlay" />
        </div>
      )}

      <div className="container post-detail__layout">
        {/* Back */}
        <Link to="/" className="btn btn-ghost btn-sm post-detail__back">
          <ArrowLeft size={16} /> Back to Feed
        </Link>

        <article className="post-detail__article glass-card animate-fade-in-up">
          {/* Header */}
          <div className="post-detail__header">
            <div className="post-detail__meta-top">
              <span className={`badge ${badge}`}>{post.category}</span>
              <span className="post-detail__read-time"><Clock size={13} /> {mins} min read</span>
            </div>

            <h1 className="post-detail__title">{post.title}</h1>
            <p className="post-detail__summary">{post.summary}</p>

            <div className="post-detail__author-row">
              <div className="avatar avatar-lg" style={{ background: `hsl(${post.author_avatar_color})` }}>
                {post.author_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="post-detail__author-name">{post.author_name}</div>
                <div className="post-detail__date">
                  <Calendar size={12} />
                  {new Date(post.created_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}
                </div>
              </div>

              {isAuthor && (
                <div className="post-detail__actions">
                  <Link to={`/edit/${post.id}`} className="btn btn-secondary btn-sm">
                    <Edit size={14} /> Edit
                  </Link>
                  <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <hr className="divider" />

          {/* Content */}
          <div className="post-detail__content">
            {renderContent(post.content)}
          </div>
        </article>

        {/* Comments Section */}
        <section className="comments-section glass-card animate-fade-in-up">
          <h2 className="comments-title">
            <MessageSquare size={20} /> Discussion
            <span className="comments-count">{comments.length}</span>
          </h2>

          {/* Comment Form */}
          {user ? (
            <form className="comment-form" onSubmit={handleComment}>
              <div className="avatar" style={{ background: `hsl(${user.avatar_color})` }}>
                {user.username[0].toUpperCase()}
              </div>
              <div className="comment-form__input-wrap">
                <textarea
                  id="comment-input"
                  className="form-input form-textarea comment-form__textarea"
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  rows={3}
                />
                <button type="submit" id="comment-submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? <span className="btn-spinner" /> : <><Send size={14} /> Post</>}
                </button>
              </div>
            </form>
          ) : (
            <div className="comment-login-prompt">
              <Link to="/login" className="btn btn-primary btn-sm">Sign in to comment</Link>
            </div>
          )}

          {/* Comment List */}
          <div className="comment-list">
            {comments.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <MessageSquare size={36} />
                <p>No comments yet. Be the first!</p>
              </div>
            ) : comments.map(c => (
              <div key={c.id} className="comment-item animate-fade-in">
                <div className="avatar" style={{ background: `hsl(${c.author_avatar_color})` }}>
                  {c.author_name?.[0]?.toUpperCase()}
                </div>
                <div className="comment-item__body">
                  <div className="comment-item__header">
                    <span className="comment-item__author">{c.author_name}</span>
                    <span className="comment-item__date">
                      {new Date(c.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                    </span>
                    {user && (user.id === c.author_id || user.id === post.author_id) && (
                      <button className="comment-delete-btn" onClick={() => handleDeleteComment(c.id)} title="Delete comment">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <p className="comment-item__content">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
