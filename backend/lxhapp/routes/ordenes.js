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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                    fecha_fin, peso, notas, id, usuario_id
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
        const [result] = await pool.query('DELETE FROM ordenes WHERE id = ? AND usuario_id = ?', [id, usuario_id]);

        if (result.affectedRows > 0) {
            res.status(200).json({ mensaje: "Orden eliminada correctamente" });
        } else {
            res.status(404).json({ mensaje: "Orden no encontrada o sin permisos para eliminar" });
        }
    } catch (error) {
        console.error("Error al eliminar la orden:", error);
        res.status(500).json({ mensaje: "Error interno del servidor" });
    }
});


// Obtener todas las órdenes del usuario autenticado
router.get('/', verificarToken, async (req, res) => {
    const usuario_id = req.usuario.id;

    try {
        const [ordenes] = await pool.query('SELECT * FROM ordenes WHERE usuario_id = ?', [usuario_id]);
        res.json(ordenes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener las órdenes', error });
    }
});

// Obtener una lista simplificada de órdenes (para mostrar en el listado)
router.get('/', verificarToken, async (req, res) => {
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
        res.json(ordenes);
    } catch (error) {
        console.error("Error al obtener los detalles de las órdenes:", error);
        res.status(500).json({ mensaje: 'Error al obtener las órdenes completas', error });
    }
});
router.get('/tree', projectController.getOrdenesTree);

// Guardar imágenes para una orden
router.post('/:id/imagenes', async (req, res) => {
  const { id } = req.params;
  const { imagenes } = req.body;
  if (!imagenes || !Array.isArray(imagenes)) {
    return res.status(400).json({ mensaje: 'No se enviaron imágenes' });
  }
  try {
    const dir = path.join(__dirname, '..', 'uploads', id.toString());
    await fs.promises.mkdir(dir, { recursive: true });
    await Promise.all(
      imagenes.map((img, idx) => {
        const match = img.match(/^data:image\/(\w+);base64,/);
        const ext = match ? match[1] : 'png';
        const base64Data = img.replace(/^data:image\/\w+;base64,/, '');
        const filePath = path.join(dir, `${idx}.${ext}`);
        return fs.promises.writeFile(filePath, base64Data, 'base64');
      })
    );
    res.json({ mensaje: 'Imágenes guardadas correctamente' });
  } catch (error) {
    console.error('Error guardando imágenes:', error);
    res.status(500).json({ mensaje: 'Error al guardar imágenes' });
  }
});

module.exports = router;
