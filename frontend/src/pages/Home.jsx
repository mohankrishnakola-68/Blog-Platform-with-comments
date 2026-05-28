import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, TrendingUp, Sparkles, PenSquare, Zap } from 'lucide-react';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const CATEGORIES = ['All', 'Tech', 'Design', 'Development', 'Lifestyle', 'Travel', 'Code'];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

  const fetchPosts = async (q = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'All') params.set('category', activeCategory);
      if (q) params.set('search', q);
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts(search);
  };

  const handleCategory = (cat) => {
    setActiveCategory(cat);
    setSearch('');
    if (cat !== 'All') setSearchParams({ category: cat });
    else setSearchParams({});
  };

  return (
    <div className="home">
      {/* ---- Hero Section ---- */}
      <section className="hero">
        <div className="hero__glow hero__glow--1" />
        <div className="hero__glow hero__glow--2" />
        <div className="container hero__content animate-fade-in-up">
          <div className="hero__badge">
            <Sparkles size={14} /> Where Ideas Come Alive
          </div>
          <h1 className="hero__title">
            Discover Stories That<br />
            <span className="gradient-text">Inspire & Inform</span>
          </h1>
          <p className="hero__subtitle">
            A premium blogging platform for creators, developers, and thinkers.
            Share your ideas with a community that cares.
          </p>
          <div className="hero__cta">
            {user ? (
              <Link to="/create" className="btn btn-primary btn-lg">
                <PenSquare size={18} /> Start Writing
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  <Zap size={18} /> Get Started Free
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="hero__stats">
            {[
              { label: 'Active Writers', value: '2.4K+' },
              { label: 'Articles Published', value: '18K+' },
              { label: 'Monthly Readers', value: '140K+' },
            ].map(s => (
              <div key={s.label} className="hero__stat">
                <span className="hero__stat-value gradient-text">{s.value}</span>
                <span className="hero__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Posts Section ---- */}
      <section className="posts-section container">
        {/* Search Bar */}
        <form className="search-bar" onSubmit={handleSearch}>
          <div className="search-bar__inner">
            <Search size={18} className="search-bar__icon" />
            <input
              type="text"
              className="search-bar__input"
              placeholder="Search articles, topics, authors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="search-input"
            />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </div>
        </form>

        {/* Category Filters */}
        <div className="category-filters">
          <TrendingUp size={16} className="text-muted" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`category-chip ${activeCategory === cat ? 'category-chip--active' : ''}`}
              onClick={() => handleCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="loading-page">
            <div className="spinner" />
            <span>Loading articles...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <PenSquare size={48} />
            <h3>No articles found</h3>
            <p>Be the first to write about this topic!</p>
            {user && <Link to="/create" className="btn btn-primary mt-4">Write a Post</Link>}
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
