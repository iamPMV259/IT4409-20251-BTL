# Project Management Website MVP

This is a code bundle for Project Management Website MVP. The original project is available at https://www.figma.com/design/K2fm4cNzBgZWcreorhfc5g/Project-Management-Website-MVP.

## 🚀 Setup & Running the code

### 1. Install dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Create `.env.development` file in root directory:
```env
VITE_API_BASE_URL=/api/v1
```

> 💡 See [`.env.example`](.env.example) for template

### 3. Start development server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

## 📖 Documentation

- **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)** - Hướng dẫn deploy lên Vercel và fix lỗi 404

## 🔒 Security Note

- File `.env.*` không được commit lên Git
- Chỉ commit file `.env.example` làm template
- Khi deploy, cấu hình environment variables trên Vercel Dashboard

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/vinhbc16/fe_cnw)