const pool = require('../db'); // Asegúrate de tener el pool conectado a MySQL

const getOrdenesTree = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;

    const [clientes] = await pool.query(
      'SELECT * FROM clientes WHERE usuario_id = ?',
      [usuario_id]
    );

    const tree = await Promise.all(
      clientes.map(async (cliente) => {
        const [proyectos] = await pool.query(
          'SELECT * FROM proyectos WHERE cliente_id = ? AND usuario_id = ?',
          [cliente.id, usuario_id]
        );

        const proyectosConOrdenes = await Promise.all(
          proyectos.map(async (proyecto) => {
            const [ordenes] = await pool.query(
              'SELECT * FROM ordenes WHERE proyecto_id = ? AND usuario_id = ?',
              [proyecto.id, usuario_id]
            );

            for (const orden of ordenes) {
              const [imgs] = await pool.query(
                'SELECT ruta FROM imagenes WHERE orden_id = ? ORDER BY posicion',
                [orden.id]
              );
              const rutas = imgs.map((img) => img.ruta);
              orden.imagenes = JSON.stringify({ layout: rutas.length, rutas });
            }

            return { proyecto, ordenes };
          })
        );

        return {
          cliente,
          proyectos: proyectosConOrdenes,
        };
      })
    );

    res.json(tree);
  } catch (error) {
    console.error('❌ Error en getOrdenesTree:', error);
    res.status(500).json({ mensaje: 'Error al obtener el árbol de órdenes' });
  }
};

module.exports = {
  getOrdenesTree
};
