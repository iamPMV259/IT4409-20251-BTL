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
  // onSignUp prop cũ có thể bỏ hoặc giữ để tương thích ngược, nhưng logic chính nằm ở context
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
    
    if (password.length < 6) {
        toast.error("Mật khẩu phải có ít nhất 6 ký tự");
        return;
    }

    setIsLoading(true);
    try {
      // 1. Gọi API đăng ký
      await authApi.register(name, email, password);
      toast.success("Đăng ký thành công! Đang đăng nhập...");

      // 2. Tự động đăng nhập sau khi đăng ký thành công
      const { data } = await authApi.login(email, password);
      
      // 3. Lưu token vào context -> App sẽ tự chuyển sang màn hình chính
      login(data.token, data.user);
      
    } catch (error: any) {
      console.error(error);
      // Hiển thị lỗi chi tiết từ backend nếu có
      const message = error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      toast.error(message);
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
            placeholder="Nguyễn Văn A"
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
            placeholder="ban@example.com"
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
          <p className="text-xs text-slate-500">Ít nhất 6 ký tự</p>
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </Button>

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
          onClick={() => toast.info("Tính năng đăng nhập Google đang phát triển")}
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Đăng ký bằng Google
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