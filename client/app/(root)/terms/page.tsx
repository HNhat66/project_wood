'use client'

import {
  AlertTriangle,
  CreditCard,
  FileText,
  Scale,
  ShoppingCart,
  Truck,
} from 'lucide-react';

export default function TermsPage() {
  const termsSection = [
    {
      icon: Scale,
      title: 'Điều khoản chung',
      content: [
        'Bằng việc sử dụng website và dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản này.',
        'Chúng tôi có quyền thay đổi các điều khoản mà không cần thông báo trước.',
        'Người dùng có trách nhiệm cập nhật thông tin và tuân thủ các quy định hiện hành.',
        'Việc vi phạm điều khoản có thể dẫn đến việc tạm ngừng hoặc hủy bỏ tài khoản.'
      ]
    },
    {
      icon: ShoppingCart,
      title: 'Đặt hàng và thanh toán',
      content: [
        'Tất cả đơn hàng phải được xác nhận qua email hoặc điện thoại.',
        'Giá cả có thể thay đổi mà không báo trước, trừ khi đã xác nhận đơn hàng.',
        'Khách hàng phải thanh toán đầy đủ theo phương thức đã thỏa thuận.',
        'Đơn hàng sẽ bị hủy nếu không thanh toán trong thời hạn quy định.'
      ]
    },
    {
      icon: Truck,
      title: 'Vận chuyển và giao hàng',
      content: [
        'Thời gian giao hàng từ 7-15 ngày làm việc tùy theo khu vực.',
        'Phí vận chuyển sẽ được tính theo khoảng cách và trọng lượng sản phẩm.',
        'Khách hàng có trách nhiệm kiểm tra hàng hóa khi nhận.',
        'Chúng tôi không chịu trách nhiệm về thiệt hại do vận chuyển nếu không được báo ngay.'
      ]
    },
    {
      icon: CreditCard,
      title: 'Chính sách hoàn tiền',
      content: [
        'Hoàn tiền 100% nếu sản phẩm bị lỗi từ nhà sản xuất.',
        'Hoàn tiền 80% nếu khách hàng hủy đơn trước 24h kể từ khi xác nhận.',
        'Không hoàn tiền đối với sản phẩm đã gia công theo yêu cầu riêng.',
        'Thời gian xử lý hoàn tiền từ 7-14 ngày làm việc.'
      ]
    },
    {
      icon: FileText,
      title: 'Bảo vệ quyền sở hữu trí tuệ',
      content: [
        'Tất cả thiết kế và hình ảnh sản phẩm thuộc bản quyền của chúng tôi.',
        'Nghiêm cấm sao chép, sử dụng mà không có sự đồng ý bằng văn bản.',
        'Khách hàng không được bán lại sản phẩm với mục đích thương mại.',
        'Vi phạm bản quyền sẽ bị xử lý theo quy định pháp luật.'
      ]
    },
    {
      icon: AlertTriangle,
      title: 'Miễn trừ trách nhiệm',
      content: [
        'Chúng tôi không chịu trách nhiệm về thiệt hại do sử dụng sai cách.',
        'Không đảm bảo sản phẩm phù hợp với mọi mục đích sử dụng.',
        'Khách hàng chịu trách nhiệm về an toàn khi lắp đặt và sử dụng.',
        'Trách nhiệm tối đa của chúng tôi không vượt quá giá trị đơn hàng.'
      ]
    }
  ];

  const userRights = [
    {
      title: 'Quyền của khách hàng',
      items: [
        'Được thông tin đầy đủ về sản phẩm và dịch vụ',
        'Được đổi trả sản phẩm theo chính sách quy định', 
        'Được bảo vệ thông tin cá nhân và quyền riêng tư',
        'Được hỗ trợ kỹ thuật và tư vấn sau bán hàng'
      ]
    },
    {
      title: 'Nghĩa vụ của khách hàng',
      items: [
        'Cung cấp thông tin chính xác khi đặt hàng',
        'Thanh toán đầy đủ và đúng hạn theo thỏa thuận',
        'Sử dụng sản phẩm đúng mục đích và hướng dẫn',
        'Thông báo ngay khi phát hiện lỗi hoặc vấn đề'
      ]
    }
  ];

  const prohibitedUses = [
    'Sử dụng website để các hoạt động bất hợp pháp',
    'Tải lên hoặc truyền tải virus, mã độc hại',
    'Giả mạo danh tính hoặc thông tin đăng ký',
    'Spam hoặc gửi thông tin quảng cáo không mong muốn',
    'Can thiệp vào hoạt động bình thường của hệ thống',
    'Sao chép hoặc sử dụng nội dung mà không có phép'
  ];

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-wood-100 rounded-full">
              <FileText className="w-8 h-8 text-wood-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-charcoal mb-4">
            Điều khoản dịch vụ
          </h1>
          <p className="text-lg text-walnut-600 max-w-3xl mx-auto">
            Vui lòng đọc kỹ các điều khoản và điều kiện sử dụng dịch vụ của chúng tôi. 
            Bằng việc sử dụng website và đặt hàng, bạn đồng ý tuân thủ tất cả các điều khoản này.
          </p>
          <div className="mt-6 text-sm text-walnut-500">
            Có hiệu lực từ: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>

        {/* Terms Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {termsSection.map((section, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-wood-sm">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-wood-100 rounded-lg mr-4">
                  <section.icon className="w-6 h-6 text-wood-600" />
                </div>
                <h2 className="text-xl font-semibold text-charcoal">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-walnut-700 text-sm leading-relaxed flex items-start">
                    <span className="w-2 h-2 bg-wood-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Rights and Obligations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {userRights.map((section, index) => (
            <div key={index} className="bg-wood-50 rounded-2xl p-8 border border-wood-200">
              <h3 className="text-2xl font-semibold text-charcoal mb-6">
                {section.title}
              </h3>
              <ul className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-walnut-700 leading-relaxed flex items-start">
                    <span className="w-2 h-2 bg-wood-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Prohibited Uses */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mb-16">
          <div className="flex items-center mb-6">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-2xl font-semibold text-charcoal">
              Các hành vi bị cấm
            </h3>
          </div>
          <p className="text-walnut-700 mb-6">
            Người dùng không được thực hiện các hành vi sau khi sử dụng dịch vụ:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prohibitedUses.map((use, index) => (
              <div key={index} className="text-walnut-700 text-sm leading-relaxed flex items-start">
                <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                {use}
              </div>
            ))}
          </div>
        </div>

        {/* Legal Information */}
        <div className="bg-white rounded-2xl p-8 shadow-wood-sm mb-16">
          <h3 className="text-2xl font-semibold text-charcoal mb-6">
            Thông tin pháp lý
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-charcoal mb-3">Luật áp dụng</h4>
              <p className="text-walnut-700 text-sm leading-relaxed mb-4">
                Các điều khoản này được điều chỉnh bởi luật pháp Việt Nam. 
                Mọi tranh chấp sẽ được giải quyết tại tòa án có thẩm quyền.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-charcoal mb-3">Hiệu lực</h4>
              <p className="text-walnut-700 text-sm leading-relaxed mb-4">
                Điều khoản có hiệu lực kể từ khi được công bố và áp dụng 
                cho tất cả giao dịch sau thời điểm này.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-br from-wood-500 to-wood-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">
            Có thắc mắc về điều khoản?
          </h3>
          <p className="mb-8 opacity-90 max-w-2xl mx-auto">
            Nếu bạn có bất kỳ câu hỏi nào về các điều khoản dịch vụ này, 
            vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="font-semibold mb-2">Email hỗ trợ</div>
              <div className="text-lg">duongdiep31122000@gmail.com</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="font-semibold mb-2">Hotline</div>
              <div className="text-lg">0328282316</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="font-semibold mb-2">Giờ hỗ trợ</div>
              <div className="text-lg">8:00 - 18:00 (T2-T7)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}