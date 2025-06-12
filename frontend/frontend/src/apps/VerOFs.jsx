import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import {
  Package,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Search,
  BarChart3,
} from 'lucide-react';

const getStatus = (orden) => {
  if (orden.fecha_fin) return 'completed';
  if (orden.fecha_inicio) return 'in-progress';
  return 'pending';
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={16} className="text-success me-1" />;
    case 'in-progress':
      return <Clock size={16} className="text-warning me-1" />;
    case 'pending':
      return <AlertCircle size={16} className="text-primary me-1" />;
    default:
      return null;
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'completed':
      return 'Completado';
    case 'in-progress':
      return 'En progreso';
    case 'pending':
      return 'Pendiente';
    default:
      return '';
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'completed':
      return 'badge bg-success-subtle text-success-emphasis';
    case 'in-progress':
      return 'badge bg-warning-subtle text-warning-emphasis';
    case 'pending':
      return 'badge bg-primary-subtle text-primary-emphasis';
    default:
      return '';
  }
};

const VerOFs = () => {
  const token = localStorage.getItem('token');
  const [ordenes, setOrdenes] = useState([]);
  const [externas, setExternas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionada, setSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!token) return;
    axios
      .get('http://localhost:3000/ordenes', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrdenes(res.data))
      .catch((err) => console.error('Error obteniendo internas', err));

    axios
      .get('http://localhost:3000/ordenes-externas', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setExternas(res.data))
      .catch((err) => console.error('Error obteniendo externas', err));
  }, [token]);

  const filtradas = ordenes.filter((o) => {
    const texto = `${o.figura} ${o.nombre_cliente} ${o.nombre_proyecto}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  const totals = {
    total: ordenes.length,
    completed: ordenes.filter((o) => getStatus(o) === 'completed').length,
    inProgress: ordenes.filter((o) => getStatus(o) === 'in-progress').length,
    pending: ordenes.filter((o) => getStatus(o) === 'pending').length,
  };

  return (
    <div className="container mt-4">
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card h-100 text-center">
            <div className="card-body">
              <Package className="mb-2" />
              <div className="text-muted small">Total Órdenes</div>
              <div className="h4 mb-0">{totals.total}</div>
            </div>
            <div className="card-footer text-success small">
              <TrendingUp size={14} className="me-1" />0%
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card h-100 text-center">
            <div className="card-body">
              <CheckCircle2 className="mb-2 text-success" />
              <div className="text-muted small">Completadas</div>
              <div className="h4 mb-0">{totals.completed}</div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card h-100 text-center">
            <div className="card-body">
              <Clock className="mb-2 text-warning" />
              <div className="text-muted small">En progreso</div>
              <div className="h4 mb-0">{totals.inProgress}</div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card h-100 text-center">
            <div className="card-body">
              <AlertCircle className="mb-2 text-primary" />
              <div className="text-muted small">Pendientes</div>
              <div className="h4 mb-0">{totals.pending}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Órdenes Recientes</h5>
            <div className="input-group input-group-sm" style={{ maxWidth: 200 }}>
              <span className="input-group-text">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>ID</th>
                  <th>Proyecto</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((o, idx) => {
                  const status = getStatus(o);
                  return (
                    <tr key={o.id} className="hover" style={{ cursor: 'pointer' }}>
                      <td>#{o.id}</td>
                      <td>{o.nombre_proyecto}</td>
                      <td>{o.nombre_cliente}</td>
                      <td>
                        <span className={getStatusClass(status)}>
                          {getStatusIcon(status)}
                          {getStatusText(status)}
                        </span>
                      </td>
                      <td>{o.fecha_fin ? new Date(o.fecha_fin).toLocaleDateString() : '-'}</td>
                      <td>
                        <Button
                          variant="link"
                          className="p-0"
                          onClick={() => {
                            setSeleccionada(o);
                            setShowModal(true);
                          }}
                        >
                          Ver detalles <ChevronRight size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {externas.length > 0 && (
            <>
              <hr />
              <h6 className="mt-3">Órdenes Externas</h6>
              <ul className="list-group mb-0">
                {externas.map((o) => (
                  <li className="list-group-item" key={o.id}>
                    <a href={`http://localhost:3000${o.pdf_path}`} target="_blank" rel="noreferrer">
                      {o.figura} - {o.cliente}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body text-center">
          <BarChart3 size={48} className="text-muted" />
          <p className="text-muted mb-0">Gráfico de actividad se mostrará aquí</p>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Detalle de OF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {seleccionada && (
            <div>
              <p>
                <strong>Figura:</strong> {seleccionada.figura}
              </p>
              <p>
                <strong>Cliente:</strong> {seleccionada.nombre_cliente}
              </p>
              <p>
                <strong>Proyecto:</strong> {seleccionada.nombre_proyecto}
              </p>
              <p>
                <strong>Código:</strong> {seleccionada.codigo_proyecto}
              </p>
              <p>
                <strong>Responsable:</strong> {seleccionada.responsable}
              </p>
              <p>
                <strong>Inicio:</strong>{' '}
                {seleccionada.fecha_inicio ? new Date(seleccionada.fecha_inicio).toLocaleDateString() : 'N/A'}
              </p>
              <p>
                <strong>Fin:</strong>{' '}
                {seleccionada.fecha_fin ? new Date(seleccionada.fecha_fin).toLocaleDateString() : 'N/A'}
              </p>
              <p>
                <strong>Creada:</strong>{' '}
                {new Date(seleccionada.fecha_creacion).toLocaleString()}
              </p>
              <p>
                <strong>Pertenece a:</strong> {localStorage.getItem('username')}
              </p>
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
