'use client'

import {
  useEffect,
  useState,
} from 'react';

import {
  LogOut,
  Menu,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAuth,
  usePermissions,
} from '@/lib/auth-context';
import { useCart } from '@/lib/hooks/use-cart';
import { useUIStore } from '@/lib/stores/ui-store';
import { UserRole } from '@/lib/types';

export function Navbar() {
  const [isClient, setIsClient] = useState(false)
  const { user, logout, isAuthenticated, isLoading } = useAuth()
  const { onlyUserAndGuest, canAccessAdminFeatures } = usePermissions()
  const cart = useCart()
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleLogout = async () => {
    await logout()
    closeMobileMenu()
  }
  if (isLoading) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Trang chủ' },
    { href: '/products', label: 'Sản phẩm' },
    { href: '/tracking', label: 'Tra cứu đơn hàng' },
  ]

  const adminLinks = [
    { href: '/dashboard', label: 'Quản lý', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  ]
  const dropMenuLinks = [
    { href: '/profile', label: 'Hồ sơ của tôi' , roles: [UserRole.USER, UserRole.ADMIN, UserRole.EMPLOYEE]},
    { href: '/orders', label: 'Đơn hàng của tôi' , roles: [UserRole.USER]},
    { href: '/custom-request', label: 'Yêu cầu đặt làm riêng' , roles: [UserRole.USER]},
    { href: '/address', label: 'Địa chỉ' , roles: [UserRole.USER]},
    { href: '/dashboard', label: 'Quản lý' , roles: [UserRole.ADMIN, UserRole.EMPLOYEE]},
  ]

  return (
    <nav className="sticky top-0 z-50 bg-cream border-b border-walnut-200 shadow-wood">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-wood-500 rounded-lg flex items-center justify-center">
              <span className=" font-bold text-lg">🪵</span>
            </div>
            <span className="font-bold text-xl text-charcoal">
              WoodCraft
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-walnut-700 hover:text-wood-600 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
            
            {/* Admin Links */}
            {isAuthenticated && canAccessAdminFeatures() && (
              <>
                {adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-wood-600 hover:text-wood-700 transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </div>


          {/* Right Side Actions */}
          {isLoading ? (
            <div className="flex items-center space-x-4 bg-wood-50 px-3 py-2 rounded-lg border border-wood-200">
              {/* Cart Skeleton */}
              <Skeleton className="h-8 w-8 rounded-md bg-wood-100" />
              
              {/* User Menu Skeleton */}
              <div className="hidden md:flex items-center space-x-2">
                <Skeleton className="h-8 w-20 rounded-md bg-wood-100" />
                <Skeleton className="h-8 w-16 rounded-md bg-wood-100" />
              </div>
              
              {/* Mobile Menu Button Skeleton */}
              <Skeleton className="md:hidden h-8 w-8 rounded-md bg-wood-100" />
            </div>
          ) : (
            <div className="flex items-center space-x-4">
            {/* Cart - Only show for USER role */}
            {onlyUserAndGuest() && (
              <Link href="/cart" className="relative">
                <Button variant="ghost" size="sm" className="text-walnut-700 hover:text-wood-600">
                  <ShoppingCart className="h-5 w-5" />
                  {isClient && cart.totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-wood-500 text-white">
                      {cart.totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="relative group">
                <Button variant="ghost" size="sm" className="hover:bg-wood-50">
                  <User className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">{user.fullName}</span>
                </Button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-wood-lg border border-walnut-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-walnut-200">
                      <p className="text-sm font-medium text-charcoal">{user.fullName}</p>
                      <p className="text-xs text-walnut-600">{user.email}</p>
                    </div>
                    {dropMenuLinks
                      .filter(link => !link.roles || link.roles.includes(user?.role as UserRole))
                      .map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center px-4 py-2 text-sm text-walnut-700 hover:bg-wood-50"
                        >
                          {link.label}
                        </Link>
                      ))}

                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-walnut-700 hover:bg-wood-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button size="sm" className="bg-wood-500 hover:bg-wood-600" asChild>
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-walnut-200 py-4">
            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block py-2 text-walnut-700 hover:text-wood-600 transition-colors"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              ))}

              {/* Admin Links */}
              {isAuthenticated && canAccessAdminFeatures() && (
                <>
                  {adminLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block py-2 text-wood-600 hover:text-wood-700 transition-colors"
                      onClick={closeMobileMenu}
                    >
                      {link.label}
                    </Link>
                  ))}
                </>
              )}

              {/* Mobile Auth Buttons */}
              {!isAuthenticated && (
                <div className="pt-4 border-t border-walnut-200 space-y-2">
                  <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                    <Link href="/login" onClick={closeMobileMenu}>Đăng nhập</Link>
                  </Button>
                  <Button size="sm" className="w-full bg-wood-500 hover:bg-wood-600" asChild>
                    <Link href="/register" onClick={closeMobileMenu}>Đăng ký</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
} 