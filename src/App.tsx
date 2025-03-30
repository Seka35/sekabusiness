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
import { Monitor, BookOpen, MessageSquare, User } from 'lucide-react';
import AdminRoute from './components/AdminRoute';

function App() {
  const navItems = [
    { name: 'Tools', path: '/', icon: Monitor },
    { name: 'Prompts', path: '/prompts', icon: BookOpen },
    { name: 'Blog', path: '/blog', icon: Monitor },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <Navbar items={navItems} />
        <main className="container mx-auto px-4 py-8 pt-24">
          <Routes>
            <Route path="/" element={<Tools />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/blog" element={<Blog />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
            <Route path="/chat" element={<Chat />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;