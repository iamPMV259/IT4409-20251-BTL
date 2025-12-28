const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');

/**
 * Function to generate JWT token with HS256 algorithm
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
    return jwt.sign(
        { id }, 
        process.env.JWT_SECRET, 
        {
            expiresIn: process.env.JWT_EXPIRE,
            algorithm: process.env.JWT_ALGORITHM || 'HS256',
        }
    );
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password, returns JWT token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and password' 
            });
        }

        console.log("Email received:", email);

        const user = await User.findOne({ email });
        
        if (!user) {
            console.log("User not found in database");
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        console.log("User found:", user.name);

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        
        if (!isPasswordValid) {
            console.log("Invalid password");
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        console.log("Password valid, generating token...");

        const token = generateToken(user._id);
        
        res.json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            token: token,
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login',
            error: error.message 
        });
    }
};

module.exports = {
    loginUser,
    generateToken,
};