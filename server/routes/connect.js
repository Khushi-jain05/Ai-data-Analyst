const router = require('express').Router();
router.get('/ping', (_, res) => res.json({ route: 'connect', ok: true }));
module.exports = router;
