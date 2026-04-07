const router = require('express').Router();
router.get('/ping', (_, res) => res.json({ route: 'data', ok: true }));
module.exports = router;
