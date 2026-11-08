import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Gigs from './pages/Gigs';
import GigDetails from './pages/GigDetails';
import CreateGig from './pages/CreateGig';
import EditGig from './pages/EditGig';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/gigs" element={<Gigs />} />
          <Route
            path="/gigs/new"
            element={
              <ProtectedRoute roles={['client']}>
                <CreateGig />
              </ProtectedRoute>
            }
          />
          <Route path="/gigs/:id" element={<GigDetails />} />
          <Route
            path="/gigs/:id/edit"
            element={
              <ProtectedRoute roles={['client']}>
                <EditGig />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
