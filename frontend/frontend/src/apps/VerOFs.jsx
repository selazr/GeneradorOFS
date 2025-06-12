import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';

const VerOFs = () => {
  const token = localStorage.getItem('token');
  const [internas, setInternas] = useState([]);
  const [externas, setExternas] = useState([]);
  const [ofSeleccionada, setOfSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);

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
          <li
            key={o.id}
            className="list-group-item"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setOfSeleccionada(o);
              setShowModal(true);
            }}
          >
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
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Detalle de OF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ofSeleccionada && (
            <div>
              <p><strong>Figura:</strong> {ofSeleccionada.figura}</p>
              <p><strong>Cliente:</strong> {ofSeleccionada.nombre_cliente}</p>
              <p><strong>Proyecto:</strong> {ofSeleccionada.nombre_proyecto}</p>
              <p><strong>Código:</strong> {ofSeleccionada.codigo_proyecto}</p>
              <p><strong>Responsable:</strong> {ofSeleccionada.responsable}</p>
              <p><strong>Inicio:</strong> {ofSeleccionada.fecha_inicio ? new Date(ofSeleccionada.fecha_inicio).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Fin:</strong> {ofSeleccionada.fecha_fin ? new Date(ofSeleccionada.fecha_fin).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Creada:</strong> {new Date(ofSeleccionada.fecha_creacion).toLocaleString()}</p>
              <p><strong>Pertenece a:</strong> {localStorage.getItem('username')}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VerOFs;
