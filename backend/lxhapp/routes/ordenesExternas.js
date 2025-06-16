const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'externas');
    await fs.promises.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Crear una orden externa guardando PDF
router.post('/', verificarToken, upload.single('pdf'), async (req, res) => {
  const usuario_id = req.usuario.id;
  const { cliente, proyecto, figura } = req.body;
  const pdfPath = req.file ? `/externas/${req.file.filename}` : null;

  try {
    const [result] = await pool.query(
      'INSERT INTO ordenes_externas (usuario_id, cliente, proyecto, figura, pdf_path) VALUES (?, ?, ?, ?, ?)',
      [usuario_id, cliente, proyecto, figura, pdfPath]
    );
    res.status(201).json({ id: result.insertId, pdf: pdfPath });
  } catch (error) {
    console.error('Error creando orden externa:', error);
    res.status(500).json({ mensaje: 'Error al crear la orden externa' });
  }
});

// Listar órdenes externas del usuario autenticado
router.get('/', verificarToken, async (req, res) => {
  const usuario_id = req.usuario.id;
  try {
    const [ordenes] = await pool.query(
      'SELECT id, cliente, proyecto, figura, pdf_path FROM ordenes_externas WHERE usuario_id = ? ORDER BY id DESC',
      [usuario_id]
    );
    res.json(ordenes);
  } catch (error) {
    console.error('Error listando ordenes externas:', error);
    res.status(500).json({ mensaje: 'Error al obtener ordenes externas' });
  }
});

// Listar todas las órdenes externas sin filtrar por usuario
router.get('/all', verificarToken, async (req, res) => {
  try {
    const [ordenes] = await pool.query(
      'SELECT id, cliente, proyecto, figura, pdf_path, usuario_id FROM ordenes_externas ORDER BY id DESC'
    );
    res.json(ordenes);
  } catch (error) {
    console.error('Error listando ordenes externas:', error);
    res.status(500).json({ mensaje: 'Error al obtener ordenes externas' });
  }
});

module.exports = router;
