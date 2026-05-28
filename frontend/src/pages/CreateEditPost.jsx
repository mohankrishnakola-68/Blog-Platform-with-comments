import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Eye, Edit3, ArrowLeft, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './CreateEditPost.css';

const CATEGORIES = ['Tech', 'Design', 'Development', 'Lifestyle', 'Travel', 'Code'];

export default function CreateEditPost() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user, authFetch } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('write');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [form, setForm] = useState({
    title: '', summary: '', content: '', category: 'Tech', cover_image: ''
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (isEditing) loadPost();
  }, [user, id]);

  const loadPost = async () => {
    try {
      const res = await fetch(`/api/posts/${id}`);
      const data = await res.json();
      if (!res.ok || data.post.author_id !== user?.id) {
        toast.error('Not authorized to edit this post.');
        navigate('/'); return;
      }
      const p = data.post;
      setForm({ title: p.title, summary: p.summary, content: p.content, category: p.category, cover_image: p.cover_image || '' });
    } catch { toast.error('Failed to load post.'); navigate('/'); }
    finally { setFetching(false); }
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.summary.trim() || !form.content.trim()) {
      toast.error('Title, summary, and content are required.'); return;
    }
    setLoading(true);
    try {
      const url = isEditing ? `/api/posts/${id}` : '/api/posts';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) {
        toast.success(isEditing ? 'Post updated!' : 'Post published! 🎉');
        navigate(isEditing ? `/posts/${id}` : `/posts/${data.id}`);
      } else toast.error(data.error);
    } catch { toast.error('Failed to save post.'); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="loading-page"><div className="spinner" /><span>Loading...</span></div>;

  return (
    <div className="create-page">
      <div className="create-glow create-glow--1" />
      <div className="container create-layout">

        {/* Header */}
        <div className="create-header animate-fade-in-up">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="create-header__info">
            <h1 className="create-header__title">
              {isEditing ? '✏️ Edit Post' : '✍️ Write a New Post'}
            </h1>
            <p className="create-header__subtitle">
              {isEditing ? 'Update your article below' : 'Share your thoughts with the world'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="create-form animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          {/* Left: Editor Panel */}
          <div className="create-main glass-card">
            {/* Tab toggle */}
            <div className="editor-tabs">
              <button type="button" className={`editor-tab ${tab === 'write' ? 'editor-tab--active' : ''}`} onClick={() => setTab('write')}>
                <Edit3 size={15} /> Write
              </button>
              <button type="button" className={`editor-tab ${tab === 'preview' ? 'editor-tab--active' : ''}`} onClick={() => setTab('preview')}>
                <Eye size={15} /> Preview
              </button>
            </div>

            {tab === 'write' ? (
              <div className="editor-write">
                <input
                  id="post-title"
                  name="title"
                  className="editor-title-input"
                  type="text"
                  placeholder="Your post title..."
                  value={form.title}
                  onChange={handleChange}
                  maxLength={120}
                />
                <textarea
                  id="post-content"
                  name="content"
                  className="editor-content-input"
                  placeholder={`Write your article here...\n\nYou can use:\n### Heading 3\n## Heading 2\n**bold text**\n- bullet point`}
                  value={form.content}
                  onChange={handleChange}
                />
              </div>
            ) : (
              <div className="editor-preview">
                <h1 className="preview-title">{form.title || 'Untitled Post'}</h1>
                <div className="preview-content post-detail__content">
                  {form.content ? form.content.split('\n').map((line, i) => {
                    if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
                    if (line.startsWith('## '))  return <h2 key={i}>{line.slice(3)}</h2>;
                    if (line.startsWith('# '))   return <h1 key={i}>{line.slice(2)}</h1>;
                    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i}>{line.slice(2)}</li>;
                    if (line.trim() === '') return <br key={i} />;
                    const parts = line.split(/\*\*(.*?)\*\*/g);
                    return <p key={i}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</p>;
                  }) : <p style={{ color: 'var(--text-muted)' }}>Nothing to preview yet…</p>}
                </div>
              </div>
            )}
          </div>

          {/* Right: Settings Panel */}
          <aside className="create-sidebar">
            <div className="glass-card sidebar-card">
              <h3 className="sidebar-title">Post Settings</h3>

              <div className="form-group">
                <label className="form-label" htmlFor="post-summary">Summary</label>
                <textarea id="post-summary" name="summary" className="form-input form-textarea"
                  placeholder="A short description shown on the feed..." rows={3}
                  value={form.summary} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="post-category">Category</label>
                <select id="post-category" name="category" className="form-input form-select"
                  value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="post-cover"><Image size={13} /> Cover Image URL</label>
                <input id="post-cover" name="cover_image" className="form-input"
                  type="url" placeholder="https://..." value={form.cover_image} onChange={handleChange} />
                {form.cover_image && (
                  <img src={form.cover_image} alt="Cover preview" className="cover-preview"
                    onError={e => { e.target.style.display='none'; }} />
                )}
              </div>

              <button type="submit" id="publish-btn" className="btn btn-primary w-full" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : <><Save size={16} /> {isEditing ? 'Update Post' : 'Publish Post'}</>}
              </button>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
