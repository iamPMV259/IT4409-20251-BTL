const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

// Middleware function to protect routes
exports.protect = async (req, res, next) => {
    let token;

    // Step 1: Extract token from "Authorization: Bearer <token>" header
    if (req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    try {
        // Step 2: Verify token signature & expiration
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Step 3: Fetch user from database (exclude password)
        req.user = await User.findById(decoded.id).select('-passwordHash');
        
        next();  // ← Allow request to proceed

    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Not authorized, token failed' 
        });
    }

    if (!token) {
        res.status(401).json({ 
            success: false, 
            message: 'Not authorized, no token' 
        });
    }
};