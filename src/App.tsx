import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ProjectSetup from './pages/ProjectSetup';
import Dashboard from './pages/Dashboard';
import Checklist from './pages/Checklist';
import Workers from './pages/Workers';
import Expenses from './pages/Expenses';
import Files from './pages/Files';
import Chat from './pages/Chat';
import AIAssistant from './pages/AIAssistant';

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/project-setup" element={
            <PrivateRoute>
              <ProjectSetup />
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/project/:id/checklist" element={
            <PrivateRoute>
              <Checklist />
            </PrivateRoute>
          } />
          <Route path="/project/:id/workers" element={
            <PrivateRoute>
              <Workers />
            </PrivateRoute>
          } />
          <Route path="/project/:id/expenses" element={
            <PrivateRoute>
              <Expenses />
            </PrivateRoute>
          } />
          <Route path="/project/:id/files" element={
            <PrivateRoute>
              <Files />
            </PrivateRoute>
          } />
          <Route path="/project/:id/chat" element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          } />
          <Route path="/project/:id/ai" element={
            <PrivateRoute>
              <AIAssistant />
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
