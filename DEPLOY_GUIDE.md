# 🚀 Fix Lỗi 404 khi Deploy lên Vercel - HOÀN TẤT ✅

## ✅ Đã sửa:
1. Cấu hình environment variables cho API URL
2. Tạo file `.env.development` và `.env.production`
3. Cập nhật [`src/lib/api.ts`](src/lib/api.ts) để sử dụng env variables
4. Thêm TypeScript types cho Vite env

## 📝 Các bước để Fix trên Vercel:

### Bước 1: Thêm Environment Variable trên Vercel

1. Vào Vercel Dashboard → Chọn project của bạn
2. Vào **Settings** → **Environment Variables**
3. Thêm variable mới:
   ```
   Name: VITE_API_BASE_URL
   Value: http://131.153.239.187:8345/api/v1
   ```
4. Chọn environment: **Production** (và Preview nếu cần)
5. Click **Save**

### Bước 2: Redeploy

1. Push code mới lên Git (nếu chưa):
   ```bash
   git add .
   git commit -m "Fix: Add environment variables for production API"
   git push
   ```

2. Vercel sẽ tự động build lại, hoặc bạn có thể:
   - Vào **Deployments** tab
   - Click vào deployment mới nhất
   - Click **⋯** menu → **Redeploy**

### Bước 3: Kiểm tra Backend CORS ⚠️

**QUAN TRỌNG:** Backend phải cho phép CORS từ domain Vercel của bạn!

Kiểm tra backend có cấu hình CORS cho:
```
https://your-project-name.vercel.app
```

Nếu backend dùng FastAPI, cần thêm:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-project-name.vercel.app"],  # Hoặc ["*"] cho test
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🧪 Test sau khi Deploy

1. Mở app trên Vercel: `https://your-project-name.vercel.app`
2. Mở DevTools (F12) → Tab **Network**
3. Thử login
4. Kiểm tra request đến: `http://131.153.239.187:8345/api/v1/auth/login`
5. Nếu thấy CORS error → Sửa backend
6. Nếu thấy 404 → Check lại environment variable trên Vercel

## 📂 File Structure

```
FE_CNW/
├── .env.development     # Dev: /api/v1 (với Vite proxy)
├── .env.production      # Prod: http://131.153.239.187:8345/api/v1
├── .env.example         # Template
├── src/
│   ├── vite-env.d.ts   # TypeScript types cho env
│   └── lib/
│       └── api.ts      # Đã update để dùng env variable
└── vite.config.ts      # Có proxy config cho dev
```

## ❓ Troubleshooting

### Vẫn còn 404?
- Kiểm tra environment variable đã save trên Vercel chưa
- Redeploy lại sau khi thêm env variable

### CORS error?
- Backend cần thêm domain Vercel vào CORS whitelist
- Test bằng cách cho phép `*` tạm thời

### Backend không chạy?
- Kiểm tra `http://131.153.239.187:8345/api/v1` có truy cập được không
- Nếu backend cần HTTPS, đổi URL thành `https://...`

## 🎉 Done!

Sau khi hoàn tất các bước trên, app của bạn sẽ login được trên production!
