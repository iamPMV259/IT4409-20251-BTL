const express = require ('express');
const router = express.Router();
const LoginAuth = require('../controller/LoginAuth');

// Public login route
router.post('/login', LoginAuth.loginUser);

module.exports = router;