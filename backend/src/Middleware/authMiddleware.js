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

    // If no token found, return error immediately
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized, no token' 
        });
    }

    try {
        // Step 2: Verify token signature & expiration with HS256 algorithm
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: [process.env.JWT_ALGORITHM || 'HS256']
        });
        
        const userId = decoded.id || decoded.sub;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Token payload invalid (no id or sub)' });
        }
        // Step 3: Fetch user from database (exclude password)
        req.user = await User.findById(userId).select('-passwordHash');
        
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        next();  // ← Allow request to proceed

    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized, token failed',
            error: error.message
        });
    }
};