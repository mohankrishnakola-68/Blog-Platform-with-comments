import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Feather } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password || !form.confirm) {
      toast.error('Please fill in all fields.'); return;
    }
    if (form.username.length < 3) {
      toast.error('Username must be at least 3 characters.'); return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.'); return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match.'); return;
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      toast.success('Account created! Welcome to InkSpace 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <div className="auth-card glass-card animate-fade-in-up">
        <div className="auth-header">
          <div className="auth-logo"><Feather size={28} /></div>
          <h1 className="auth-title">Join InkSpace</h1>
          <p className="auth-subtitle">Create your free account and start writing today</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">Username</label>
            <input id="reg-username" name="username" className="form-input"
              type="text" placeholder="your_username" value={form.username} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input id="reg-email" name="email" className="form-input"
              type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="input-password-wrap">
              <input id="reg-password" name="password" className="form-input"
                type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                value={form.password} onChange={handleChange} />
              <button type="button" className="input-eye-btn" onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <input id="reg-confirm" name="confirm" className="form-input"
              type="password" placeholder="Repeat your password"
              value={form.confirm} onChange={handleChange} />
          </div>

          <button type="submit" id="register-submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
