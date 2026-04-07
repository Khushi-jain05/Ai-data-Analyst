const router = require('express').Router();
router.get('/ping', (_, res) => res.json({ route: 'chat', ok: true }));
module.exports = router;
