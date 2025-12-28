const express = require('express');
const router = express.Router();
const LoginAuth = require('../controller/LoginAuth');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * Public login route
 * POST /api/v1/auth/login
 */
router.post('/login', LoginAuth.loginUser);

module.exports = router;