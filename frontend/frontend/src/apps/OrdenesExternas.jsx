import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../api';
import "../styles/OrdenesExternas.css";

const OrdenesExternas = () => {
  const [form, setForm] = useState({ cliente: '', proyecto: '', figura: '' });
  const [pdf, setPdf] = useState(null);
  const token = localStorage.getItem('token');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    setPdf(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdf) {
      alert('Selecciona un PDF');
      return;
    }
    const data = new FormData();
    data.append('pdf', pdf);
    data.append('cliente', form.cliente);
    data.append('proyecto', form.proyecto);
    data.append('figura', form.figura);

    try {
      await axios.post(`${API_BASE_URL}/ordenes-externas`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Orden externa guardada');
      setForm({ cliente: '', proyecto: '', figura: '' });
      setPdf(null);
      e.target.reset();
    } catch (error) {
      console.error('Error guardando orden externa:', error);
      alert('Error al guardar');
    }
  };

  return (
    <div className="ordenes-externas container py-4">
      <div className="oe-header d-flex flex-wrap align-items-start justify-content-between mb-4">
        <div>
          <p className="navbar-eyebrow mb-1 text-uppercase">Órdenes externas</p>
          <h3 className="mb-1">Carga moderna y segura</h3>
          <p className="text-muted mb-0">Sube el PDF y completa los datos para que el equipo pueda rastrear la orden sin perder detalle.</p>
        </div>
        <div className="oe-pill">Modo oscuro optimizado</div>
      </div>

      <div className="row g-4 align-items-start">
        <div className="col-lg-8">
          <div className="card soft-card shadow-sm border-0">
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="icon-circle"><Upload size={18} /></div>
                <div>
                  <p className="navbar-eyebrow mb-0">Nuevo registro</p>
                  <h5 className="mb-0">Formulario</h5>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="oe-form">
                <div className="form-grid">
                  <div className="mb-3">
                    <label className="form-label">Cliente</label>
                    <input
                      className="form-control modern-input"
                      name="cliente"
                      value={form.cliente}
                      onChange={handleChange}
                      required
                      placeholder="Ingresa el nombre del cliente"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Proyecto</label>
                    <input
                      className="form-control modern-input"
                      name="proyecto"
                      value={form.proyecto}
                      onChange={handleChange}
                      required
                      placeholder="Proyecto asociado"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nombre de figura</label>
                    <input
                      className="form-control modern-input"
                      name="figura"
                      value={form.figura}
                      onChange={handleChange}
                      required
                      placeholder="Ej. Estructura principal"
                    />
                  </div>
                </div>

                <div className="upload-tile mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-circle subtle"><FileText size={18} /></div>
                    <div className="flex-grow-1">
                      <p className="mb-1 fw-semibold">Subir PDF</p>
                      <small className="text-muted">Arrastra o selecciona el archivo. Solo se aceptan documentos PDF.</small>
                    </div>
                    <label className="btn btn-outline-primary mb-0">
                      Elegir archivo
                      <input
                        type="file"
                        accept="application/pdf"
                        className="d-none"
                        onChange={handleFile}
                        required
                      />
                    </label>
                  </div>
                  {pdf && <span className="selected-file">{pdf.name}</span>}
                </div>

                <div className="d-flex flex-wrap gap-3 align-items-center">
                  <button className="btn btn-accent" type="submit">Subir orden</button>
                  <small className="text-muted">Se guardará junto a la fecha y el usuario autenticado.</small>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card info-card border-0 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="icon-circle success"><ShieldCheck size={18} /></div>
                <div>
                  <p className="navbar-eyebrow mb-0">Buenas prácticas</p>
                  <h6 className="mb-0">Archivos legibles</h6>
                </div>
              </div>
              <ul className="list-unstyled mb-0 info-list">
                <li>Verifica que el PDF no supere los 10 MB.</li>
                <li>Incluye el nombre del cliente y el proyecto en el documento.</li>
                <li>Usa nombres de figura claros para facilitar las búsquedas.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdenesExternas;
