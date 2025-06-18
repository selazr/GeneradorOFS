const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../middlewares/auth');
const projectController = require('../controllers/project.controller');
const fs = require('fs');
const path = require('path');

router.post('/', verificarToken, async (req, res) => {
    const usuario_id = req.usuario.id;
    let {
      nombre_cliente, nombre_proyecto, codigo_proyecto, responsable, figura,
      medida_v, medida_w, medida_h, unidad_medida,
      material, acabado, cantidad, fecha_fin, revisado,
      fabric_pieza, post_mec, pegar_lijar, esculpir,
      line_x, fibra, mortero, aparejo, pintura, estructura,
      peso, notas
    } = req.body;
  
    // Normaliza campos vacíos
    fecha_fin ??= null;
    revisado ??= null;
    fabric_pieza ??= null;
    post_mec ??= null;
    pegar_lijar ??= null;
    esculpir ??= null;
    line_x ??= null;
    fibra ??= null;
    mortero ??= null;
    aparejo ??= null;
    pintura ??= null;
    estructura ??= null;
    peso ??= null;
    notas ??= null;

    if (peso !== null && peso !== undefined) {
      const m = peso.toString().match(/[\d\.]+/);
      peso = m ? parseFloat(m[0]) : null;
    }
  
    const fecha_inicio = new Date().toISOString().slice(0, 10);
  
    try {
      // 1️⃣ Buscar o crear cliente
      const [clientes] = await pool.query(
        'SELECT id FROM clientes WHERE nombre_cliente = ? LIMIT 1',
        [nombre_cliente]
      );
      let cliente_id;
      if (clientes.length > 0) {
        cliente_id = clientes[0].id;
      } else {
        const [newCliente] = await pool.query(
          'INSERT INTO clientes (nombre_cliente, usuario_id) VALUES (?, ?)',
          [nombre_cliente, usuario_id]
        );
        cliente_id = newCliente.insertId;
      }
  
      // 2️⃣ Buscar o crear proyecto
      const [proyectos] = await pool.query(
        'SELECT id FROM proyectos WHERE nombre_proyecto = ? AND cliente_id = ? LIMIT 1',
        [nombre_proyecto, cliente_id]
      );
      let proyecto_id;
      if (proyectos.length > 0) {
        proyecto_id = proyectos[0].id;
      } else {
        const [newProyecto] = await pool.query(
          'INSERT INTO proyectos (nombre_proyecto, cliente_id, usuario_id) VALUES (?, ?, ?)',
          [nombre_proyecto, cliente_id, usuario_id]
        );
        proyecto_id = newProyecto.insertId;
      }
  
      // 3️⃣ Crear la orden con cliente_id y proyecto_id
      const [result] = await pool.query(
        `INSERT INTO ordenes (
          usuario_id, nombre_cliente, nombre_proyecto, codigo_proyecto, responsable, figura,
          medida_v, medida_w, medida_h, unidad_medida,
          material, acabado, cantidad, fecha_inicio, fecha_fin, revisado,
          fabric_pieza, post_mec, pegar_lijar, esculpir,
          line_x, fibra, mortero, aparejo, pintura, estructura,
          peso, notas, cliente_id, proyecto_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        [
          usuario_id, nombre_cliente, nombre_proyecto, codigo_proyecto, responsable, figura,
          medida_v, medida_w, medida_h, unidad_medida,
          material, acabado, cantidad, fecha_inicio, fecha_fin, revisado,
          fabric_pieza, post_mec, pegar_lijar, esculpir,
          line_x, fibra, mortero, aparejo, pintura, estructura,
          peso, notas, cliente_id, proyecto_id
        ]
      );
  
      res.status(201).json({
        mensaje: 'Orden creada exitosamente',
        orden_id: result.insertId,
        cliente_id,
        proyecto_id
      });
    } catch (error) {
      console.error('❌ Error al crear la orden:', error);
      res.status(500).json({ mensaje: 'Error al crear la orden', error });
    }
  });
  
// Editar una orden existente
router.put('/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const usuario_id = req.usuario.id;

    const {
        nombre_cliente, responsable, figura, medida_v, medida_w, medida_h,
        unidad_medida, material, acabado, cantidad, fabric_pieza, post_mec,
        pegar_lijar, esculpir, line_x, fibra, mortero, aparejo, pintura, estructura,
        revisado, fecha_inicio, fecha_fin, notas, peso
    } = req.body;

    let parsedPeso = null;
    if (peso !== null && peso !== undefined) {
        const m = peso.toString().match(/[\d\.]+/);
        parsedPeso = m ? parseFloat(m[0]) : null;
    }

    try {
        const [result] = await pool.query(
            `UPDATE ordenes SET
                nombre_cliente = ?, responsable = ?, figura = ?, medida_v = ?,
                medida_w = ?, medida_h = ?, unidad_medida = ?, material = ?, acabado = ?,
                cantidad = ?, fabric_pieza = ?, post_mec = ?, pegar_lijar = ?, esculpir = ?,
                line_x = ?, fibra = ?, mortero = ?, aparejo = ?, pintura = ?, estructura = ?,
                revisado = ?, fecha_inicio = ?, fecha_fin = ?, peso = ?, notas = ?
            WHERE id = ? AND usuario_id = ?`,
                [
                    nombre_cliente, responsable, figura, medida_v, medida_w, medida_h, unidad_medida,
                    material, acabado, cantidad, fabric_pieza, post_mec, pegar_lijar, esculpir,
                    line_x, fibra, mortero, aparejo, pintura, estructura, revisado, fecha_inicio,
                    fecha_fin, parsedPeso, notas, id, usuario_id
                ]

        );

        if (result.affectedRows > 0) {
            res.status(200).json({ mensaje: "Orden actualizada correctamente" });
        } else {
            res.status(404).json({ mensaje: "Orden no encontrada o sin permisos para editar" });
        }
    } catch (error) {
        console.error("Error al actualizar la orden:", error);
        res.status(500).json({ mensaje: "Error interno del servidor" });
    }
});
// Eliminar una orden
router.delete('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.usuario.id;

  try {
    // 1️⃣ Obtener y borrar archivos de imagen
    const [imgs] = await pool.query(
      'SELECT ruta FROM imagenes WHERE orden_id = ?',
      [id]
    );
    for (const img of imgs) {
      const fileName = path.basename(img.ruta);
      const filePath = path.join(
        __dirname,
        '..',
        'uploads',
        'ordenes',
        String(id),
        fileName
      );
      await fs.promises.rm(filePath, { force: true }).catch(() => {});
    }

    // 2️⃣ Eliminar registros de imagenes y directorio
    await pool.query('DELETE FROM imagenes WHERE orden_id = ?', [id]);
    const dirPath = path.join(__dirname, '..', 'uploads', 'ordenes', String(id));
    await fs.promises.rm(dirPath, { recursive: true, force: true }).catch(() => {});

    // 3️⃣ Borrar la orden
    const [result] = await pool.query(
      'DELETE FROM ordenes WHERE id = ? AND usuario_id = ?',
      [id, usuario_id]
    );

    if (result.affectedRows > 0) {
      res.status(200).json({ mensaje: 'Orden eliminada correctamente' });
    } else {
      res
        .status(404)
        .json({ mensaje: 'Orden no encontrada o sin permisos para eliminar' });
    }
  } catch (error) {
    console.error('Error al eliminar la orden:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});


// Obtener una lista simplificada de órdenes (para mostrar en el listado)
router.get('/resumen', verificarToken, async (req, res) => {
    const usuario_id = req.usuario.id;

    try {
        const [ordenes] = await pool.query(
            `SELECT id, nombre_proyecto, figura, codigo_proyecto, nombre_cliente, responsable, fecha_inicio, fecha_fin, revisado
            FROM ordenes 
            WHERE usuario_id = ?
            ORDER BY fecha_inicio DESC`, // Ordenado por fecha más reciente
            [usuario_id]
        );
        res.json(ordenes);
    } catch (error) {
        console.error("Error al obtener las órdenes:", error);
        res.status(500).json({ mensaje: 'Error al obtener las órdenes', error });
    }
});

// Obtener TODAS las órdenes con todos los campos (para edición con placeholders)
router.get('/detalle', verificarToken, async (req, res) => {
    const usuario_id = req.usuario.id;

    try {
        const [ordenes] = await pool.query(
            `SELECT * FROM ordenes
            WHERE usuario_id = ?
            ORDER BY fecha_inicio DESC`, // Ordenado por fecha más reciente
            [usuario_id]
        );
        for (const orden of ordenes) {
            const [imgs] = await pool.query(
                'SELECT ruta FROM imagenes WHERE orden_id = ? ORDER BY posicion',
                [orden.id]
            );
            const rutas = imgs.map(img => img.ruta);
            orden.imagenes = JSON.stringify({ layout: rutas.length, rutas });
        }

        res.json(ordenes);
    } catch (error) {
        console.error("Error al obtener los detalles de las órdenes:", error);
        res.status(500).json({ mensaje: 'Error al obtener las órdenes completas', error });
    }
});

// Obtener todas las órdenes sin filtrar por usuario (vista general)
router.get('/all', verificarToken, async (req, res) => {
    try {
        const [ordenes] = await pool.query(
            `SELECT o.*, u.nombre AS creador
             FROM ordenes o
             JOIN usuarios u ON o.usuario_id = u.id
             ORDER BY o.fecha_inicio DESC`
        );

        for (const orden of ordenes) {
            const [imgs] = await pool.query(
                'SELECT ruta FROM imagenes WHERE orden_id = ? ORDER BY posicion',
                [orden.id]
            );
            const rutas = imgs.map(img => img.ruta);
            orden.imagenes = JSON.stringify({ layout: rutas.length, rutas });
        }

        res.json(ordenes);
    } catch (error) {
        console.error("Error al obtener todas las órdenes:", error);
        res.status(500).json({ mensaje: 'Error al obtener las órdenes' });
    }
});
router.get('/tree', verificarToken, projectController.getOrdenesTree);

// Obtener estadísticas globales de órdenes
router.get('/estadisticas', verificarToken, async (req, res) => {
  try {
    const [porUsuario] = await pool.query(
      `SELECT u.nombre AS usuario, COUNT(*) AS total
       FROM ordenes o
       JOIN usuarios u ON o.usuario_id = u.id
       GROUP BY o.usuario_id`
    );

    const [porMaterial] = await pool.query(
      `SELECT material, COUNT(*) AS total
       FROM ordenes
       GROUP BY material`
    );

    const [pesoProyecto] = await pool.query(
      `SELECT p.nombre_proyecto AS proyecto,
              SUM(COALESCE(CAST(REPLACE(REPLACE(o.peso, 'kg', ''), 'KG', '') AS DECIMAL(10,2)), 0)) AS total_peso
       FROM ordenes o
       JOIN proyectos p ON o.proyecto_id = p.id
       GROUP BY o.proyecto_id`
    );

    const [ordenesPorMes] = await pool.query(
      `SELECT DATE_FORMAT(fecha_inicio, '%Y-%m') AS mes, COUNT(*) AS total
       FROM ordenes
       GROUP BY mes
       ORDER BY mes`
    );

    res.json({
      ordenesPorUsuario: porUsuario,
      ordenesPorMaterial: porMaterial,
      pesoTotalPorProyecto: pesoProyecto,
      ordenesPorMes
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ mensaje: 'Error al obtener estadísticas' });
  }
});

// Guardar imágenes para una orden usando multer
const multer = require('multer');
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'ordenes', req.params.id);
    await fs.promises.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/:id/imagenes', upload.array('imagenes', 5), async (req, res) => {
  const { id } = req.params;
  let layout = parseInt(req.body.layout) || req.files.length || 1;
  try {
    const existentes = req.body.existing ? JSON.parse(req.body.existing) : [];

    const rutas = [];
    let fileIdx = 0;

    for (let i = 0; i < layout; i++) {
      const prev = existentes[i];
      if (typeof prev === 'string' && prev) {
        rutas.push(prev);
      } else if (req.files[fileIdx]) {
        rutas.push(`/ordenes-img/${id}/${req.files[fileIdx].filename}`);
        fileIdx++;
      }
    }

    // agregar cualquier archivo restante
    while (fileIdx < req.files.length) {
      rutas.push(`/ordenes-img/${id}/${req.files[fileIdx].filename}`);
      fileIdx++;
    }

    layout = rutas.length || layout;

    await pool.query('DELETE FROM imagenes WHERE orden_id = ?', [id]);
    for (let i = 0; i < rutas.length; i++) {
      await pool.query(
        'INSERT INTO imagenes (orden_id, posicion, ruta) VALUES (?, ?, ?)',
        [id, i + 1, rutas[i]]
      );
    }

    res.json({ mensaje: 'Imágenes guardadas correctamente', rutas });
  } catch (error) {
    console.error('Error guardando imágenes:', error);
    res.status(500).json({ mensaje: 'Error al guardar imágenes' });
  }
});

module.exports = router;
