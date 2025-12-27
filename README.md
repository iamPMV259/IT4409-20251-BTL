# Project Management Website MVP

This is a code bundle for Project Management Website MVP. The original project is available at https://www.figma.com/design/K2fm4cNzBgZWcreorhfc5g/Project-Management-Website-MVP.

## 🚀 Setup & Running the code

### 1. Install dependencies
```bash
npm install
```

### 2. Setup Environment Variables

**Tạo file `.env.development`** trong thư mục root:
```env
VITE_API_BASE_URL=/api/v1
```

**Tạo file `.env.production`**:
```env
VITE_API_BASE_URL=/api/v1
```

> 💡 **Lưu ý:** Cả dev và prod đều dùng `/api/v1` (relative path)
> - Dev: Vite proxy → Backend
> - Prod: Vercel rewrites → Backend (fix Mixed Content)
> 
> ⚠️ File `.env*` không được commit lên Git

### 3. Start development server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

## 🔧 Deploy lên Production

### Deploy lên Vercel

**Không cần cấu hình Environment Variables!** 

File [`vercel.json`](vercel.json) đã xử lý proxy API requests:
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "http://131.153.239.187:8345/api/:path*" }
  ]
}
```

**Chỉ cần:**
1. Link project với GitHub
2. Push code (có file `vercel.json`)
3. Vercel tự động deploy ✅

**Lợi ích:**
- ✅ Fix Mixed Content (HTTPS → HTTP)
- ✅ Không cần env variables phức tạp
- ✅ URL clean: `https://yourapp.vercel.app/api/v1/...`
Value | Description |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `/api/v1` | Backend API URL (relative path) |

**Proxy Configuration:**
- **Development:** [`vite.config.ts`](vite.config.ts) proxy → `http://131.153.239.187:8345`
- **Production:** [`vercel.json`](vercel.json) rewrites → `http://131.153.239.187:8345`
| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `VITE_API_BASE_URL` | `/api/v1` | `http://131.153.239.187:8345/api/v1` | Backend API URL |

**Lưu ý:**
- Development: Dùng relative path `/api/v1` vì có Vite proxy
- Production: Dùng absolute URL vì không có proxy

## 📖 Documentation

- **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)** - Hướng dẫn deploy lên Vercel và fix lỗi 404

## 🤝 Contributing

Khi làm việc với project:
1. Clone repo và tạo file `.env.development` (xem hướng dẫn ở trên)
2. Không commit file `.env*` lên Git
3. Nếu thay đổi env variables, cập nhật bảng trong README

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/vinhbc16/fe_cnw)