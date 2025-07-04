import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { Bar, Pie, Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

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
    <div className="stats-panel">
      <h2 className="mb-4">Estadísticas de Órdenes Internas</h2>
      <p>Total de órdenes: {totalOrdenes}</p>

      <div className="chart-container">
        <h5 className="text-center">Órdenes por usuario</h5>
        <Bar data={barUsuarioData} options={{ maintainAspectRatio: false }} />
      </div>

      <div className="chart-container">
        <h5 className="text-center">Órdenes por material</h5>
        <Bar data={barMaterialData} options={{ ...barMaterialOptions, maintainAspectRatio: false }} />
      </div>

      <div className="chart-container">
        <h5 className="text-center">Peso total por proyecto</h5>
        <Bar data={barPesoData} options={{ maintainAspectRatio: false }} />
      </div>

      <div className="chart-container">
        <h5 className="text-center">Órdenes por mes</h5>
        <Line data={lineMesData} options={{ maintainAspectRatio: false }} />
      </div>
    </div>
  );
};

export default Estadisticas;
