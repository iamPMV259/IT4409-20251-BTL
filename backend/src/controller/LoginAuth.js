const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assume User model is ready
const bcrypt = require('bcryptjs'); // Assume for password comparison

// Function to generate the token
const generateToken = (id) => {
    // Uses the secret key and expiration defined in your .env file
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE, 
    });
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log("1. Email nhận được:", email);
    console.log("2. Mật khẩu nhận được:", password);

    // 1. Check for user existence
    const user = await User.findOne({ email });
    // const user = await User.findOne({ _id: '2eaf1df2-eb08-4f19-a67f-71c9ef7bf976' });
    if (!user) {
        console.log("Lỗi: Không tìm thấy user trong DB.");
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    console.log("chưa");
    // 2. Compare passwor1d (using a library like bcrypt)
    // if (user && (await bcrypt.compare(password, user.passwordHash))) {
    if (user && (await bcrypt.compare(password, user.passwordHash))) { // Simplified check for demonstration
        // 3. Success: Generate and send the token
        res.json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id), // <-- JWT is generated here
        });

    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
};

module.exports = {
    loginUser,
    generateToken, // ✅ Nên export cả hàm này nếu nó được dùng ở nơi khác
};