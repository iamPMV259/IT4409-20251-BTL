const fs = require('fs');
const path = 'c:/Users/ACER/Desktop/User-Management/backend/src/routes/ColumnsRoutes.js';
const content = `const express = require ('express');
const router = express.Router();
const Module4Controller = require('../controller/Module4Controller');
const {protect} = require('../Middleware/authMiddleware')
// dùng middleware để bảo vệ api
router.use(protect);
router.patch('/:columnId', Module4Controller.updateColumn);
router.delete('/:columnId',Module4Controller.deleteColumn);

// Export router so it can be mounted by CenterAPIRoutes
module.exports = router;
`;
fs.writeFileSync(path, content, 'utf8');
console.log('ColumnsRoutes.js overwritten');
