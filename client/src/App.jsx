import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Result from './pages/Result';
import Saved from './pages/Saved';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Categories from './pages/Categories';
import Trending from './pages/Trending';
import PdfQa from './pages/PdfQa';

function App() {
  return (
    <div className="min-h-screen bg-bg text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/result" element={<Result />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pdf-qa" element={<PdfQa />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
