import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Chính sách quyền riêng tư — FluxMoney",
  description: "Cách FluxMoney thu thập, sử dụng và bảo vệ dữ liệu của bạn.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Quay lại
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Chính sách quyền riêng tư</h1>
      <p className="mt-1 text-sm text-muted-foreground">Cập nhật lần cuối: 08/06/2026</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-semibold">1. Dữ liệu chúng tôi thu thập</h2>
          <p>Khi bạn dùng FluxMoney, chúng tôi lưu trữ:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Thông tin tài khoản:</strong> địa chỉ email và tên hiển thị do nhà cung
              cấp đăng nhập (Google) cung cấp.
            </li>
            <li>
              <strong>Dữ liệu tài chính bạn nhập:</strong> ví, giao dịch, chuyển khoản, danh
              mục, ngân sách, giao dịch định kỳ.
            </li>
            <li>
              <strong>Dữ liệu sử dụng tối thiểu:</strong> ví dụ số lượt dùng tính năng phân
              tích AI mỗi ngày để giới hạn lạm dụng.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. Cách chúng tôi sử dụng dữ liệu</h2>
          <p>
            Dữ liệu chỉ dùng để cung cấp và vận hành Dịch vụ cho riêng bạn: hiển thị số liệu,
            tổng hợp báo cáo và (nếu bạn dùng) tạo nhận định tài chính. Chúng tôi{" "}
            <strong>không bán</strong> dữ liệu của bạn cho bên thứ ba.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">3. Lưu trữ và bảo mật</h2>
          <p>
            Dữ liệu được lưu trên hạ tầng Supabase (PostgreSQL) và được cô lập theo từng
            người dùng bằng Row Level Security — mỗi người chỉ truy cập được dữ liệu của
            chính mình. Kết nối được mã hóa qua HTTPS.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">4. Tính năng phân tích AI</h2>
          <p>
            Nếu bạn dùng tính năng phân tích AI, một bản tóm tắt số liệu (không kèm thông tin
            định danh) có thể được gửi tới nhà cung cấp mô hình ngôn ngữ để sinh nhận định.
            Tính năng này là tùy chọn; nếu không bật, mọi phân tích được thực hiện cục bộ.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">5. Quyền của bạn</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Xuất dữ liệu:</strong> tải toàn bộ dữ liệu dưới dạng tệp JSON trong phần
              Cài đặt.
            </li>
            <li>
              <strong>Xóa dữ liệu:</strong> xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên
              quan bất cứ lúc nào trong phần Cài đặt. Thao tác này không thể hoàn tác.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">6. Lưu giữ dữ liệu</h2>
          <p>
            Dữ liệu được giữ cho đến khi bạn xóa. Khi bạn xóa tài khoản, toàn bộ dữ liệu liên
            quan bị xóa khỏi cơ sở dữ liệu ngay lập tức.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">7. Thay đổi chính sách</h2>
          <p>
            Chính sách có thể được cập nhật theo thời gian. Bản mới có hiệu lực khi đăng tải
            tại trang này.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">8. Liên hệ</h2>
          <p>
            Nếu có câu hỏi về quyền riêng tư hoặc dữ liệu của bạn, vui lòng liên hệ qua kênh
            hỗ trợ của ứng dụng.
          </p>
        </section>
      </div>
    </div>
  );
}
