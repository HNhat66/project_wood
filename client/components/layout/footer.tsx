'use client'

import {
  Facebook,
  Instagram,
  Youtube,
} from 'lucide-react';
import Link from 'next/link';

import { VERSION } from '@/app/version';

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-walnut-900 text-walnut-100">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex gap-8 sm:flex-row flex-col">
        {/* Company Info */}
        <div className="lg:col-span-1">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-wood-500 rounded-lg flex items-center justify-center">
              <span className=" font-bold text-lg">🪵</span>
            </div>
            <span className="font-bold text-xl ">
              WoodCraft
            </span>
          </div>

          <p className="text-walnut-300 mb-6 leading-relaxed">
            Chuyên sản xuất và kinh doanh đồ gỗ cao cấp, mang đến không gian sống
            tinh tế và gần gũi với thiên nhiên cho mọi gia đình Việt.
          </p>
          <div className="flex items-center space-x-2 text-walnut-300">
            <Link href="/terms" className="hover:text-wood-400 transition-colors duration-200">
              Điều khoản
            </Link>
            <Link href="/privacy" className="hover:text-wood-400 transition-colors duration-200">
              Quyền riêng tư
            </Link>
          </div>

        </div>


        <div className="w-full">
          <div >
            <h3 className="font-semibold  mb-2">
              Đăng ký nhận tin tức mới nhất
            </h3>
            <p className="text-walnut-300 mb-4">
              Nhận thông tin về sản phẩm mới và ưu đãi đặc biệt
            </p>
            <form className="flex space-x-2">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="flex-1 px-4 py-2 rounded-lg bg-walnut-800 border border-walnut-600  placeholder-walnut-400 focus:outline-none focus:ring-2 focus:ring-wood-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-wood-500  rounded-lg hover:bg-wood-600 transition-colors duration-200 font-medium"
              >
                Đăng ký
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-walnut-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Copyright */}
            <p className="text-walnut-400 text-sm flex items-center space-x-2">
              © {currentYear} WoodCraft. Tất cả quyền được bảo lưu.
              <span className="text-walnut-400 text-sm">
                Phiên bản {VERSION}
              </span>
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-6">
              <Link
                href="#"
                className="text-walnut-400 hover:text-wood-400 transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>

              <Link
                href="#"
                className="text-walnut-400 hover:text-wood-400 transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>

              <Link
                href="#"
                className="text-walnut-400 hover:text-wood-400 transition-colors duration-200"
                aria-label="Youtube"
              >
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}