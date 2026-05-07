'use client'

import {
  useEffect,
  useState,
} from 'react';

import {
  BarChart3,
  FileText,
  Hammer,
  LayoutDashboard,
  LogOut,
  Package,
  PaintBucket,
  QrCode,
  Ruler,
  Settings,
  ShoppingCart,
  TreePine,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/lib/auth-context';
import {
  NavItem,
  SidebarProps,
  UserRole,
} from '@/lib/types';

import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

const NAV_ITEMS: NavItem[] = [
  {
    title: 'Thống kê',
    href: '/dashboard',
    icon: 'BarChart3',
    role: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },
  {
    title: 'Tiện ích',
    href: '/dashboard/admin/utilities',
    icon: 'LayoutDashboard',
    role: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },
  {
    title: 'Sản phẩm',
    href: '/dashboard/admin/products',
    icon: 'Package',
    role: [UserRole.ADMIN, UserRole.EMPLOYEE],
    children: [
      { title: 'Danh sách sản phẩm', href: '/dashboard/admin/products', role: [UserRole.ADMIN, UserRole.EMPLOYEE] },
      { title: 'Danh mục', href: '/dashboard/admin/categories', role: [UserRole.ADMIN] },
    ],
  },
  {
    title: 'Nguyên liệu',
    href: '/dashboard/admin/materials',
    icon: 'TreePine',
    role: [UserRole.ADMIN],
  },
  {
    title: 'Kích thước',
    href: '/dashboard/admin/sizes',
    icon: 'Ruler',
    role: [UserRole.ADMIN],
  },
  {
    title: 'Khách hàng',
    href: '/dashboard/admin/customers',
    icon: 'Users',
    children: [
      { title: 'Danh sách khách hàng', href: '/dashboard/admin/customers', role: [UserRole.ADMIN, UserRole.EMPLOYEE] },
      { title: 'Danh sách người dùng', href: '/dashboard/admin/users', role: [UserRole.ADMIN] },
    ],
    role: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },
  {
    title: 'Đơn hàng',
    href: '/dashboard/admin/orders',
    icon: 'ShoppingCart',
    role: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },
  {
    title: 'Đặt làm riêng',
    href: '/dashboard/admin/custom-requests',
    icon: 'Hammer',
    role: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },
  {
    title: 'Lịch sử nhập xuất',
    href: '/dashboard/admin/inventory-transaction',
    icon: 'Package',
    role: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },
  // {
  //   title: 'Quản lý QR',
  //   href: '/dashboard/admin/qr-codes',
  //   icon: 'QrCode',
  //   role: [UserRole.ADMIN],
  // }
]

const iconMap = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  PaintBucket,
  Ruler,
  BarChart3,
  Settings,
  TreePine,
  Hammer,
  QrCode,
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Auto-expand current section
  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) =>
          pathname.startsWith(child.href)
        )
        if (hasActiveChild && !expandedItems.includes(item.title)) {
          setExpandedItems((prev) => [...prev, item.title])
        }
      }
    })
  }, [pathname, expandedItems])

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
  }

  const handleLogout = async () => {
    await logout()
    onClose()
  }

  const filteredNavigation = NAV_ITEMS.filter((item) =>
    item.role?.includes(user?.role as any) ?? true
  )
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 transform bg-gradient-to-b from-wood-50 to-wood-100 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-wood-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-wood-500 rounded-lg flex items-center justify-center">
              <TreePine className="w-6 h-6 " />
            </div>
            <div>
              <h2 className="text-lg font-bold text-wood-900">
                Đồ Gỗ Store
              </h2>
              <p className="text-xs text-wood-600">Quản lý cửa hàng</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden text-wood-600 hover:text-wood-900 hover:bg-wood-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-wood-200 bg-wood-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-wood-400 rounded-full flex items-center justify-center">
              <UserCircle className="w-6 h-6 " />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-wood-900 truncate">
                {user?.fullName}
              </p>
              <p className="text-xs text-wood-600 capitalize">
                {user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {filteredNavigation.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap]
              const isActive = item.children
                ? item.children.some((child) => pathname.startsWith(child.href))
                : pathname === item.href
              const isExpanded = expandedItems.includes(item.title)

              return (
                <li key={item.title}>
                  {item.children ? (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.title)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                          isActive
                            ? 'bg-wood-200 text-wood-900 shadow-sm'
                            : 'text-wood-700 hover:bg-wood-100 hover:text-wood-900'
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          {Icon && <Icon className="w-5 h-5" />}
                          <span>{item.title}</span>
                        </div>
                        <div
                          className={cn(
                            'w-4 h-4 transform transition-transform duration-200',
                            isExpanded ? 'rotate-90' : 'rotate-0'
                          )}
                        >
                          <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </button>
                      {isExpanded && (
                        <ul className="mt-1 space-y-1 ml-8">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              {child.role?.includes(user?.role as any) && (
                                <Link
                                  href={child.href}
                                  onClick={() => onClose()}
                                  className={cn(
                                    'block px-3 py-2 text-sm rounded-md transition-colors duration-200',
                                    pathname === child.href
                                      ? 'bg-wood-300 text-wood-900 font-medium'
                                      : 'text-wood-600 hover:bg-wood-100 hover:text-wood-800'
                                  )}
                                >
                                  {child.title}
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => onClose()}
                      className={cn(
                        'flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-wood-200 text-wood-900 shadow-sm'
                          : 'text-wood-700 hover:bg-wood-100 hover:text-wood-900'
                      )}
                    >
                      {Icon && <Icon className="w-5 h-5" />}
                      <span>{item.title}</span>
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-wood-200">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-wood-700 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Đăng xuất
          </Button>
        </div>
      </div>
    </>
  )
}