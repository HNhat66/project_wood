'use client'

import {
  AlertCircle,
  Database,
  Eye,
  Lock,
  Shield,
  UserCheck,
} from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      icon: Database,
      title: 'Thu thập thông tin',
      content: [
        'Chúng tôi thu thập thông tin cá nhân khi bạn đăng ký tài khoản, đặt hàng hoặc liên hệ với chúng tôi.',
        'Thông tin bao gồm: họ tên, địa chỉ email, số điện thoại, địa chỉ giao hàng.',
        'Chúng tôi sử dụng cookies để cải thiện trải nghiệm người dùng trên website.'
      ]
    },
    {
      icon: Eye,
      title: 'Sử dụng thông tin',
      content: [
        'Xử lý đơn hàng và giao hàng sản phẩm đến bạn.',
        'Gửi thông báo về trạng thái đơn hàng và cập nhật sản phẩm mới.',
        'Cải thiện chất lượng dịch vụ và trải nghiệm khách hàng.',
        'Tuân thủ các yêu cầu pháp lý và bảo vệ quyền lợi của công ty.'
      ]
    },
    {
      icon: Lock,
      title: 'Bảo mật thông tin',
      content: [
        'Chúng tôi sử dụng các biện pháp bảo mật tiên tiến để bảo vệ thông tin của bạn.',
        'Dữ liệu được mã hóa và lưu trữ trên server an toàn.',
        'Chỉ nhân viên được ủy quyền mới có thể truy cập thông tin khách hàng.',
        'Thông tin thanh toán được xử lý qua cổng thanh toán bảo mật.'
      ]
    },
    {
      icon: UserCheck,
      title: 'Quyền của bạn',
      content: [
        'Bạn có quyền yêu cầu truy cập, chỉnh sửa hoặc xóa thông tin cá nhân.',
        'Bạn có quyền khiếu nại nếu cho rằng quyền riêng tư bị vi phạm.',
        'Liên hệ với chúng tôi để thực hiện các quyền này.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-wood-100 rounded-full">
              <Shield className="w-8 h-8 text-wood-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-charcoal mb-4">
            Chính sách bảo mật
          </h1>
          <p className="text-lg text-walnut-600 max-w-2xl mx-auto">
            Chúng tôi cam kết bảo vệ thông tin cá nhân và quyền riêng tư của khách hàng.
            Vui lòng đọc kỹ chính sách này để hiểu cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.
          </p>
          <div className="mt-6 text-sm text-walnut-500">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-wood-sm">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-wood-100 rounded-lg mr-4">
                  <section.icon className="w-6 h-6 text-wood-600" />
                </div>
                <h2 className="text-2xl font-semibold text-charcoal">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-walnut-700 leading-relaxed flex items-start">
                    <span className="w-2 h-2 bg-wood-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-wood-50 rounded-2xl p-8 border border-wood-200">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-wood-600 mr-3" />
            <h3 className="text-xl font-semibold text-charcoal">
              Liên hệ về vấn đề bảo mật
            </h3>
          </div>
          <p className="text-walnut-700 mb-4">
            Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật này hoặc muốn thực hiện quyền của mình,
            vui lòng liên hệ với chúng tôi:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="font-medium text-charcoal mb-2">Email:</div>
              <div className="text-walnut-700">privacy@dogohandmade.com</div>
            </div>
            <div>
              <div className="font-medium text-charcoal mb-2">Điện thoại:</div>
              <div className="text-walnut-700">0328282316</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 