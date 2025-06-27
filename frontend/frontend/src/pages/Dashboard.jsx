import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../api";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Dashboard.css";
import Ordenes from "../apps/Ordenes";
import OrdenesExternas from "../apps/OrdenesExternas";
import VerOFs from "../apps/VerOFs";
import Estadisticas from "../apps/Estadisticas";
import { Modal, Button } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ChatWidget from "../components/ChatWidget";

const Dashboard = () => {
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState("");
  const [perfil, setPerfil] = useState(null);
  const [showPerfil, setShowPerfil] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [editData, setEditData] = useState({ nombre: "", email: "", password: "", avatar: null });
  const [appSeleccionada, setAppSeleccionada] = useState("estadisticas");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const nombreUsuario = localStorage.getItem("username");

    if (!token || !nombreUsuario) {
      navigate("/login");
      return;
    }

    axios
      .get(`${API_URL}/usuarios/${nombreUsuario}`, {
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
      await axios.put(`${API_URL}/usuarios/${perfil.nombre}`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await axios.get(`${API_URL}/usuarios/${editData.nombre}`, {
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
    <div className="d-flex">
      {/* Sidebar (barra lateral) */}
      <div className={`sidebar bg-dark text-white p-4 ${sidebarOpen ? '' : 'collapsed'}`} style={{ minHeight: '100vh' }}>
  <div className="text-center">
    <img src="/logo.png" alt="LXH" className="logo" style={{ maxWidth: '80%' }} />
  </div>
  <h4 className="mt-4 text-center">Aplicaciones</h4>
  <ul className="nav flex-column align-items-center">
    <li className="nav-item">
      <button
        className={`nav-link text-white btn btn-link w-100 text-center p-2 ${appSeleccionada === 'estadisticas' ? 'active' : ''}`}
        onClick={() => setAppSeleccionada('estadisticas')}
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
        Estadísticas
      </button>
    </li>
    <li className="nav-item">
      <button
        className={`nav-link text-white btn btn-link w-100 text-center p-2 ${appSeleccionada === 'ordenes' ? 'active' : ''}`}
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
        Ordenes Internas
      </button>
    </li>
    <li className="nav-item">
      <button
        className={`nav-link text-white btn btn-link w-100 text-center p-2 ${appSeleccionada === 'externas' ? 'active' : ''}`}
        onClick={() => setAppSeleccionada("externas")}
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
        Ordenes Externas
      </button>
    </li>
    <li className="nav-item">
      <button
        className={`nav-link text-white btn btn-link w-100 text-center p-2 ${appSeleccionada === 'verofs' ? 'active' : ''}`}
        onClick={() => setAppSeleccionada("verofs")}
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
        Ver OF's
      </button>
    </li>
  </ul>
</div>


      {/* Contenido principal */}
      <div className={`main-content flex-grow-1 ${sidebarOpen ? 'expanded' : 'collapsed'}`}>
        {/* Navbar (barra superior) */}
        <nav className="navbar navbar-light bg-light p-3 d-flex justify-content-between">
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-secondary me-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
            <span>{mensaje}</span>
          </div>
          <div className="dropdown" ref={dropdownRef}>
            <img
              src={perfil?.avatar ? `${API_URL}${perfil.avatar}` : "/silueta.jpg"}
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
                src={perfil.avatar ? `${API_URL}${perfil.avatar}` : "/silueta.jpg"}
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
