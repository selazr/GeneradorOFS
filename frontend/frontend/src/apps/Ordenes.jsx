import React, { useEffect, useState } from "react";
import axios from "axios";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { useDropzone } from "react-dropzone";
import "../styles/Ordenes.css";



const Ordenes = () => {
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const token = localStorage.getItem("token");
  const [imagenes, setImagenes] = useState([]); // Estado para almacenar imágenes en Base64
  const [showModal, setShowModal] = useState(false);
  const [imagenesModal, setImagenesModal] = useState({ grande: null, pequenas: [null, null, null, null] });

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

  const formatLabel = (key) =>
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

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

  useEffect(() => {
    axios
      .get("http://localhost:3000/ordenes/tree")
      .then((res) => setOrdenesTree(res.data))
      .catch((err) => console.error("Error al cargar árbol:", err));
  }, []);


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
  
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (ordenSeleccionada) {
        await axios.put(`http://localhost:3000/ordenes/${ordenSeleccionada.id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Orden actualizada con éxito");
      } else {
        const { data } = await axios.post("http://localhost:3000/ordenes", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Orden creada con éxito");
        setOrdenes([...ordenes, { ...form, id: data.orden_id }]);
      }
      resetForm();
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
      fecha_fin: "",
      peso: "",
      notas: ""
    });
    setOrdenSeleccionada(null);
    setImagenes([]); // Limpiar imágenes
  };
  
  const handleDownloadPDF = async (id, cliente = false) => {
    if (!id || !token) {
      alert("Faltan datos necesarios para generar el PDF");
      return;
    }
  
    const url = `http://localhost:3000/ordenes/${id}/pdf${cliente ? "?cliente=true" : ""}`;
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imagenes }), // Enviamos las imágenes en Base64 al backend
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
    }
    
  };
  return (

    <div className="ordenes-wrapper container-fluid">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 ordenes-sidebar">
  <h4 className="text-center">📂 Tus órdenes por cliente</h4>
  <button 
    className="btn btn-light text-dark w-100 mb-3" 
    onClick={resetForm}
  >
    Crear orden
  </button>

  {/* Aquí va el nuevo árbol */}
  <div className="accordion" id="ordenesAccordion">
    {ordenesTree.map((cliente, i) => (
      <div className="accordion-item bg-dark border-0 text-white" key={i}>
        <h2 className="accordion-header" id={`heading-${cliente.cliente?.id || i}`}>
          <button
            className="accordion-button bg-secondary text-white collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target={`#clienteCollapse-${cliente.cliente?.id || i}`}
            aria-expanded="false"
            aria-controls={`clienteCollapse-${cliente.cliente?.id || i}`}
            >
            👤 {cliente.cliente?.nombre_cliente}
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
    <div className="accordion-item bg-dark text-white border-0" key={j}>
      <h2 className="accordion-header" id={`headingProyecto-${i}-${j}`}>
        <button
          className="accordion-button bg-dark text-warning collapsed"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`#collapseProyecto-${i}-${j}`}
          aria-expanded="false"
          aria-controls={`collapseProyecto-${i}-${j}`}
          style={{ fontSize: "0.9rem" }}
        >
          📁 {proyecto.proyecto?.nombre_proyecto}
        </button>
      </h2>
      <div
        id={`collapseProyecto-${i}-${j}`}
        className="accordion-collapse collapse"
        aria-labelledby={`headingProyecto-${i}-${j}`}
        data-bs-parent={`#proyectosAccordion-${i}`}
      >
        <div className="accordion-body ps-4">
          <ul className="list-group list-group-flush">
            {proyecto.ordenes.map((orden, k) => (
              <li
                key={k}
                className={`list-group-item bg-dark text-white border-0 ps-4 ${
                  ordenSeleccionada?.id === orden.id ? "active bg-primary" : ""
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  const {
                    id,
                    usuario_id,
                    fecha_creacion,
                    fecha_actualizacion,
                    fecha_inicio,
                    ...ordenEditable
                  } = orden;
                  setOrdenSeleccionada(orden);
                  setForm(ordenEditable);
                }}
              >
                🧾 {orden.figura}
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
                    >
                      OF
                    </button>
                    <button
                      className="btn btn-primary me-2"
                      type="button"
                      onClick={() => handleDownloadPDF(ordenSeleccionada.id, true)}
                    >
                      OF Cliente
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
    <div className="mb-3">
      <strong>Imagen Grande:</strong>
      <ImagenDropzone
        label="Arrastra aquí la imagen grande"
        index="grande"
        preview={imagenesModal.grande}
        onDrop={(key, file) => {
          const reader = new FileReader();
          reader.onload = () =>
            setImagenesModal((prev) => ({ ...prev, grande: reader.result }));
          reader.readAsDataURL(file);
        }}
      />

    </div>

    <div className="mb-3">
      <strong>Imágenes Pequeñas:</strong>
      <div className="row">
        {[0, 1, 2, 3].map((i) => (
          <div className="col-md-3 mb-2" key={i}>
        <ImagenDropzone
          label={`Imagen ${i + 1}`}
          index={i}
          preview={imagenesModal.pequenas[i]}
          onDrop={(index, file) => {
            const reader = new FileReader();
            reader.onload = () => {
              setImagenesModal((prev) => {
                const nuevas = [...prev.pequenas];
                nuevas[index] = reader.result;
                return { ...prev, pequenas: nuevas };
              });
            };
            reader.readAsDataURL(file);
          }}
        />
          </div>
        ))}
      </div>
    </div>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowModal(false)}>Cerrar</Button>
    <Button
      variant="primary"
      onClick={() => {
        const todas = [imagenesModal.grande, ...imagenesModal.pequenas.filter(Boolean)];
        setImagenes(todas);
        setShowModal(false);
      }}
    >
      Usar estas imágenes
    </Button>
  </Modal.Footer>
</Modal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ordenes;
