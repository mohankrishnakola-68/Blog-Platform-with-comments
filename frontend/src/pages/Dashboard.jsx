import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PenSquare, Trash2, Edit, BarChart2, MessageSquare, Clock, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './Dashboard.css';

function readTime(text = '') {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200));
}

const CATEGORY_COLORS = {
  Tech: 'badge-blue', Design: 'badge-purple', Development: 'badge-green',
  Lifestyle: 'badge-pink', Travel: 'badge-orange', Code: 'badge-cyan',
};

export default function Dashboard() {
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchMyPosts();
  }, [user]);

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?authorId=${user.id}`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load posts.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      const res = await authFetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
        toast.success('Post deleted.');
      } else {
        const d = await res.json();
        toast.error(d.error);
      }
    } catch { toast.error('Delete failed.'); }
  };

  const totalReadTime = posts.reduce((acc, p) => acc + readTime(p.content), 0);

  if (loading) return <div className="loading-page"><div className="spinner" /><span>Loading dashboard...</span></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-glow" />
      <div className="container dashboard-layout">

        {/* Welcome header */}
        <div className="dashboard-header animate-fade-in-up">
          <div className="dashboard-avatar"
            style={{ background: `hsl(${user?.avatar_color})` }}>
            {user?.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="dashboard-title">
              Welcome back, <span className="gradient-text">{user?.username}</span>
            </h1>
            <p className="dashboard-subtitle">{user?.email}</p>
          </div>
          <Link to="/create" className="btn btn-primary dashboard-cta">
            <PenSquare size={16} /> New Post
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid animate-fade-in-up" style={{ animationDelay: '0.08s', opacity: 0 }}>
          {[
            { icon: <BookOpen size={22} />, label: 'Total Posts', value: posts.length, color: 'var(--accent-1)' },
            { icon: <Clock size={22} />,    label: 'Total Read Time', value: `${totalReadTime} min`, color: 'hsl(210, 90%, 62%)' },
            { icon: <BarChart2 size={22} />, label: 'Avg Read Time', value: posts.length ? `${Math.round(totalReadTime / posts.length)} min` : '—', color: 'hsl(150, 65%, 50%)' },
          ].map(s => (
            <div key={s.label} className="stat-card glass-card">
              <div className="stat-card__icon" style={{ color: s.color, background: `${s.color}18` }}>
                {s.icon}
              </div>
              <div className="stat-card__value">{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Posts Table */}
        <div className="glass-card posts-table-wrap animate-fade-in-up" style={{ animationDelay: '0.16s', opacity: 0 }}>
          <div className="posts-table-header">
            <h2 className="posts-table-title">Your Articles</h2>
            <span className="text-muted text-sm">{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
          </div>

          {posts.length === 0 ? (
            <div className="empty-state">
              <PenSquare size={44} />
              <h3>No posts yet</h3>
              <p>Start writing your first article!</p>
              <Link to="/create" className="btn btn-primary mt-4">Write your first post</Link>
            </div>
          ) : (
            <div className="posts-table">
              {/* Table Head */}
              <div className="posts-table__head">
                <span>Title</span>
                <span>Category</span>
                <span>Read Time</span>
                <span>Published</span>
                <span>Actions</span>
              </div>
              {/* Table Rows */}
              {posts.map(p => (
                <div key={p.id} className="posts-table__row">
                  <div className="posts-table__title">
                    <Link to={`/posts/${p.id}`} className="posts-table__title-link">{p.title}</Link>
                    <p className="posts-table__summary">{p.summary}</p>
                  </div>
                  <span>
                    <span className={`badge ${CATEGORY_COLORS[p.category] || 'badge-purple'}`}>{p.category}</span>
                  </span>
                  <span className="text-muted text-sm">
                    <Clock size={12} style={{ display:'inline', marginRight:4 }} />
                    {readTime(p.content)} min
                  </span>
                  <span className="text-muted text-sm">
                    {new Date(p.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                  </span>
                  <div className="posts-table__actions">
                    <Link to={`/edit/${p.id}`} className="btn btn-secondary btn-sm" title="Edit">
                      <Edit size={14} />
                    </Link>
                    <button className="btn btn-danger btn-sm" title="Delete" onClick={() => handleDelete(p.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
