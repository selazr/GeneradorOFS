import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post(`${API_URL}/login`, form);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("rol", response.data.rol);
      localStorage.setItem("username", response.data.nombre);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error en el login", error);
      setError("Credenciales incorrectas. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Fondo de video */}
      <video className="bg-video" autoPlay loop muted>
        <source src="/video.mp4" type="video/mp4" />
        Tu navegador no soporta videos HTML5.
      </video>

      <div className="auth-container">
        {/* Logo en lugar de h2 */}
        <img src="/logo.png" alt="Log" className="logo-lxh" />

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input type="email" name="email" placeholder="Correo" onChange={handleChange} required />
          <div className="password-container">
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              placeholder="Contraseña" 
              onChange={handleChange} 
              required 
            />
            <button 
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <button type="submit">Ingresar</button>
        </form>

        <p>¿No tienes cuenta? <b><a href="/register">Regístrate aquí</a></b></p>
      </div>
    </div>
  );
};

export default Login;
