import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from '../api';
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Dashboard.css";
import Ordenes from "../apps/Ordenes";
import OrdenesExternas from "../apps/OrdenesExternas";
import VerOFs from "../apps/VerOFs";
import Estadisticas from "../apps/Estadisticas";
import { Modal, Button } from "react-bootstrap";
import {
  ActivitySquare,
  BarChart3,
  Boxes,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ChatWidget from "../components/ChatWidget";
import ThemeToggle from "../components/ThemeToggle";

const Dashboard = () => {
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState("");
  const [perfil, setPerfil] = useState(null);
  const [showPerfil, setShowPerfil] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [editData, setEditData] = useState({ nombre: "", email: "", password: "", avatar: null });
  const [appSeleccionada, setAppSeleccionada] = useState("estadisticas");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 992);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 992);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const nombreUsuario = localStorage.getItem("username");

    if (!token || !nombreUsuario) {
      navigate("/login");
      return;
    }

    axios
      .get(`${API_BASE_URL}/usuarios/${nombreUsuario}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setMensaje(`Bienvenido ${response.data.nombre}`);
        setPerfil(response.data);
        setEditData({ nombre: response.data.nombre, email: response.data.email, password: "", avatar: null });
      })
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

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setEditData((prev) => ({ ...prev, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleUpdatePerfil = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      await axios.put(`${API_BASE_URL}/usuarios/${perfil.nombre}`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await axios.get(`${API_BASE_URL}/usuarios/${editData.nombre}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPerfil(res.data);
      localStorage.setItem("username", res.data.nombre);
      setMensaje(`Bienvenido ${res.data.nombre}`);
      setShowEditar(false);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar perfil");
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="d-flex dashboard-shell">
      {/* Sidebar (barra lateral) */}
      <div className={`sidebar p-4 ${sidebarOpen ? '' : 'collapsed'}`} style={{ minHeight: '100vh' }}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="LXH" className="logo" style={{ maxWidth: '80%' }} />
          <p className="tagline mb-0">Organiza y supervisa tus flujos</p>
        </div>
        <div className="sidebar-card mt-4">
          <p className="sidebar-label">Aplicaciones</p>
          <ul className="nav flex-column">
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link ${appSeleccionada === 'estadisticas' ? 'active' : ''}`}
                onClick={() => setAppSeleccionada('estadisticas')}
              >
                <BarChart3 size={18} />
                <span>Estadísticas</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link ${appSeleccionada === 'ordenes' ? 'active' : ''}`}
                onClick={() => setAppSeleccionada("ordenes")}
              >
                <ClipboardList size={18} />
                <span>Órdenes Internas</span>
                <span className="pill">OF</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link ${appSeleccionada === 'externas' ? 'active' : ''}`}
                onClick={() => setAppSeleccionada("externas")}
              >
                <Boxes size={18} />
                <span>Órdenes Externas</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link ${appSeleccionada === 'verofs' ? 'active' : ''}`}
                onClick={() => setAppSeleccionada("verofs")}
              >
                <ActivitySquare size={18} />
                <span>Ver OF's</span>
              </button>
            </li>
          </ul>
          <div className="sidebar-tip mt-3">
            Revisa el detalle de cada orden y mantén la trazabilidad sin salir del panel.
          </div>
        </div>
      </div>


      {sidebarOpen && <div className="sidebar-overlay d-lg-none" onClick={() => setSidebarOpen(false)} />}


      {/* Contenido principal */}
      <div className={`main-content flex-grow-1 ${sidebarOpen ? 'expanded' : 'collapsed'}`}>
        {/* Navbar (barra superior) */}
        <nav className="navbar dashboard-navbar p-3 d-flex justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary me-2 sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
            <div>
              <p className="navbar-eyebrow mb-0">Panel principal</p>
              <span className="fw-semibold">{mensaje}</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <ThemeToggle />
            <div className="dropdown" ref={dropdownRef}>
              <img
                src={perfil?.avatar ? `${API_BASE_URL}${perfil.avatar}` : "/silueta.jpg"}
                alt=""
                className="perfil-img dropdown-toggle"
                onClick={() => setMenuAbierto(!menuAbierto)}
              />
              {menuAbierto && (
                <div className="dropdown-menu show position-absolute end-0 mt-2" style={{ right: 0 }}>
                  <button className="dropdown-item" onClick={() => setShowPerfil(true)}>Ver Perfil</button>
                  <button className="dropdown-item" onClick={() => setShowEditar(true)}>Editar Perfil</button>
                  <button className="dropdown-item text-danger" onClick={cerrarSesion}>Cerrar Sesión</button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Área de la aplicación seleccionada */}
        <div className="p-4">
          {appSeleccionada === "ordenes" && <Ordenes />}
          {appSeleccionada === "externas" && <OrdenesExternas />}
          {appSeleccionada === "verofs" && <VerOFs />}
          {appSeleccionada === "aplicacion2" && <h2>Aplicación 2</h2>}
          {appSeleccionada === "aplicacion3" && <h2>Aplicación 3</h2>}
          {appSeleccionada === "estadisticas" && <Estadisticas />}
        </div>
      </div>
      {/* Modales de perfil */}
      <Modal show={showPerfil} onHide={() => setShowPerfil(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Perfil</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {perfil && (
            <>
              <img
                src={perfil.avatar ? `${API_BASE_URL}${perfil.avatar}` : "/silueta.jpg"}
                alt="avatar"
                className="rounded-circle mb-3"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
              />
              <p><strong>Nombre:</strong> {perfil.nombre}</p>
              <p><strong>Email:</strong> {perfil.email}</p>
            </>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showEditar} onHide={() => setShowEditar(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Perfil</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleUpdatePerfil}>
            <div className="mb-3">
              <label className="form-label">Nombre</label>
              <input className="form-control" name="nombre" value={editData.nombre} onChange={handleEditChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input className="form-control" name="email" value={editData.email} onChange={handleEditChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Contraseña</label>
              <input type="password" className="form-control" name="password" value={editData.password} onChange={handleEditChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Avatar</label>
              <input type="file" className="form-control" onChange={handleAvatarChange} />
            </div>
            <Button variant="primary" type="submit">Guardar</Button>
          </form>
        </Modal.Body>
      </Modal>
      <ChatWidget />
    </div>
  );
};

export default Dashboard;
