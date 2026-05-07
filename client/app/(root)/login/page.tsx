'use client'

import { useState } from 'react';

import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  TreePine,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD


  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wood-50 via-cream to-wood-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const res = await login(email, password)
    if (res.success) {
      toast.success('Đăng nhập thành công')
      router.push([UserRole.ADMIN, UserRole.EMPLOYEE].includes(res.role as UserRole) ? '/dashboard' : '/')
    } else {
      toast.error(res.error || 'Đăng nhập thất bại')
    }
    setIsLoading(false)
  }

  const handleDemoLogin = async () => {
    if (!demoEmail || !demoPassword) {
      toast.error('Demo credentials are not configured')
      return
    }
    setEmail(demoEmail)
    setPassword(demoPassword)
    setIsLoading(true)
    const res = await login(demoEmail, demoPassword)
    if (res.success) {
      toast.success('Đăng nhập demo thành công')
      router.push([UserRole.ADMIN, UserRole.EMPLOYEE].includes(res.role as UserRole) ? '/dashboard' : '/')
    } else {
      toast.error(res.error || 'Đăng nhập demo thất bại')
    }
    setIsLoading(false)
  }

  return (
    <>
      {/* Fullscreen Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center space-y-4">
            <LoadingSpinner className="w-8 h-8" />
            <p className="text-wood-900 font-medium">Đang đăng nhập...</p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-wood-50 via-cream to-wood-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-wood-500 rounded-xl flex items-center justify-center">
                <TreePine className="w-7 h-7 " />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-wood-900">Đồ Gỗ Store</h1>
                <p className="text-sm text-wood-600">Gỗ cao cấp</p>
              </div>
            </Link>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-wood-900 mb-2">Đăng nhập</h2>
              <p className="text-wood-600">
                Chào mừng trở lại! Vui lòng đăng nhập vào tài khoản của bạn.
              </p>
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl p-8 shadow-wood-lg border border-wood-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-wood-900 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-wood-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="pl-10 border-wood-300 focus:border-wood-500"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-wood-900 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-wood-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 border-wood-300 focus:border-wood-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-wood-400 hover:text-wood-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-wood-300 text-wood-500 focus:ring-wood-500"
                  />
                  <span className="ml-2 text-sm text-wood-600">Ghi nhớ đăng nhập</span>
                </label>
                <Link href="/forgot-password" prefetch={false} className="text-sm text-wood-500 hover:text-wood-700">
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-wood-500 hover:bg-wood-600  py-3"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>

              {demoEmail && demoPassword && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={handleDemoLogin}
                  className="w-full py-3 border-wood-300 hover:bg-wood-50"
                >
                  Dùng tài khoản demo
                </Button>
              )}
            </form>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-wood-600">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-wood-500 hover:text-wood-700 font-medium">
                Đăng ký ngay
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-4">
            <Link href="/" className="text-sm text-wood-500 hover:text-wood-700">
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </>
  )
} 