import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Dashboard.css";
import Ordenes from "../apps/Ordenes";

const Dashboard = () => {
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState("");
  const [appSeleccionada, setAppSeleccionada] = useState("Inicio");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const nombreUsuario = localStorage.getItem("username");

    if (!token || !nombreUsuario) {
      navigate("/login");
      return;
    }

    axios
      .get(`http://localhost:3000/usuarios/${nombreUsuario}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setMensaje(`Bienvenido ${response.data.nombre}`))
      .catch(() => {
        alert("Error al cargar la sesión");
        navigate("/login");
      });
  }, [navigate]);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setMenuAbierto(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="d-flex">
      {/* Sidebar (barra lateral) */}
      <div className="sidebar bg-dark text-white p-4" style={{ minHeight: '100vh' }}>
  <div className="text-center">
    <img src="/logo.png" alt="LXH" className="logo" style={{ maxWidth: '80%' }} />
  </div>
  <h4 className="mt-4 text-center">Aplicaciones</h4>
  <ul className="nav flex-column align-items-center">
    <li className="nav-item">
      <button
        className="nav-link text-white btn btn-link w-100 text-center p-2"
        onClick={() => setAppSeleccionada("ordenes")}
        style={{
          transition: 'background-color 0.3s, transform 0.2s',
          border: 'none',
          textAlign: 'center',
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#575757'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
      >
        Ordenes
      </button>
    </li>
  </ul>
</div>


      {/* Contenido principal */}
      <div className="main-content flex-grow-1">
        {/* Navbar (barra superior) */}
        <nav className="navbar navbar-light bg-light p-3 d-flex justify-content-between">
          <span>{mensaje}</span>
          <div className="dropdown" ref={dropdownRef}>
            <img
              src="/silueta.jpg"
              alt=""
              className="perfil-img dropdown-toggle"
              onClick={() => setMenuAbierto(!menuAbierto)}
            />
            {menuAbierto && (
              <div className="dropdown-menu show position-absolute end-0 mt-2" style={{ right: 0 }}>
                <button className="dropdown-item" onClick={() => navigate("/perfil")}>Ver Perfil</button>
                <button className="dropdown-item" onClick={() => navigate("/editar-perfil")}>Editar Perfil</button>
                <button className="dropdown-item text-danger" onClick={cerrarSesion}>Cerrar Sesión</button>
              </div>
            )}
          </div>
        </nav>

        {/* Área de la aplicación seleccionada */}
        <div className="p-4">
          {appSeleccionada === "ordenes" && <Ordenes />}
          {appSeleccionada === "aplicacion2" && <h2>Aplicación 2</h2>}
          {appSeleccionada === "aplicacion3" && <h2>Aplicación 3</h2>}
          {appSeleccionada === "Inicio" && (
      <div class="patch-notes">
          <h2>Versión 1.0.1</h2>
          <ul>
            <li>Mejoras en el rendimiento del dashboard</li>
            <li>Nuevo diseño de bienvenida</li>
            <li>Corrección de errores menores</li>
            <li>Implementacion y correcion de errores al lanzar OF</li>
            <b><li>¡YA PUEDEN GENERAR OF CLIENTE!</li></b>
          </ul>
      </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
