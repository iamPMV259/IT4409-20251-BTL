import React, { useState } from 'react';
import { AuthLayout } from './auth-layout';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { authApi } from '../lib/api';
import { useAuth } from '../context/auth-context';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SignUpPageProps {
  onNavigate: (page: string) => void;
  onSignUp?: () => void;
}

export function SignUpPage({ onNavigate }: SignUpPageProps) {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) { // Kiểm tra độ dài password (optional)
        toast.error("Mật khẩu nên có ít nhất 6 ký tự");
        // Không return ở đây nếu server check kỹ hơn, nhưng nên check client-side trước
    }

    setIsLoading(true);
    try {
      // 1. Đăng ký
      await authApi.register(name, email, password);
      toast.success("Đăng ký thành công! Đang tự động đăng nhập...");

      // 2. Đăng nhập ngay lập tức
      const loginRes = await authApi.login(email, password);
      const accessToken = loginRes.data.access_token;

      // 3. Lưu token để axios interceptor hoạt động
      localStorage.setItem('accessToken', accessToken);

      // 4. Lấy thông tin user
      const userRes = await authApi.getMe();
      
      // 5. Vào app
      login(accessToken, userRes.data);
      
    } catch (error: any) {
      console.error(error);
      let message = "Đăng ký thất bại. Vui lòng thử lại.";
      
      // Xử lý lỗi chi tiết từ server (Pydantic validation error structure)
      if (error.response?.data?.detail) {
         if (Array.isArray(error.response.data.detail)) {
             // Lấy lỗi đầu tiên trong mảng
             message = error.response.data.detail[0].msg;
         } else {
             message = error.response.data.detail;
         }
      }
      toast.error(message);
      localStorage.removeItem('accessToken'); // Cleanup nếu lỗi giữa chừng
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Tạo tài khoản mới" subtitle="Bắt đầu quản lý công việc với TaskFlow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Họ và tên</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </Button>

        {/* ... Phần Footer/Google Button giữ nguyên như file trước ... */}
        <div className="relative">
          <Separator className="my-4" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-slate-500 text-xs">
            hoặc
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => toast.info("Tính năng đang phát triển")}
          disabled={isLoading}
        >
           {/* SVG Google icon */}
           Google
        </Button>
      </form>

      <p className="mt-6 text-center text-slate-600 text-sm">
        Đã có tài khoản?{' '}
        <button
          onClick={() => onNavigate('login')}
          className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
          disabled={isLoading}
        >
          Đăng nhập
        </button>
      </p>
    </AuthLayout>
  );
}