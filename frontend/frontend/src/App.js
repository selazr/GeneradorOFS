import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./pages/Dashboard";
import Ordenes from './apps/Ordenes';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirigir a /login por defecto si no hay ruta */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ordenes" element={<Ordenes />} />
      </Routes>
    </Router>
  );
}

export default App;
