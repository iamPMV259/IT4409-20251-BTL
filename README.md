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

**Tạo file `.env.production`** (optional - chỉ cần khi build local):
```env
VITE_API_BASE_URL=http://131.153.239.187:8345/api/v1
```

> ⚠️ **Quan trọng:** File `.env*` không được commit lên Git. Mỗi developer cần tự tạo file này khi clone project.

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
1. Link project với GitHub
2. Vào **Settings → Environment Variables**
3. Thêm variable:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `http://131.153.239.187:8345/api/v1`
   - **Environment:** Production
4. Redeploy

Chi tiết xem: **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)**

### GitHub Actions (CI/CD)
Nếu dùng GitHub Actions, thêm secrets:
1. Vào **Settings → Secrets and variables → Actions**
2. Thêm **New repository secret:**
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `http://131.153.239.187:8345/api/v1`

## 🔒 Environment Variables

Project sử dụng các environment variables sau:

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