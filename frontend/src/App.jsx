import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import CanvasParticles from './components/CanvasParticles';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PostDetail from './pages/PostDetail';
import CreateEditPost from './pages/CreateEditPost';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          {/* Global animated particle background */}
          <CanvasParticles />

          {/* Navigation */}
          <Navbar />

          {/* Page content */}
          <main style={{ position: 'relative', zIndex: 1 }}>
            <Routes>
              <Route path="/"            element={<Home />} />
              <Route path="/login"       element={<Login />} />
              <Route path="/register"    element={<Register />} />
              <Route path="/posts/:id"   element={<PostDetail />} />
              <Route path="/create"      element={<CreateEditPost />} />
              <Route path="/edit/:id"    element={<CreateEditPost />} />
              <Route path="/dashboard"   element={<Dashboard />} />
              <Route path="*"            element={<Home />} />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
