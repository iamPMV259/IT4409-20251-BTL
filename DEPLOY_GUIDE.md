# 🚀 Fix Lỗi 404 và Mixed Content khi Deploy lên Vercel - HOÀN TẤT ✅

## ✅ Đã sửa:
1. Cấu hình environment variables cho API URL
2. Tạo file `.env.development` và `.env.production`
3. Cập nhật [`src/lib/api.ts`](src/lib/api.ts) để sử dụng env variables
4. Thêm TypeScript types cho Vite env
5. **Tạo `vercel.json`** để proxy API requests (fix Mixed Content HTTPS → HTTP)

## 🔴 Vấn đề Mixed Content Error

**Lỗi:** Backend dùng HTTP nhưng Vercel dùng HTTPS → Trình duyệt chặn!
```
Mixed Content: The page at 'https://fecnwmyworkspace.vercel.app/' was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint 'http://131.153.239.187:8345/api/v1/auth/login'
```

**Giải pháp:** Dùng Vercel Rewrites để proxy requests qua HTTPS:

## ⚠️ Setup Local Environment (Lần đầu clone project)

Tạo file `.env.development` trong thư mục root:
```env
VITE_API_BASE_URL=/api/v1
```

Tạo file `.env.production`:
```env
VITE_API_BASE_URL=/api/v1
```

> 💡 **Chú ý:** Cả dev và production đều dùng `/api/v1` (relative path)
> - **Development:** Vite proxy → `http://131.153.239.187:8345`
> - **Production:** Vercel rewrites → `http://131.153.239.187:8345`
>
> 🔒 **Bảo m~~Thêm Environment Variable~~ (KHÔNG CẦN NỮA!)

> ✅ **Không cần cấu hình Environment Variable trên Vercel**
> 
> File `vercel.json` đã xử lý proxy, chỉ cần dùng relative path `/api/v1`

### Bước 2: Commit và Push

1. Đảm bảo đã có file `vercel.json` trong project (đã có)

2. Push code lên Git:
   ```bash
   git add .
   git commit -m "fix: Add vercel.json for API proxy to fix Mixed Content error"
   git push
   ```

3. Vercel sẽ tự động build lại với config mới
   > 🔒 **An toàn:** File `.env*` không được push lên Git (pattern `.env*`
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
├── .env.development     # ⚠️ KHfecnwmyworkspace.vercel.app`
2. Mở DevTools (F12) → Tab **Network**
3. Thử login
4. Kiểm tra request:
   - **URL:** `https://fecnwmyworkspace.vercel.app/api/v1/auth/login` (HTTPS!)
   - **Status:** 200 OK (không còn Mixed Content error)
5. Nếu thấy CORS error → Sửa backend (xem bên dưới)
│       └── api.ts      # Đọc env variable
└── vite.config.ts      # Proxy config cho dev
```

## ❓ Troubleshooting
VITEMixed Content Error?
- ✅ **Đã fix:** File `vercel.json` đã được thêm vào
- Push code mới và Vercel sẽ tự động apply config

### CORS Error?
Backend cần cho phép domain Vercel. Thêm vào backend CORS config:
```python
allow_origins=[
    "https://fecnwmyworkspace.vercel.app",
    "https://*.vercel.app",  # Cho phép tất cả preview deployments
    "http://localhost:3000"   # Dev local
]
```

### Vercel Rewrites không hoạt động?
- Kiểm tra file `vercel.json` đã commit chưa
- Redeploy lại từ Vercel dashboard
- Check build logs có lỗi không
## 🔧 Cách hoạt động:

### Development (localhost):
```
Browser → /api/v1 → Vite Proxy → http://131.153.239.187:8345/api/v1
```

### Production (Vercel):
```
Browser → /api/v1 → Vercel Rewrites → http://131.153.239.187:8345/api/v1
```

> 💡 **Lợi ích:** Không bị Mixed Content error vì browser chỉ thấy relative path `/api/v1
### Backend không chạy?
- Kiểm tra `http://131.153.239.187:8345/api/v1` có truy cập được không
- Nếu backend cần HTTPS, đổi URL thành `https://...`

## 🎉 Done!

Sau khi hoàn tất các bước trên, app của bạn sẽ login được trên production!
