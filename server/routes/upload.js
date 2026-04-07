const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const Papa    = require('papaparse');
const XLSX    = require('xlsx');
const { v4: uuid } = require('uuid');

// ── Multer setup ─────────────────────────────────────────────
const upload = multer({
  dest: path.join(__dirname, '../uploads/'),
  limits: { fileSize: 50 * 1024 * 1024 },   // 50 MB
  fileFilter(req, file, cb) {
    const allowed = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext)
      ? cb(null, true)
      : cb(new Error(`File type "${ext}" not supported. Use CSV or Excel.`));
  },
});

// ── POST /api/upload/file ─────────────────────────────────────
router.post('/file', upload.single('file'), (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });

  const filePath = req.file.path;
  const ext      = path.extname(req.file.originalname).toLowerCase();
  const name     = req.file.originalname;

  try {
    let rows = [];

    if (ext === '.csv') {
      const content = fs.readFileSync(filePath, 'utf8');
      const result  = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: h => h.trim(),
      });
      rows = result.data;
    } else {
      const wb    = XLSX.readFile(filePath);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
    }

    // Clean up temp file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'File appears to be empty' });
    }

    const columnNames = Object.keys(rows[0]);
    const datasetId   = uuid();

    // Store in session
    req.session.datasetId    = datasetId;
    req.session.datasetName  = name;
    req.session.rows         = rows;

    res.json({
      success:     true,
      datasetId,
      name,
      rowCount:    rows.length,
      columns:     columnNames.length,
      columnNames,
      preview:     rows.slice(0, 5),
    });

  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    next(err);
  }
});

router.get('/ping', (_, res) => res.json({ ok: true }));
module.exports = router;