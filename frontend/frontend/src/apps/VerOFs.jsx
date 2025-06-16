import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";
import {
  Package,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";

const getStatus = (orden) => {
  if (orden.fecha_fin) return "completed";
  if (orden.fecha_inicio) return "in-progress";
  return "pending";
};

const getStatusIcon = (status) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 size={16} className="text-success me-1" />;
    case "in-progress":
      return <Clock size={16} className="text-warning me-1" />;
    case "pending":
      return <AlertCircle size={16} className="text-primary me-1" />;
    default:
      return null;
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "completed":
      return "Completado";
    case "in-progress":
      return "En progreso";
    case "pending":
      return "Pendiente";
    default:
      return "";
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case "completed":
      return "badge bg-success-subtle text-success-emphasis";
    case "in-progress":
      return "badge bg-warning-subtle text-warning-emphasis";
    case "pending":
      return "badge bg-primary-subtle text-primary-emphasis";
    default:
      return "";
  }
};

const VerOFs = () => {
  const token = localStorage.getItem("token");
  const [ordenes, setOrdenes] = useState([]);
  const [externas, setExternas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaExternas, setBusquedaExternas] = useState("");
  const [seleccionada, setSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [paginaInternas, setPaginaInternas] = useState(1);
  const [paginaExternas, setPaginaExternas] = useState(1);

  const itemsPorPagina = 5;

  useEffect(() => {
    if (!token) return;
    axios
      .get("http://localhost:3000/ordenes/all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrdenes(res.data))
      .catch((err) => console.error("Error obteniendo internas", err));

    axios
      .get("http://localhost:3000/ordenes-externas/all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setExternas(res.data))
      .catch((err) => console.error("Error obteniendo externas", err));
  }, [token]);

  const filtradas = ordenes.filter((o) => {
    const texto =
      `${o.figura} ${o.nombre_cliente} ${o.nombre_proyecto}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  const filtradasExternas = externas.filter((o) => {
    const texto = `${o.figura} ${o.proyecto} ${o.cliente}`.toLowerCase();
    return texto.includes(busquedaExternas.toLowerCase());
  });

  const totalPaginasInternas = Math.ceil(filtradas.length / itemsPorPagina) || 1;
  const totalPaginasExternas = Math.ceil(filtradasExternas.length / itemsPorPagina) || 1;

  useEffect(() => {
    setPaginaInternas(1);
  }, [busqueda, ordenes]);

  useEffect(() => {
    setPaginaExternas(1);
  }, [busquedaExternas, externas]);

  const paginadas = filtradas.slice(
    (paginaInternas - 1) * itemsPorPagina,
    paginaInternas * itemsPorPagina
  );

  const paginadasExternas = filtradasExternas.slice(
    (paginaExternas - 1) * itemsPorPagina,
    paginaExternas * itemsPorPagina
  );

  const getVisiblePages = (current, total) => {
    let start = Math.max(current - 1, 1);
    let end = Math.min(start + 2, total);
    if (end - start < 2) {
      start = Math.max(end - 2, 1);
    }
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const totals = {
    total: ordenes.length,
    completed: ordenes.filter((o) => getStatus(o) === "completed").length,
    inProgress: ordenes.filter((o) => getStatus(o) === "in-progress").length,
    pending: ordenes.filter((o) => getStatus(o) === "pending").length,
  };

  const obtenerFecha = (o, esExterna = false) => {
    if (esExterna) {
      if (o.pdf_path) {
        const m = o.pdf_path.match(/(\d+)-/);
        if (m) return new Date(Number(m[1]));
      }
      return o.fecha_creacion ? new Date(o.fecha_creacion) : null;
    }
    return o.fecha_inicio
      ? new Date(o.fecha_inicio)
      : o.fecha_creacion
        ? new Date(o.fecha_creacion)
        : null;
  };

  const contarPorDia = (lista, dias, esExterna = false) => {
    const ahora = new Date();
    const counts = Array(dias).fill(0);
    lista.forEach((o) => {
      const f = obtenerFecha(o, esExterna);
      if (!f) return;
      const diff = Math.floor((ahora - f) / (1000 * 60 * 60 * 24));
      if (diff < dias && diff >= 0) counts[dias - diff - 1]++;
    });
    return counts;
  };

  const contarPorMes = (lista, esExterna = false) => {
    const ahora = new Date();
    const counts = Array(12).fill(0);
    lista.forEach((o) => {
      const f = obtenerFecha(o, esExterna);
      if (!f) return;
      const diff =
        ahora.getFullYear() * 12 + ahora.getMonth() -
        (f.getFullYear() * 12 + f.getMonth());
      if (diff < 12 && diff >= 0) counts[11 - diff]++;
    });
    return counts;
  };

  const [rango, setRango] = useState("7d");

  const chartData = useMemo(() => {
    const ahora = new Date();
    let labels = [];
    let internas = [];
    let externasData = [];

    if (rango === "7d") {
      labels = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(ahora.getDate() - (6 - i));
        return d.toLocaleDateString();
      });
      internas = contarPorDia(ordenes, 7);
      externasData = contarPorDia(externas, 7, true);
    } else if (rango === "1m") {
      labels = Array.from({ length: 30 }).map((_, i) => {
        const d = new Date();
        d.setDate(ahora.getDate() - (29 - i));
        return d.toLocaleDateString();
      });
      internas = contarPorDia(ordenes, 30);
      externasData = contarPorDia(externas, 30, true);
    } else {
      labels = Array.from({ length: 12 }).map((_, i) => {
        const d = new Date();
        d.setMonth(ahora.getMonth() - (11 - i));
        return d.toLocaleString("default", { month: "short" });
      });
      internas = contarPorMes(ordenes);
      externasData = contarPorMes(externas, true);
    }

    return {
      labels,
      datasets: [
        {
          label: "Internas",
          data: internas,
          borderColor: "#0d6efd",
          backgroundColor: "rgba(13,110,253,0.2)",
          fill: false,
          tension: 0.3,
        },
        {
          label: "Externas",
          data: externasData,
          borderColor: "#dc3545",
          backgroundColor: "rgba(220,53,69,0.2)",
          fill: false,
          tension: 0.3,
        },
      ],
    };
  }, [ordenes, externas, rango]);

  const handleDownloadPDF = async (id) => {
    if (!id || !token) return;
    try {
      setLoadingPDF(true);
      const response = await fetch(`http://localhost:3000/ordenes/${id}/pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || "Error al generar el PDF");
      }
      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = `OF_${id}.pdf`;
      a.click();
      a.remove();
    } catch (err) {
      console.error("Error al descargar el PDF:", err);
    } finally {
      setLoadingPDF(false);
    }
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
              <TrendingUp size={14} className="me-1" />
              0%
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
            <div
              className="input-group input-group-sm"
              style={{ maxWidth: 200 }}
            >
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
                  <th>Figura</th>
                  <th>Proyecto</th>
                  <th>Cliente</th>
                  <th>Creado por</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginadas.map((o) => {
                  const status = getStatus(o);
                  return (
                    <tr
                      key={o.id}
                      className="hover"
                      style={{ cursor: "pointer" }}
                    >
                      <td>#{o.id}</td>
                      <td>{o.figura}</td>
                      <td>{o.nombre_proyecto}</td>
                      <td>{o.nombre_cliente}</td>
                      <td>{o.creador}</td>
                      <td>
                        <span className={getStatusClass(status)}>
                          {getStatusIcon(status)}
                          {getStatusText(status)}
                        </span>
                      </td>
                      <td>
                        {o.fecha_creacion
                          ? new Date(o.fecha_creacion).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="d-flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSeleccionada(o);
                            setShowModal(true);
                          }}
                        >
                          Ver detalles
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownloadPDF(o.id)}
                          disabled={loadingPDF}
                        >
                          Descargar OF
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <nav>
            <ul className="pagination justify-content-center">
              <li className={`page-item ${paginaInternas === 1 ? 'disabled' : ''}`}> 
                <button className="page-link" onClick={() => setPaginaInternas(1)}>
                  &laquo;
                </button>
              </li>
              <li className={`page-item ${paginaInternas === 1 ? 'disabled' : ''}`}> 
                <button
                  className="page-link"
                  onClick={() => setPaginaInternas(paginaInternas - 1)}
                  disabled={paginaInternas === 1}
                >
                  Anterior
                </button>
              </li>
              {getVisiblePages(paginaInternas, totalPaginasInternas).map((num) => (
                <li key={num} className={`page-item ${paginaInternas === num ? 'active' : ''}`}> 
                  <button className="page-link" onClick={() => setPaginaInternas(num)}>
                    {num}
                  </button>
                </li>
              ))}
              <li className={`page-item ${paginaInternas === totalPaginasInternas ? 'disabled' : ''}`}> 
                <button
                  className="page-link"
                  onClick={() => setPaginaInternas(paginaInternas + 1)}
                  disabled={paginaInternas === totalPaginasInternas}
                >
                  Siguiente
                </button>
              </li>
              <li className={`page-item ${paginaInternas === totalPaginasInternas ? 'disabled' : ''}`}> 
                <button className="page-link" onClick={() => setPaginaInternas(totalPaginasInternas)}>
                  &raquo;
                </button>
              </li>
            </ul>
          </nav>
          {externas.length > 0 && (
            <>
              <hr />
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Órdenes Externas</h6>
                <div
                  className="input-group input-group-sm"
                  style={{ maxWidth: 200 }}
                >
                  <span className="input-group-text">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar"
                    value={busquedaExternas}
                    onChange={(e) => setBusquedaExternas(e.target.value)}
                  />
                </div>
              </div>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr className="text-muted small">
                      <th>ID</th>
                      <th>Figura</th>
                      <th>Proyecto</th>
                      <th>Cliente</th>
                      <th>Creado por</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginadasExternas.map((o) => (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td>{o.figura}</td>
                        <td>{o.proyecto}</td>
                        <td>{o.cliente}</td>
                        <td>{o.creador}</td>
                        <td>-</td>
                        <td>
                          {o.fecha_creacion
                            ? new Date(o.fecha_creacion).toLocaleDateString()
                            : o.pdf_path && o.pdf_path.match(/(\d+)-/)
                              ? new Date(
                                  Number(o.pdf_path.match(/(\d+)-/)[1]),
                                ).toLocaleDateString()
                              : "-"}
                        </td>
                        <td>
                          <a
                            href={`http://localhost:3000${o.pdf_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            Ver PDF
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <nav>
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${paginaExternas === 1 ? 'disabled' : ''}`}> 
                    <button className="page-link" onClick={() => setPaginaExternas(1)}>
                      &laquo;
                    </button>
                  </li>
                  <li className={`page-item ${paginaExternas === 1 ? 'disabled' : ''}`}> 
                    <button
                      className="page-link"
                      onClick={() => setPaginaExternas(paginaExternas - 1)}
                      disabled={paginaExternas === 1}
                    >
                      Anterior
                    </button>
                  </li>
                  {getVisiblePages(paginaExternas, totalPaginasExternas).map((num) => (
                    <li key={num} className={`page-item ${paginaExternas === num ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPaginaExternas(num)}>
                        {num}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${paginaExternas === totalPaginasExternas ? 'disabled' : ''}`}> 
                    <button
                      className="page-link"
                      onClick={() => setPaginaExternas(paginaExternas + 1)}
                      disabled={paginaExternas === totalPaginasExternas}
                    >
                      Siguiente
                    </button>
                  </li>
                  <li className={`page-item ${paginaExternas === totalPaginasExternas ? 'disabled' : ''}`}> 
                    <button className="page-link" onClick={() => setPaginaExternas(totalPaginasExternas)}>
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Órdenes creadas</h6>
            <div className="btn-group btn-group-sm">
              <button
                className={`btn btn-outline-secondary ${rango === '7d' ? 'active' : ''}`}
                onClick={() => setRango('7d')}
              >
                7 días
              </button>
              <button
                className={`btn btn-outline-secondary ${rango === '1m' ? 'active' : ''}`}
                onClick={() => setRango('1m')}
              >
                1 mes
              </button>
              <button
                className={`btn btn-outline-secondary ${rango === '1y' ? 'active' : ''}`}
                onClick={() => setRango('1y')}
              >
                1 año
              </button>
            </div>
          </div>
          <Line data={chartData} />
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
                <strong>Inicio:</strong>{" "}
                {seleccionada.fecha_inicio
                  ? new Date(seleccionada.fecha_inicio).toLocaleDateString()
                  : "N/A"}
              </p>
              <p>
                <strong>Fin:</strong>{" "}
                {seleccionada.fecha_fin
                  ? new Date(seleccionada.fecha_fin).toLocaleDateString()
                  : "N/A"}
              </p>
              <p>
                <strong>Creada:</strong>{" "}
                {new Date(seleccionada.fecha_creacion).toLocaleString()}
              </p>
              <p>
                <strong>Creada por:</strong> {seleccionada.creador}
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
