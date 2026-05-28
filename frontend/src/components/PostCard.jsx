import { Link } from 'react-router-dom';
import { Clock, MessageSquare, ArrowRight } from 'lucide-react';
import './PostCard.css';

const CATEGORY_COLORS = {
  Tech: 'badge-blue', Design: 'badge-purple', Development: 'badge-green',
  Lifestyle: 'badge-pink', Travel: 'badge-orange', Code: 'badge-cyan',
};

function readTime(text = '') {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function PostCard({ post, index = 0 }) {
  const badge = CATEGORY_COLORS[post.category] || 'badge-purple';
  const mins = readTime(post.content);

  return (
    <article
      className="post-card glass-card animate-fade-in-up"
      style={{ animationDelay: `${index * 0.07}s`, opacity: 0 }}
    >
      {post.cover_image && (
        <Link to={`/posts/${post.id}`} className="post-card__img-wrap">
          <img src={post.cover_image} alt={post.title} className="post-card__img" />
          <div className="post-card__img-overlay" />
        </Link>
      )}

      <div className="post-card__body">
        <div className="post-card__meta">
          <span className={`badge ${badge}`}>{post.category}</span>
          <span className="post-card__time">
            <Clock size={12} /> {mins} min read
          </span>
        </div>

        <Link to={`/posts/${post.id}`}>
          <h2 className="post-card__title">{post.title}</h2>
        </Link>

        <p className="post-card__summary">{post.summary}</p>

        <div className="post-card__footer">
          <div className="post-card__author">
            <div
              className="avatar"
              style={{ background: `hsl(${post.author_avatar_color})` }}
            >
              {post.author_name?.[0]?.toUpperCase()}
            </div>
            <div className="post-card__author-info">
              <span className="post-card__author-name">{post.author_name}</span>
              <span className="post-card__date">
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </span>
            </div>
          </div>
          <Link to={`/posts/${post.id}`} className="post-card__read-btn">
            Read <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
