// Nuevo Dashboard moderno - Integrado con tus funcionalidades actuales
import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  ChevronRight,
  Search
} from 'lucide-react';
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const [totalOrdenes, setTotalOrdenes] = useState(0);
  const [completadas, setCompletadas] = useState(0);
  const [enProgreso, setEnProgreso] = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [ordenesRecientes, setOrdenesRecientes] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3000/ordenes/stats")
      .then((response) => {
        setTotalOrdenes(response.data.total);
        setCompletadas(response.data.completadas);
        setEnProgreso(response.data.enProgreso);
        setPendientes(response.data.pendientes);
        setOrdenesRecientes(response.data.ordenesRecientes);
      })
      .catch((error) => console.error("Error al cargar estadísticas", error));
  }, []);

  return (
    <div className="dashboard space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p className="text-gray-500">Bienvenido de nuevo, aquí está el resumen de tus órdenes.</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <Package className="icon" />
          <div>
            <p>Total Órdenes</p>
            <h3>{totalOrdenes}</h3>
          </div>
        </div>

        <div className="stat-card">
          <CheckCircle2 className="icon text-green-500" />
          <div>
            <p>Completadas</p>
            <h3>{completadas}</h3>
          </div>
        </div>

        <div className="stat-card">
          <Clock className="icon text-yellow-500" />
          <div>
            <p>En Progreso</p>
            <h3>{enProgreso}</h3>
          </div>
        </div>

        <div className="stat-card">
          <AlertCircle className="icon text-red-500" />
          <div>
            <p>Pendientes</p>
            <h3>{pendientes}</h3>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card mt-4 p-4 shadow-sm bg-white rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Órdenes Recientes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar orden..." 
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <table className="table-auto w-full text-left">
          <thead>
            <tr className="text-gray-600">
              <th>ID</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {ordenesRecientes.length ? (
              ordenesRecientes.map((orden, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td>#{orden.id}</td>
                  <td>{orden.nombre}</td>
                  <td>
                    <span className={`status-badge ${orden.estado.toLowerCase()}`}>
                      {orden.estado}
                    </span>
                  </td>
                  <td>{orden.fecha}</td>
                  <td>
                    <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                      Ver detalles
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-4">
                  No hay órdenes recientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
