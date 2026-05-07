'use client'

import { useState } from 'react';

import { Menu } from 'lucide-react';

import { VERSION } from '@/app/version';

import { Button } from '../ui/button';
import { Sidebar } from './sidebar';

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-wood-200 shadow-sm">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-wood-600 hover:text-wood-900 hover:bg-wood-100"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div>
                <h1 className="text-xl font-bold text-wood-900">Hệ thống quản lý cửa hàng đồ gổ</h1>
              </div>
            </div>

          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1">
          <div className="container mx-auto px-4 lg:px-6 py-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-wood-200 bg-white/50">
          <div className="container mx-auto px-4 lg:px-6 py-4">
            <div className="flex flex-col items-center justify-between space-y-2 md:flex-row md:space-y-0">
              <p className="text-sm text-wood-600">
                © 2025 Đồ Gỗ Store. Tất cả quyền được bảo lưu.
              </p>
              <p className="text-xs text-wood-500">
                Phiên bản {VERSION}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
} 