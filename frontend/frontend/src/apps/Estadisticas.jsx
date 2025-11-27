import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { Activity, CalendarClock, ClipboardList, TrendingUp, Users, Weight } from 'lucide-react';
import "../styles/Estadisticas.css";

const Estadisticas = () => {
  const [stats, setStats] = useState({
    ordenesPorUsuario: [],
    ordenesPorMaterial: [],
    pesoTotalPorProyecto: [],
    ordenesPorMes: []
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_BASE_URL}/ordenes/estadisticas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setStats(res.data))
      .catch((err) => console.error('Error al cargar estadísticas:', err));
  }, [token]);

  const totalOrdenes = stats.ordenesPorMaterial.reduce((sum, m) => sum + m.total, 0);
  const totalPeso = stats.pesoTotalPorProyecto.reduce((sum, p) => sum + Number(p.total_peso || 0), 0);
  const promedioMensual = stats.ordenesPorMes.length
    ? Math.round(
        stats.ordenesPorMes.reduce((sum, mes) => sum + mes.total, 0) / stats.ordenesPorMes.length
      )
    : 0;

  const topMaterial = useMemo(() => {
    if (!stats.ordenesPorMaterial.length) return { material: "N/D", total: 0 };
    return stats.ordenesPorMaterial.reduce((max, item) => (item.total > max.total ? item : max));
  }, [stats.ordenesPorMaterial]);

  const topUsuario = useMemo(() => {
    if (!stats.ordenesPorUsuario.length) return { usuario: "N/D", total: 0 };
    return stats.ordenesPorUsuario.reduce((max, item) => (item.total > max.total ? item : max));
  }, [stats.ordenesPorUsuario]);

  const resumenCards = [
    {
      label: "Órdenes totales",
      value: totalOrdenes,
      helper: `${stats.ordenesPorMes.length || 0} periodos registrados`,
      icon: <ClipboardList size={18} />,
      tone: "primary",
    },
    {
      label: "Promedio mensual",
      value: promedioMensual,
      helper: "Volumen estimado de órdenes",
      icon: <CalendarClock size={18} />,
      tone: "info",
    },
    {
      label: "Peso total",
      value: `${totalPeso.toFixed(1)} kg`,
      helper: "Suma de proyectos declarados",
      icon: <Weight size={18} />,
      tone: "success",
    },
    {
      label: "Usuario líder",
      value: topUsuario.usuario,
      helper: `${topUsuario.total || 0} órdenes gestionadas`,
      icon: <Users size={18} />,
      tone: "warning",
    },
  ];

  const barMaterialData = {
    labels: stats.ordenesPorMaterial.map((m) => m.material || 'Sin material'),
    datasets: [
      {
        label: 'Órdenes por material',
        data: stats.ordenesPorMaterial.map((m) => m.total),
        backgroundColor: '#17a2b8'
      }
    ]
  };

  const barMaterialOptions = {
    indexAxis: 'y'
  };

  const barUsuarioData = {
    labels: stats.ordenesPorUsuario.map((u) => u.usuario),
    datasets: [
      {
        label: 'Órdenes por usuario',
        data: stats.ordenesPorUsuario.map((u) => u.total),
        backgroundColor: '#007bff'
      }
    ]
  };

  const barPesoData = {
    labels: stats.pesoTotalPorProyecto.map((p) => p.proyecto),
    datasets: [
      {
        label: 'Peso total',
        data: stats.pesoTotalPorProyecto.map((p) => p.total_peso),
        backgroundColor: '#28a745'
      }
    ]
  };

  const lineMesData = {
    labels: stats.ordenesPorMes.map((m) => m.mes),
    datasets: [
      {
        label: 'Órdenes por mes',
        data: stats.ordenesPorMes.map((m) => m.total),
        borderColor: '#6610f2',
        backgroundColor: 'rgba(102,16,242,0.2)',
        fill: false,
        tension: 0.3
      }
    ]
  };

  return (
    <div className="stats-panel container-fluid">
      <div className="card gradient-card stats-hero mb-4 p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <p className="navbar-eyebrow mb-2">Estadísticas</p>
            <h2 className="mb-1">Órdenes internas y rendimiento</h2>
            <p className="text-muted mb-0">
              Visualiza el desempeño por usuario y material, junto a la carga mensual de producción.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-3 justify-content-end stats-summary">
            {resumenCards.map((card, idx) => (
              <div key={idx} className={`stat-chip ${card.tone}`}>
                <div className="icon-wrapper">{card.icon}</div>
                <div>
                  <p className="mb-0 chip-label">{card.label}</p>
                  <h4 className="mb-0 chip-value">{card.value}</h4>
                  <small className="text-muted">{card.helper}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="icon-circle info"><Activity size={18} /></div>
            <span className="badge bg-soft">{stats.ordenesPorUsuario.length} usuarios</span>
          </div>
          <h5 className="mb-1">Actividad por usuario</h5>
          <p className="text-muted mb-3">Distribución de órdenes creadas por cada responsable.</p>
          <div className="chart-wrapper"><Bar data={barUsuarioData} options={{ maintainAspectRatio: false }} /></div>
        </div>

        <div className="stat-card">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="icon-circle warning"><TrendingUp size={18} /></div>
            <span className="badge bg-soft">Material líder</span>
          </div>
          <h5 className="mb-1">Órdenes por material</h5>
          <p className="text-muted mb-1">Material con más uso: <strong>{topMaterial.material}</strong></p>
          <small className="text-muted d-block mb-3">{topMaterial.total || 0} órdenes registradas.</small>
          <div className="chart-wrapper"><Bar data={barMaterialData} options={{ ...barMaterialOptions, maintainAspectRatio: false }} /></div>
        </div>

        <div className="stat-card">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="icon-circle success"><Weight size={18} /></div>
            <span className="badge bg-soft">Carga total</span>
          </div>
          <h5 className="mb-1">Peso total por proyecto</h5>
          <p className="text-muted mb-3">Monitorea la suma de peso declarado en cada proyecto.</p>
          <div className="chart-wrapper"><Bar data={barPesoData} options={{ maintainAspectRatio: false }} /></div>
        </div>

        <div className="stat-card">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="icon-circle primary"><CalendarClock size={18} /></div>
            <span className="badge bg-soft">Tendencia</span>
          </div>
          <h5 className="mb-1">Órdenes por mes</h5>
          <p className="text-muted mb-3">Crecimiento temporal para anticipar cargas de trabajo.</p>
          <div className="chart-wrapper"><Line data={lineMesData} options={{ maintainAspectRatio: false }} /></div>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;
