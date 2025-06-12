import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

const Estadisticas = () => {
  const [ordenes, setOrdenes] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    axios
      .get('http://localhost:3000/ordenes', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrdenes(res.data))
      .catch((err) => console.error('Error al cargar estadísticas:', err));
  }, [token]);

  const totalOrdenes = ordenes.length;
  const porMaterial = {};
  const porResponsable = {};
  ordenes.forEach((o) => {
    if (o.material) {
      porMaterial[o.material] = (porMaterial[o.material] || 0) + 1;
    }
    if (o.responsable) {
      porResponsable[o.responsable] = (porResponsable[o.responsable] || 0) + 1;
    }
  });

  const materiales = Object.keys(porMaterial);
  const materialCounts = Object.values(porMaterial);

  const responsables = Object.keys(porResponsable);
  const responsableCounts = Object.values(porResponsable);

  const pieData = {
    labels: materiales,
    datasets: [
      {
        data: materialCounts,
        backgroundColor: [
          '#007bff',
          '#28a745',
          '#dc3545',
          '#ffc107',
          '#17a2b8',
          '#6610f2',
        ],
      },
    ],
  };

  const barData = {
    labels: responsables,
    datasets: [
      {
        label: 'Órdenes por responsable',
        data: responsableCounts,
        backgroundColor: '#007bff',
      },
    ],
  };

  return (
    <div className="stats-panel">
      <h2 className="mb-4">Estadísticas de Órdenes Internas</h2>
      <p>Total de órdenes: {totalOrdenes}</p>
      <div className="row">
        <div className="col-md-6 mb-4">
          <h5 className="text-center">Órdenes por material</h5>
          <Pie data={pieData} />
        </div>
        <div className="col-md-6 mb-4">
          <h5 className="text-center">Órdenes por responsable</h5>
          <Bar data={barData} />
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;
