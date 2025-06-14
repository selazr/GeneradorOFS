const pool = require('../db'); // Asegúrate de tener el pool conectado a MySQL

const getOrdenesTree = async (req, res) => {
  try {
    const [clientes] = await pool.query('SELECT * FROM clientes');

    const tree = await Promise.all(clientes.map(async (cliente) => {
      const [proyectos] = await pool.query('SELECT * FROM proyectos WHERE cliente_id = ?', [cliente.id]);

      const proyectosConOrdenes = await Promise.all(proyectos.map(async (proyecto) => {
        const [ordenes] = await pool.query('SELECT * FROM ordenes WHERE proyecto_id = ?', [proyecto.id]);
        return { proyecto, ordenes };
      }));

      return {
        cliente,
        proyectos: proyectosConOrdenes
      };
    }));

    res.json(tree);
  } catch (error) {
    console.error('❌ Error en getOrdenesTree:', error);
    res.status(500).json({ mensaje: 'Error al obtener el árbol de órdenes' });
  }
};

module.exports = {
  getOrdenesTree
};
