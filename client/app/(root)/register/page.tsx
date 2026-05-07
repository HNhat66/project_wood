'use client'

import {
  useEffect,
  useState,
} from 'react';

import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  TreePine,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { LocationSelector } from '@/components/forms/LocationSelector';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import APIClient from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số'),
  address: z.string().min(10, 'Địa chỉ phải có ít nhất 10 ký tự'),
  password: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(50, 'Mật khẩu không được quá 50 ký tự'),
  confirmPassword: z.string(),
  agreedToTerms: z.boolean().refine(val => val === true, {
    message: 'Bạn phải đồng ý với điều khoản sử dụng'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const router = useRouter()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      confirmPassword: '',
      agreedToTerms: false
    },
  })

  // Redirect authenticated users to profile
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace([UserRole.ADMIN, UserRole.EMPLOYEE].includes(user?.role as UserRole) ? '/dashboard' : '/dashboard/admin/products')
    }
  }, [isAuthenticated, authLoading, router, user])

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wood-50 via-cream to-wood-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Don't render register form if user is authenticated (will be redirected)
  if (isAuthenticated) {
    return null
  }

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true)
    try {
      const client = new APIClient()
      const res = await client.auth().register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        confirmPassword: data.confirmPassword,
        agreedToTerms: data.agreedToTerms
      })
      if (res.status === 201) {
        toast.success('Đăng ký thành công!')
        router.push('/login')
      }
    } catch (error: any) {
      console.error('Error registering user:', error)
      toast.error(error.message || 'Đăng ký thất bại! Vui lòng kiểm tra lại thông tin.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Fullscreen Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center space-y-4">
            <LoadingSpinner className="w-8 h-8" />
            <p className="text-wood-900 font-medium">Đang đăng ký...</p>
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
              <h2 className="text-2xl font-bold text-wood-900 mb-2">Đăng ký</h2>
              <p className="text-wood-600">
                Tạo tài khoản để mua sắm và theo dõi đơn hàng của bạn.
              </p>
            </div>
          </div>

          {/* Register Form */}
          <div className="bg-white rounded-2xl p-8 shadow-wood-lg border border-wood-200">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ và tên</FormLabel>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-wood-400 w-4 h-4" />
                        <FormControl>
                          <Input placeholder="Nguyễn Văn A" className="pl-10" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage className='text-red-500' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-wood-400 w-4 h-4" />
                        <FormControl>
                          <Input placeholder="your.email@example.com" className="pl-10" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage className='text-red-500' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại</FormLabel>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-wood-400 w-4 h-4" />
                        <FormControl>
                          <Input placeholder="0123456789" className="pl-10" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage className='text-red-500' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <LocationSelector
                        value={field.value}
                        onChange={field.onChange}
                        layout="column"
                      />
                      <FormMessage className='text-red-500' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-wood-400 w-4 h-4" />
                        <FormControl>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            className="pl-10 pr-10"
                            placeholder='Nhập mật khẩu'
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-wood-400 hover:text-wood-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <FormMessage className='text-red-500' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xác nhận mật khẩu</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-wood-400 w-4 h-4" />
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            className="pl-10 pr-10"
                            placeholder='Nhập lại mật khẩu'
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-wood-400 hover:text-wood-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <FormMessage className='text-red-500' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agreedToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start space-x-3 space-y-0">
                      <div className='flex items-center space-x-2'>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className='inline'>
                            Tôi đồng ý với{' '}
                            <Link href="/terms" prefetch={false} className="text-wood-500 hover:text-wood-700 font-medium inline">
                              điều khoản sử dụng
                            </Link>{' '}
                            và{' '}
                            <Link href="/privacy" prefetch={false} className="text-wood-500 hover:text-wood-700 font-medium inline">
                              chính sách bảo mật
                            </Link>
                          </FormLabel>
                        </div>
                      </div>
                      <FormMessage className='text-red-500' />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-wood-500 hover:bg-wood-600 py-3"
                >
                  {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                </Button>
              </form>
            </Form>
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-wood-600">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-wood-500 hover:text-wood-700 font-medium">
                Đăng nhập ngay
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