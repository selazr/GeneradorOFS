import React, { useEffect, useState } from "react";
import axios from "axios";
import Collapse from 'bootstrap/js/dist/collapse';
import { useNavigate } from "react-router-dom";
import { Modal, Button, Spinner } from "react-bootstrap";
import { useDropzone } from "react-dropzone";
import "../styles/Ordenes.css";
import { FolderOpen, User, Folder, FileText } from "lucide-react";




const Ordenes = () => {
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const token = localStorage.getItem("token");
  const [imagenes, setImagenes] = useState([]); // Archivos de imágenes
  const [showModal, setShowModal] = useState(false);
  const [layout, setLayout] = useState(1);
  const [imagenesModal, setImagenesModal] = useState({ grande: null, pequenas: [null, null, null, null] });
  const [busqueda, setBusqueda] = useState("");
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [mensajeModal, setMensajeModal] = useState("");
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPDFModal, setShowPDFModal] = useState(false);

  const mostrarModalTemporal = (msg) => {
    setMensajeModal(msg);
    setMostrarMensaje(true);
    setTimeout(() => setMostrarMensaje(false), 2000);
  };

  const generarCodigoProyecto = () => {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numeros = "0123456789";
    return (
      letras[Math.floor(Math.random() * letras.length)] +
      numeros[Math.floor(Math.random() * numeros.length)] +
      letras[Math.floor(Math.random() * letras.length)] +
      numeros[Math.floor(Math.random() * numeros.length)] +
      numeros[Math.floor(Math.random() * numeros.length)] +
      numeros[Math.floor(Math.random() * numeros.length)] +
      letras[Math.floor(Math.random() * letras.length)]
    );
  };

  const [form, setForm] = useState({
    nombre_proyecto:"",
    nombre_cliente: "",
    codigo_proyecto: generarCodigoProyecto(),
    responsable: "",
    figura: "",
    medida_v: "",
    medida_w: "",
    medida_h: "",
    unidad_medida: "cm",
    material: "",
    acabado: "",
    cantidad: 1,
    fabric_pieza: "",
    post_mec: "",
    pegar_lijar: "",
    esculpir: "",
    line_x: "",
    fibra: "",
    mortero: "",
    aparejo: "",
    pintura: "",
    estructura: "",
    revisado: "",
    fecha_inicio: "",
    fecha_fin: "",
    peso: "",
    notas: ""
  });

  const generalFields = [
    "nombre_proyecto",
    "nombre_cliente",
    "codigo_proyecto",
    "responsable",
    "figura",
    "material",
    "acabado",
    "cantidad",
    "unidad_medida",
    "fecha_inicio",
    "fecha_fin",
    "peso",
    "notas"
  ];

  const medidaFields = ["medida_v", "medida_w", "medida_h"];

  const procesoFields = [
    "fabric_pieza",
    "post_mec",
    "pegar_lijar",
    "esculpir",
    "line_x",
    "fibra",
    "mortero",
    "aparejo",
    "pintura",
    "estructura",
    "revisado"
  ];

  const formatLabel = (key) => {
    if (key === "medida_v") return "Medida L";
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    axios
      .get("http://localhost:3000/ordenes", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrdenes(res.data))
      .catch((error) => console.error(error));
  }, [token, navigate]);

  const [ordenesTree, setOrdenesTree] = useState([]);

  const fetchOrdenesTree = () => {
    return axios
      .get("http://localhost:3000/ordenes/tree", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setOrdenesTree(res.data);
        return res.data;
      })
      .catch((err) => {
        console.error("Error al cargar árbol:", err);
        throw err;
      });
  };

  const filteredOrdenesTree = ordenesTree
    .map((cliente) => ({
      ...cliente,
      proyectos: cliente.proyectos
        .map((proyecto) => ({
          ...proyecto,
          ordenes: proyecto.ordenes.filter(
            (o) =>
              o.figura.toLowerCase().includes(busqueda.toLowerCase()) ||
              (o.codigo_proyecto || "").toLowerCase().includes(busqueda.toLowerCase())
          ),
        }))
        .filter((p) => p.ordenes.length > 0),
    }))
    .filter((c) => c.proyectos.length > 0);

  useEffect(() => {
    fetchOrdenesTree();
  }, []);

  useEffect(() => {
    if (ordenSeleccionada) {
      handlePreviewPDF(ordenSeleccionada.id);
    } else {
      setPdfPreviewUrl(null);
    }
  }, [ordenSeleccionada]);

  const expandirVista = (clienteId, proyectoId, ordenId) => {
    setTimeout(() => {
      const cliente = document.getElementById(`clienteCollapse-${clienteId}`);
      if (cliente) {
        const c = Collapse.getOrCreateInstance(cliente);
        c.show();
      }
      const proyecto = document.getElementById(`collapseProyecto-${proyectoId}`);
      if (proyecto) {
        const p = Collapse.getOrCreateInstance(proyecto);
        p.show();
      }
      const li = document.getElementById(`orden-${ordenId}`);
      if (li) li.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const ImagenDropzone = ({ label, index, onDrop, preview }) => {
    const { getRootProps, getInputProps } = useDropzone({
      accept: { "image/*": [] },
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          onDrop(index, acceptedFiles[0]);
        }
      },
    });

    return (
      <div
        {...getRootProps()}
        className="border rounded d-flex justify-content-center align-items-center flex-column"
        style={{ height: "100px", width: "100%", cursor: "pointer", backgroundColor: "#f8f9fa" }}
      >
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt="preview" style={{ maxHeight: "90px", objectFit: "contain" }} />
        ) : (
          <span>{label}</span>
        )}
      </div>
    );
  };


  const PDFLayoutPreview = ({ layout, imagenes }) => {
    const getImg = (img, placeholder) =>
      img ? (
        <img
          src={img}
          alt="preview"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      ) : (
        <span style={{ color: '#aaa' }}>{placeholder}</span>
      );

    const imgPeq = (i, ph) => (
      <div
        key={i}
        style={{
          backgroundColor: '#f8f9fa',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        {getImg(imagenes.pequenas[i]?.preview, ph)}
      </div>
    );

    switch (layout) {
      case 1:
        return (
          <div className="mb-3" style={{ display: 'flex', border: '1px solid #ccc', borderRadius: 4, overflow: 'hidden', height: 200 }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
              {getImg(imagenes.grande?.preview, 'Imagen 1')}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="mb-3" style={{ display: 'flex', border: '1px solid #ccc', borderRadius: 4, overflow: 'hidden', height: 200 }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
              {getImg(imagenes.grande?.preview, 'Imagen 1')}
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
              {getImg(imagenes.pequenas[0]?.preview, 'Imagen 2')}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="mb-3" style={{ display: 'flex', border: '1px solid #ccc', borderRadius: 4, overflow: 'hidden', height: 200 }}>
            <div style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
              {getImg(imagenes.grande?.preview, 'Imagen 1')}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {getImg(imagenes.pequenas[0]?.preview, 'Imagen 2')}
              </div>
              <div style={{ flex: 1, backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {getImg(imagenes.pequenas[1]?.preview, 'Imagen 3')}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="mb-3" style={{ display: 'flex', flexWrap: 'wrap', border: '1px solid #ccc', borderRadius: 4, overflow: 'hidden', height: 200 }}>
            {[imagenes.grande?.preview, imagenes.pequenas[0]?.preview, imagenes.pequenas[1]?.preview, imagenes.pequenas[2]?.preview].map((src, i) => (
              <div key={i} style={{ flex: '0 0 50%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
                {getImg(src, `Imagen ${i + 1}`)}
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };
  
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (ordenSeleccionada) {
        await axios.put(`http://localhost:3000/ordenes/${ordenSeleccionada.id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        mostrarModalTemporal("Orden actualizada con éxito");
        setOrdenSeleccionada({ ...ordenSeleccionada, ...form });
      } else {
        const { data } = await axios.post("http://localhost:3000/ordenes", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        mostrarModalTemporal("Orden creada con éxito");
        setOrdenes([...ordenes, { ...form, id: data.orden_id }]);
        await fetchOrdenesTree();
        expandirVista(data.cliente_id, data.proyecto_id, data.orden_id);
      }
      if (ordenSeleccionada) {
        await fetchOrdenesTree();
      }
      if (!ordenSeleccionada) {
        resetForm();
      }
    } catch (error) {
      console.error("Error al guardar la orden:", error);
    }
  };

  const handleDelete = async () => {
    if (!ordenSeleccionada) return;
    const confirmacion = window.confirm("¿Seguro que deseas eliminar esta orden?");
    if (!confirmacion) return;
    
  try {
      await axios.delete(`http://localhost:3000/ordenes/${ordenSeleccionada.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Orden eliminada con éxito");
      setOrdenes(ordenes.filter((orden) => orden.id !== ordenSeleccionada.id));
      fetchOrdenesTree();
      resetForm();
    } catch (error) {
      console.error("Error al eliminar la orden:", error);
    }
  };

  const resetForm = () => {
    setForm({
      nombre_proyecto:"",
      nombre_cliente: "",
      codigo_proyecto: generarCodigoProyecto(),
      responsable: "",
      figura: "",
      medida_v: "",
      medida_w: "",
      medida_h: "",
      unidad_medida: "cm",
      material: "",
      acabado: "",
      cantidad: 1,
      fabric_pieza: "",
      post_mec: "",
      pegar_lijar: "",
      esculpir: "",
      line_x: "",
      fibra: "",
      mortero: "",
      aparejo: "",
      pintura: "",
      estructura: "",
      revisado: "",
      fecha_inicio: "",
      fecha_fin: "",
      peso: "",
      notas: ""
    });
    setOrdenSeleccionada(null);
    setImagenes([]); // Limpiar imágenes
    setLayout(1);
    setImagenesModal({ grande: null, pequenas: [null, null, null, null] });
  };

  const handlePreviewPDF = async (id) => {
    if (!id || !token) return;
    try {
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
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
    } catch (error) {
      console.error("Error al obtener vista previa del PDF:", error);
    }
  };
  
  const handleDownloadPDF = async (id, cliente = false) => {
    if (!id || !token) {
      alert("Faltan datos necesarios para generar el PDF");
      return;
    }

    const url = `http://localhost:3000/ordenes/${id}/pdf${cliente ? "?cliente=true" : ""}`;

    try {
      setLoadingPDF(true);
      const response = await fetch(url, {
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
      a.download = cliente ? `OF_Cliente_${id}.pdf` : `OF_${id}.pdf`;
      a.click();
      a.remove();
    } catch (error) {
      console.error("Error al descargar el PDF:", error);
      alert("Error al descargar el PDF");
    } finally {
      setLoadingPDF(false);
    }

  };
  return (

    <div className="ordenes-wrapper container-fluid">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 ordenes-sidebar">
          <h4 className="text-center d-flex align-items-center justify-content-center gap-2">
            <FolderOpen size={20} /> Tus órdenes por cliente
          </h4>

          <button
            className="btn btn-light text-dark w-100 mb-3"
            onClick={resetForm}
          >
            Crear orden
          </button>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Buscar OF"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          {/* Aquí va el nuevo árbol */}
          <div className="accordion" id="ordenesAccordion">
            {filteredOrdenesTree.map((cliente, i) => (
              <div className="accordion-item border-0 text-white" key={i}>
        <h2 className="accordion-header" id={`heading-${cliente.cliente?.id || i}`}>
          <button
            className="accordion-button text-white collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target={`#clienteCollapse-${cliente.cliente?.id || i}`}
            aria-expanded="false"
            aria-controls={`clienteCollapse-${cliente.cliente?.id || i}`}
            >
            <User size={16} className="me-2" /> {cliente.cliente?.nombre_cliente}
          </button>
        </h2>
        <div
          id={`clienteCollapse-${cliente.cliente?.id || i}`}
          className="accordion-collapse collapse"
          aria-labelledby={`cliente-${i}`}
          data-bs-parent="#ordenesAccordion"
        >
          <div className="accordion-body">
          <div className="accordion" id={`proyectosAccordion-${i}`}>
  {cliente.proyectos.map((proyecto, j) => (
    <div className="accordion-item border-0 text-white" key={j}>
      <h2 className="accordion-header" id={`headingProyecto-${proyecto.proyecto?.id || j}`}>
        <button
          className="accordion-button text-warning collapsed"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`#collapseProyecto-${proyecto.proyecto?.id || j}`}
          aria-expanded="false"
          aria-controls={`collapseProyecto-${proyecto.proyecto?.id || j}`}
          style={{ fontSize: "0.9rem" }}
        >
          <Folder size={16} className="me-2" /> {proyecto.proyecto?.nombre_proyecto}
        </button>
      </h2>
      <div
        id={`collapseProyecto-${proyecto.proyecto?.id || j}`}
        className="accordion-collapse collapse"
        aria-labelledby={`headingProyecto-${proyecto.proyecto?.id || j}`}
        data-bs-parent={`#proyectosAccordion-${i}`}
      >
        <div className="accordion-body ps-4">
          <ul className="list-group list-group-flush">
            {proyecto.ordenes.map((orden, k) => (
              <li
                key={k}
                id={`orden-${orden.id}`}
                className={`list-group-item bg-transparent text-white border-0 ps-4 d-flex align-items-center ${
                  ordenSeleccionada?.id === orden.id ? "active bg-primary" : ""
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  const {
                    id,
                    usuario_id,
                    fecha_creacion,
                    fecha_actualizacion,
                    ...ordenEditable
                  } = orden;
                  const editableCopy = { ...ordenEditable };
                  if (editableCopy.fecha_inicio) {
                    editableCopy.fecha_inicio = new Date(editableCopy.fecha_inicio)
                      .toISOString()
                      .slice(0, 10);
                  }
                  if (editableCopy.fecha_fin) {
                    editableCopy.fecha_fin = new Date(editableCopy.fecha_fin)
                      .toISOString()
                      .slice(0, 10);
                  }
                  setOrdenSeleccionada(orden);
                  setForm(editableCopy);
                  if (orden.imagenes) {
                    try {
                      const imgData = JSON.parse(orden.imagenes);
                      setLayout(imgData.layout || 1);
                      const rutas = imgData.rutas || [];
                      setImagenesModal({
                        grande: rutas[0]
                          ? { file: null, preview: `http://localhost:3000${rutas[0]}` }
                          : null,
                        pequenas: [1, 2, 3, 4].map((idx) =>
                          rutas[idx + 1]
                            ? { file: null, preview: `http://localhost:3000${rutas[idx + 1]}` }
                            : null
                        ),
                      });
                    } catch (e) {
                      console.error('Error parsing imágenes', e);
                      setLayout(1);
                      setImagenesModal({ grande: null, pequenas: [null, null, null, null] });
                    }
                  } else {
                    setLayout(1);
                    setImagenesModal({ grande: null, pequenas: [null, null, null, null] });
                  }
                }}
              >
                <FileText size={16} className="me-2" /> {orden.figura}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  ))}
</div>

          </div>
        </div>
      </div>
    ))}
  </div>
</div>


        {/* Formulario Mejorado */}
        <div className="col ordenes-form-card">
          <div className="card shadow p-4">
            {/* Título centrado */}
            <h4 className="mb-4 text-center">
              {ordenSeleccionada ? "Editar Orden" : "Crear Nueva Orden"}
            </h4>

            <form onSubmit={handleSubmit}>
              <div className="row">
                {generalFields.map((key) => (
                  <div className="col-md-6 mb-3" key={key}>
                    <label className="form-label">{formatLabel(key)}</label>
                    {key === "codigo_proyecto" ? (
                      <input
                        type="text"
                        className="form-control bg-light"
                        name={key}
                        value={form[key]}
                        readOnly
                      />
                    ) : key === "unidad_medida" ? (
                      <select
                        className="form-control"
                        name={key}
                        value={form[key]}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="mm">Milímetros (mm)</option>
                        <option value="cm">Centímetros (cm)</option>
                        <option value="m">Metros (m)</option>
                      </select>
                    ) : (
                      <input
                        type={key.includes("fecha") ? "date" : key === "cantidad" ? "number" : "text"}
                        className="form-control"
                        name={key}
                        value={form[key]}
                        onChange={handleChange}
                        required
                      />
                    )}
                  </div>
                ))}
              </div>

              <h6 className="section-title">Medidas</h6>
              <div className="row">
                {medidaFields.map((key) => (
                  <div className="col-md-4 mb-3" key={key}>
                    <label className="form-label">{formatLabel(key)}</label>
                    <input
                      type="text"
                      className="form-control"
                      name={key}
                      value={form[key]}
                      onChange={handleChange}
                      required
                    />
                  </div>
                ))}
              </div>

              <h6 className="section-title">Procesos</h6>
              <div className="row">
                {procesoFields.map((key) => (
                  <div className="col-md-4 mb-3" key={key}>
                    <label className="form-label">{formatLabel(key)}</label>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={key}
                        name={key}
                        checked={form[key] === "Sí"}
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.checked ? "Sí" : "No" })
                        }
                      />
                      <label className="form-check-label" htmlFor={key}>
                        {form[key] === "Sí" ? "Sí" : "No"}
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {pdfPreviewUrl && (
                <>
                  <h6 className="section-title">Vista previa del PDF</h6>
                  <img
                    src={pdfPreviewUrl}
                    alt="PDF preview"
                    className="img-thumbnail"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowPDFModal(true)}
                  />
                  <Modal show={showPDFModal} onHide={() => setShowPDFModal(false)} size="lg">
                    <Modal.Body>
                      <embed src={pdfPreviewUrl} type="application/pdf" width="100%" height="600px" />
                    </Modal.Body>
                  </Modal>
                </>
              )}

              <div className="d-flex justify-content-center mt-3 flex-wrap">
                <button className="btn btn-success me-2" type="submit">
                  {ordenSeleccionada ? "Actualizar" : "Crear"}
                </button>
                {ordenSeleccionada && (
                  <>
                    <button
                      className="btn btn-danger me-2"
                      type="button"
                      onClick={handleDelete}
                    >
                      Eliminar
                    </button>
                    <Button className="btn btn-secondary me-2" onClick={() => setShowModal(true)}>
                      Añadir imágenes
                    </Button>
                    <button
                      className="btn btn-primary me-2"
                      type="button"
                      onClick={() => handleDownloadPDF(ordenSeleccionada.id)}
                      disabled={loadingPDF}
                    >
                      {loadingPDF ? <Spinner size="sm" animation="border" /> : "OF"}
                    </button>
                    <button
                      className="btn btn-primary me-2"
                      type="button"
                      onClick={() => handleDownloadPDF(ordenSeleccionada.id, true)}
                      disabled={loadingPDF}
                    >
                      {loadingPDF ? <Spinner size="sm" animation="border" /> : "OF Proveedor"}
                    </button>
                    <button className="btn btn-primary" type="button">
                      OT
                    </button>
                  </>
                )}
              </div>
            </form>
              <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>Seleccionar Imágenes</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <div className="d-flex mb-3 justify-content-center gap-2">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          onClick={() => setLayout(n)}
          style={{
            width: 40,
            height: 40,
            backgroundColor: layout === n ? '#6c757d' : '#e9ecef',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
          }}
        >
          {n}
        </div>
      ))}
    </div>
    <PDFLayoutPreview layout={layout} imagenes={imagenesModal} />
    {[0].map(() => (
      <div className="mb-3" key="grande">
        <strong>Imagen 1:</strong>
        <ImagenDropzone
          label="Arrastra aquí la imagen"
          index={0}
          preview={imagenesModal.grande?.preview}
          onDrop={(key, file) => {
            setImagenesModal((prev) => ({ ...prev, grande: {file, preview: URL.createObjectURL(file)} }));
          }}
        />
      </div>
    ))}
    {layout > 1 && (
      <div className="mb-3">
        <strong>Imágenes Adicionales:</strong>
        <div className="row">
          {Array.from({length: layout-1}).map((_, i) => (
            <div className="col-md-3 mb-2" key={i}>
              <ImagenDropzone
                label={`Imagen ${i + 2}`}
                index={i}
                preview={imagenesModal.pequenas[i]?.preview}
                onDrop={(index, file) => {
                  setImagenesModal((prev) => {
                    const nuevas = [...prev.pequenas];
                    nuevas[index] = {file, preview: URL.createObjectURL(file)};
                    return { ...prev, pequenas: nuevas };
                  });
                }}
              />
            </div>
          ))}
        </div>
      </div>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowModal(false)}>Cerrar</Button>
    <Button
      variant="primary"
      onClick={() => {
        const archivos = [];
        const rutasExistentes = [];

        if (imagenesModal.grande?.file) {
          archivos.push(imagenesModal.grande.file);
          rutasExistentes.push(null);
        } else if (imagenesModal.grande?.preview) {
          rutasExistentes.push(imagenesModal.grande.preview.replace('http://localhost:3000', ''));
        } else {
          rutasExistentes.push(null);
        }

        imagenesModal.pequenas.slice(0, layout-1).forEach((img) => {
          if (img?.file) {
            archivos.push(img.file);
            rutasExistentes.push(null);
          } else if (img?.preview) {
            rutasExistentes.push(img.preview.replace('http://localhost:3000', ''));
          } else {
            rutasExistentes.push(null);
          }
        });

        setImagenes(archivos);

        if (ordenSeleccionada && rutasExistentes.length){
          const data = new FormData();
          archivos.forEach(f => data.append('imagenes', f));
          data.append('layout', layout);
          data.append('existing', JSON.stringify(rutasExistentes));

          axios
            .post(`http://localhost:3000/ordenes/${ordenSeleccionada.id}/imagenes`, data)
            .then(res => {
              const rutas = res.data.rutas || [];
              const nuevoLayout = rutas.length;
              setImagenesModal({
                grande: rutas[0] ? { file: null, preview: `http://localhost:3000${rutas[0]}` } : null,
                pequenas: [1,2,3,4].map(i => rutas[i] ? { file: null, preview: `http://localhost:3000${rutas[i]}` } : null)
              });
              setLayout(nuevoLayout);
              setOrdenSeleccionada({ ...ordenSeleccionada, imagenes: JSON.stringify({ layout: nuevoLayout, rutas }) });
            })
            .catch((err) => console.error('Error guardando imágenes', err));
        }
        setShowModal(false);
      }}
    >
      Usar estas imágenes
    </Button>
  </Modal.Footer>
</Modal>
      <Modal show={mostrarMensaje} onHide={() => setMostrarMensaje(false)} centered>
        <Modal.Body className="text-center">{mensajeModal}</Modal.Body>
      </Modal>
    </div>
  </div>
</div>
</div>

  );
};

export default Ordenes;
