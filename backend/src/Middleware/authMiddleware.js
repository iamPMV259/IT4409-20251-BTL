const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized, no token' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: [process.env.JWT_ALGORITHM || 'HS256']
        });
        
        const userId = decoded.id || decoded.sub;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Token payload invalid (no id or sub)' });
        }
        req.user = await User.findById(userId).select('-passwordHash');
        
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        next(); 

    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized, token failed',
            error: error.message
        });
    }
};