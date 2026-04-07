const store = new Map();
module.exports = { save: (d) => store.set(d.id, d), get: (id) => store.get(id) || null, remove: (id) => store.delete(id) };
