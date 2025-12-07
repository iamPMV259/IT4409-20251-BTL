// const mongoose = require('mongoose');

// // --- Khai báo Schema ---
// const UserSchema = new mongoose.Schema({
//     // Sử dụng type: mongoose.Types.UUID để đảm bảo _id là UUID
//     // _id: {
//     //     type: mongoose.Types.UUID,
//     //     default: () => new mongoose.Types.UUID(), // Tự động tạo UUID khi tạo user
//     // },
    
//     name: {
//         type: String,
//         required: [true, 'Tên không được để trống'],
//         trim: true,
//     },

//     email: {
//         type: String,
//         required: [true, 'Email không được để trống'],
//         unique: true, // Đảm bảo email là duy nhất
//         trim: true,   // Xóa khoảng trắng đầu/cuối
//         lowercase: true, // Chuyển về chữ thường để tránh lỗi trùng lặp/case-sensitive
//         match: [
//             /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
//             'Vui lòng cung cấp địa chỉ email hợp lệ'
//         ],
//     },

//     passwordHash: {
//         type: String,
//         required: [true, 'Hash mật khẩu không được để trống'],
//     },
    
//     avatarUrl: {
//         type: String,
//         default: null, // Cho phép giá trị null
//     },

// }, {
//     // Tự động thêm các trường createdAt và updatedAt
//     timestamps: true, 
//     // Tắt versionKey __v (tùy chọn)
//     versionKey: false, 
// });

// // --- Export Model ---
// module.exports = mongoose.model('TestDB', UserSchema);