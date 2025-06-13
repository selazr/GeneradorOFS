const express = require("express");
const puppeteer = require("puppeteer");
const pool = require("../db");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// ✅ Ruta a la carpeta de plantillas (una carpeta arriba de lxhapp)
const templatesDir = path.join(__dirname, "..", "..", "templates");

// ✅ Ruta absoluta y correcta al logo
const logoPath = path.join(templatesDir, "logo2.png");
const logoBase64 = fs.readFileSync(logoPath).toString("base64");
const logoSrc = `data:image/png;base64,${logoBase64}`;


// Función para formatear la fecha en DD/MM/YYYY
const formatFecha = (fecha) => {
  if (!fecha) return "N/A";
  const date = new Date(fecha);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

router.post("/:id/pdf", async (req, res) => {
  const { id } = req.params;
  const { cliente } = req.query; // 📌 Detectar si es PDF para el cliente

  try {
    // **Obtener datos de la orden desde MySQL**
    const [ordenes] = await pool.query("SELECT * FROM ordenes WHERE id = ?", [id]);
    if (ordenes.length === 0) {
      return res.status(404).json({ mensaje: "Orden no encontrada" });
    }
    const orden = ordenes[0];

    // **Seleccionar la plantilla correcta**
  const plantillaNombre = cliente ? "plantilla2.html" : "plantilla.html";
  const plantillaPath = path.join(templatesDir, plantillaNombre);

    // **Leer la plantilla HTML**
    let html = fs.readFileSync(plantillaPath, "utf8");

    let imagenes = [];
    let layoutSeleccionado = 1;
    if (orden.imagenes) {
      try {
        const parsed = JSON.parse(orden.imagenes);
        const rutas = Array.isArray(parsed) ? parsed : parsed.rutas || [];
        layoutSeleccionado = Array.isArray(parsed) ? rutas.length : parsed.layout || rutas.length;
        imagenes = await Promise.all(
          rutas.map(async (ruta) => {
            const abs = path.join(__dirname, '..', ruta.replace('/ordenes-img/', 'uploads/ordenes/'));
            const data = await fs.promises.readFile(abs);
            const ext = path.extname(ruta).substring(1);
            return `data:image/${ext};base64,${data.toString('base64')}`;
          })
        );
      } catch (e) { console.error('Error leyendo imágenes', e); }
    }

    let imagenGrande = imagenes.length > 0 ? `<img src="${imagenes[0]}" />` : "";
    let imagenesPequenas = imagenes.slice(1, 5).map(img => `<img src="${img}" />`).join("");
    let estiloGrande = "";
    let estiloPequenas = "";
    if (layoutSeleccionado === 1) {
      estiloGrande = 'style="flex:1;width:100%"';
      estiloPequenas = 'style="display:none"';
    }

    // **Reemplazar variables en la plantilla**
    html = html
      .replace("{{IMAGEN_GRANDE}}", imagenGrande)
      .replace("{{IMAGENES_PEQ}}", imagenesPequenas)
      .replace("{{STYLE_GRANDE}}", estiloGrande)
      .replace("{{STYLE_PEQ}}", estiloPequenas)
      .replace("{{LOGO}}", logoSrc)
      .replace(/{{ORDEN}}/g, orden.codigo_proyecto || "No")
      .replace(/{{PESO}}/g, orden.peso || "")
      .replace(/{{NOMBRE_CLIENTE}}/g, orden.nombre_cliente || "No")
      .replace(/{{NOMBRE_PROYECTO}}/g, orden.nombre_proyecto || "No")
      .replace(/{{FIGURA}}/g, orden.figura || "No")
      .replace(/{{REFERENCIA}}/g, orden.codigo_proyecto || "No")
      .replace(/{{RESPONSABLE}}/g, orden.responsable || "No")
      .replace(/{{REVISADO}}/g, orden.revisado || "No")
      .replace(/{{MEDIDAS}}/g, ` L:${orden.medida_v || "0"} W:${orden.medida_w || "0"} H:${orden.medida_h || "0"}`)
      .replace(/{{UNIDADES}}/g, orden.unidad_medida || "mm")
      .replace(/{{CANTIDAD}}/g, orden.cantidad || "No")
      .replace(/{{ACABADO}}/g, orden.acabado || "No")
      .replace(/{{MATERIAL}}/g, orden.material || "No")
      .replace("{{FECHA_INICIO}}", formatFecha(orden.fecha_inicio))
      .replace("{{FECHA_FINAL}}", formatFecha(orden.fecha_fin))
      .replace(/{{FABRIC_PIEZA}}/g, orden.fabric_pieza || "No")
      .replace(/{{POST_MEC}}/g, orden.post_mec || "No")
      .replace(/{{PEGAR_LIJAR}}/g, orden.pegar_lijar || "No")
      .replace(/{{ESCULPIR}}/g, orden.esculpir || "No")
      .replace(/{{LINEX}}/g, orden.line_x || "No")
      .replace(/{{FIBRA}}/g, orden.fibra || "No")
      .replace(/{{MORTERO}}/g, orden.mortero || "No")
      .replace(/{{APAREJO}}/g, orden.aparejo || "No")
      .replace(/{{PINTURA}}/g, orden.pintura || "No")
      .replace(/{{ESTRUCTURA}}/g, orden.estructura || "No")
      .replace(/{{NOTAS}}/g, orden.notas || "")



    // **Iniciar Puppeteer**
    const browser = await puppeteer.launch({
      executablePath: "/usr/bin/chromium-browser",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // **Generar el PDF**
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      timeout: 0,
    });

    await browser.close();

    // **Enviar el PDF al frontend**
    const filename = cliente ? `OF_Cliente_${orden.codigo_proyecto}.pdf` : `OF_${orden.codigo_proyecto}.pdf`;
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);

  } catch (error) {
    console.error("❌ Error al generar el PDF:", error);
    res.status(500).json({ mensaje: "Error interno al generar el PDF" });
  }
});

module.exports = router;
