import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";


const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "usuario" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validarEmail = (email) => email.endsWith("@lxh.es");

  const validarPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validarEmail(form.email)) {
      setError("El correo debe terminar en @lxh.es");
      return;
    }

    if (!validarPassword(form.password)) {
      setError("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.");
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/register`,
        form
      );
      alert("Usuario registrado con éxito");
      navigate("/login");
    } catch (error) {
      console.error("Error en el registro", error);
      setError("Error al registrar usuario");
    }
  };

  return (
    <div className="auth-wrapper">
      <video className="bg-video" autoPlay loop muted>
        <source src="/video.mp4" type="video/mp4" />
        Tu navegador no soporta videos HTML5.
      </video>
      <div className="auth-container">
        <h2>Registro</h2>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input type="text" name="nombre" placeholder="Nombre" onChange={handleChange} required />
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

          <select name="rol" onChange={handleChange}>
            <option value="usuario">Usuario</option>
          </select>

          <button type="submit">Registrarse</button>
        </form>

        <p>¿Ya tienes cuenta? <b><a href="/login">Inicia sesión aquí</a></b></p>
      </div>
    </div>
  );
};

export default Register;
