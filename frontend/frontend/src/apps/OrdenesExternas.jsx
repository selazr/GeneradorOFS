import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api';

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
      await axios.post(`${API_URL}/ordenes-externas`, data, {
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
    <div className="container">
      <h4 className="mb-3">Cargar Orden Externa</h4>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Cliente</label>
          <input className="form-control" name="cliente" value={form.cliente} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Proyecto</label>
          <input className="form-control" name="proyecto" value={form.proyecto} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Nombre de figura</label>
          <input className="form-control" name="figura" value={form.figura} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">PDF</label>
          <input type="file" accept="application/pdf" className="form-control" onChange={handleFile} required />
        </div>
        <button className="btn btn-primary" type="submit">Subir</button>
      </form>
    </div>
  );
};

export default OrdenesExternas;
