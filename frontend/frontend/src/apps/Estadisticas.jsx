import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

const Estadisticas = () => {
  const [stats, setStats] = useState({
    ordenesPorUsuario: [],
    ordenesPorMaterial: [],
    pesoTotalPorProyecto: []
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    axios
      .get('http://localhost:3000/ordenes/estadisticas', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setStats(res.data))
      .catch((err) => console.error('Error al cargar estadísticas:', err));
  }, [token]);

  const totalOrdenes = stats.ordenesPorMaterial.reduce(
    (sum, m) => sum + Number(m.total),
    0
  );

  const pieData = {
    labels: stats.ordenesPorMaterial.map((m) => m.material || 'Sin material'),
    datasets: [
      {
        data: stats.ordenesPorMaterial.map((m) => m.total),
        backgroundColor: [
          '#007bff',
          '#28a745',
          '#dc3545',
          '#ffc107',
          '#17a2b8',
          '#6610f2'
        ]
      }
    ]
  };

  const barUsuarioData = {
    labels: stats.ordenesPorUsuario.map((u) => u.usuario),
    datasets: [
      {
        label: 'Órdenes por usuario',
        data: stats.ordenesPorUsuario.map((u) => Number(u.total)),
        backgroundColor: '#007bff'
      }
    ]
  };

  const barPesoData = {
    labels: stats.pesoTotalPorProyecto.map((p) => p.proyecto),
    datasets: [
      {
        label: 'Peso total',
        data: stats.pesoTotalPorProyecto.map((p) => Number(p.total_peso)),
        backgroundColor: '#28a745'
      }
    ]
  };

  return (
    <div className="stats-panel">
      <h2 className="mb-4">Estadísticas de Órdenes Internas</h2>
      <p>Total de órdenes: {totalOrdenes}</p>
      <div className="row">
        <div className="col-md-4 mb-4">
          <h5 className="text-center">Órdenes por usuario</h5>
          <Bar data={barUsuarioData} />
        </div>
        <div className="col-md-4 mb-4">
          <h5 className="text-center">Órdenes por material</h5>
          <Pie data={pieData} />
        </div>
        <div className="col-md-4 mb-4">
          <h5 className="text-center">Peso total por proyecto</h5>
          <Bar data={barPesoData} />
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;
