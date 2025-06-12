import React, { useEffect, useState } from 'react';
import axios from 'axios';

const VerOFs = () => {
  const token = localStorage.getItem('token');
  const [internas, setInternas] = useState([]);
  const [externas, setExternas] = useState([]);

  useEffect(() => {
    if (!token) return;
    axios
      .get('http://localhost:3000/ordenes', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setInternas(res.data))
      .catch(err => console.error('Error obteniendo internas', err));

    axios
      .get('http://localhost:3000/ordenes-externas', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setExternas(res.data))
      .catch(err => console.error('Error obteniendo externas', err));
  }, [token]);

  return (
    <div className="container">
      <h4>Órdenes Internas</h4>
      <ul className="list-group mb-4">
        {internas.map(o => (
          <li key={o.id} className="list-group-item">
            {o.figura} - {o.nombre_cliente}
          </li>
        ))}
      </ul>
      <h4>Órdenes Externas</h4>
      <ul className="list-group">
        {externas.map(o => (
          <li key={o.id} className="list-group-item">
            <a href={`http://localhost:3000${o.pdf_path}`} target="_blank" rel="noreferrer">
              {o.figura} - {o.cliente}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VerOFs;
