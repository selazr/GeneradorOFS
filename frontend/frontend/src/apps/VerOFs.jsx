import React, { useEffect, useState } from "react";
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
import { Bar } from "react-chartjs-2";
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

  useEffect(() => {
    if (!token) return;
    axios
      .get("http://localhost:3000/ordenes", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrdenes(res.data))
      .catch((err) => console.error("Error obteniendo internas", err));

    axios
      .get("http://localhost:3000/ordenes-externas", {
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

  const totals = {
    total: ordenes.length,
    completed: ordenes.filter((o) => getStatus(o) === "completed").length,
    inProgress: ordenes.filter((o) => getStatus(o) === "in-progress").length,
    pending: ordenes.filter((o) => getStatus(o) === "pending").length,
  };

  const calcularActividad = (lista, esExterna = false) => {
    const ahora = new Date();
    const haceUnaSemana = new Date();
    haceUnaSemana.setDate(ahora.getDate() - 7);
    const haceUnMes = new Date();
    haceUnMes.setMonth(ahora.getMonth() - 1);
    const haceUnAno = new Date();
    haceUnAno.setFullYear(ahora.getFullYear() - 1);

    const obtenerFecha = (o) => {
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

    const enRango = (f, limite) => f && f >= limite;

    return {
      semana: lista.filter((o) => enRango(obtenerFecha(o), haceUnaSemana))
        .length,
      mes: lista.filter((o) => enRango(obtenerFecha(o), haceUnMes)).length,
      ano: lista.filter((o) => enRango(obtenerFecha(o), haceUnAno)).length,
    };
  };

  const actividadInterna = calcularActividad(ordenes);
  const actividadExterna = calcularActividad(externas, true);

  const chartData = {
    labels: ["Semana", "Mes", "Año"],
    datasets: [
      {
        label: "Internas",
        backgroundColor: "#0d6efd",
        data: [
          actividadInterna.semana,
          actividadInterna.mes,
          actividadInterna.ano,
        ],
      },
      {
        label: "Externas",
        backgroundColor: "#dc3545",
        data: [
          actividadExterna.semana,
          actividadExterna.mes,
          actividadExterna.ano,
        ],
      },
    ],
  };

  const handleDownloadPDF = async (id) => {
    if (!id || !token) return;
    try {
      setLoadingPDF(true);
      const response = await fetch(`http://localhost:3000/ordenes/${id}/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imagenes: [] }),
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
                {filtradas.map((o) => {
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
                      <td>{localStorage.getItem("username")}</td>
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
                    {filtradasExternas.map((o) => (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td>{o.figura}</td>
                        <td>{o.proyecto}</td>
                        <td>{o.cliente}</td>
                        <td>{localStorage.getItem("username")}</td>
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
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h6 className="mb-3 text-center">Órdenes creadas</h6>
          <Bar data={chartData} />
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
                <strong>Creada por:</strong> {localStorage.getItem("username")}
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
