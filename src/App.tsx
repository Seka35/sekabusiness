import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Tools from './pages/Tools';
import Prompts from './pages/Prompts';
import Blog from './pages/Blog';
import Admin from './pages/Admin';
import Chat from './pages/Chat';
import Subscribe from './pages/Subscribe';
import Login from './pages/Login';
import Profile from './pages/Profile';
import N8nScripts from './pages/N8nScripts';
import { Monitor, BookOpen, MessageSquare, User, FileJson } from 'lucide-react';
import AdminRoute from './components/AdminRoute';
import PrivateRoute from './components/PrivateRoute';
import UpdatePassword from './pages/UpdatePassword';

function App() {
  const navItems = [
    { name: 'Tools', path: '/', icon: Monitor },
    { name: 'Prompts', path: '/prompts', icon: BookOpen },
    { name: 'Blog', path: '/blog', icon: Monitor },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'N8N', path: '/n8n-scripts', icon: FileJson },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <Navbar items={navItems} />
        <main className="container mx-auto px-4 py-8 pt-24">
          <Routes>
            <Route path="/" element={<Tools />} />
            <Route path="/prompts" element={
              <PrivateRoute>
                <Prompts />
              </PrivateRoute>
            } />
            <Route path="/blog" element={
              <PrivateRoute>
                <Blog />
              </PrivateRoute>
            } />
            <Route path="/n8n-scripts" element={
              <PrivateRoute>
                <N8nScripts />
              </PrivateRoute>
            } />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/update-password" element={<UpdatePassword />} />
          </Routes>
        </main>
        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;