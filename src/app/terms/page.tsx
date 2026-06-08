import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng — FluxMoney",
  description: "Điều khoản sử dụng dịch vụ FluxMoney.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Quay lại
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Điều khoản sử dụng</h1>
      <p className="mt-1 text-sm text-muted-foreground">Cập nhật lần cuối: 08/06/2026</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-semibold">1. Chấp nhận điều khoản</h2>
          <p>
            Khi tạo tài khoản và sử dụng FluxMoney (&ldquo;Dịch vụ&rdquo;), bạn đồng ý với các
            điều khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng Dịch vụ.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. Mô tả dịch vụ</h2>
          <p>
            FluxMoney là công cụ quản lý dòng tiền cá nhân giúp bạn ghi chép thu chi, ví,
            ngân sách và xem báo cáo. Dịch vụ được cung cấp &ldquo;nguyên trạng&rdquo;, phục vụ
            mục đích tham khảo và quản lý cá nhân, không phải là tư vấn tài chính, đầu tư,
            kế toán hay pháp lý chuyên nghiệp.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">3. Tài khoản của bạn</h2>
          <p>
            Bạn đăng nhập qua nhà cung cấp bên thứ ba (Google). Bạn chịu trách nhiệm giữ an
            toàn cho tài khoản đăng nhập của mình và cho mọi hoạt động phát sinh dưới tài
            khoản đó. Dữ liệu bạn nhập là của bạn và do bạn tự chịu trách nhiệm về tính
            chính xác.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">4. Sử dụng hợp lệ</h2>
          <p>
            Bạn đồng ý không dùng Dịch vụ vào mục đích trái pháp luật, không cố gắng truy cập
            dữ liệu của người dùng khác, không phá hoại hay làm gián đoạn hệ thống.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">5. Dữ liệu và quyền riêng tư</h2>
          <p>
            Việc thu thập và xử lý dữ liệu được mô tả trong{" "}
            <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
              Chính sách quyền riêng tư
            </Link>
            . Bạn có thể xuất hoặc xóa vĩnh viễn dữ liệu của mình bất cứ lúc nào trong phần
            Cài đặt.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">6. Giới hạn trách nhiệm</h2>
          <p>
            Trong phạm vi pháp luật cho phép, FluxMoney không chịu trách nhiệm cho bất kỳ
            thiệt hại nào phát sinh từ việc sử dụng hoặc không thể sử dụng Dịch vụ, bao gồm
            các quyết định tài chính dựa trên số liệu hiển thị trong ứng dụng.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">7. Thay đổi điều khoản</h2>
          <p>
            Chúng tôi có thể cập nhật điều khoản theo thời gian. Bản cập nhật có hiệu lực khi
            đăng tải tại trang này. Việc tiếp tục sử dụng Dịch vụ đồng nghĩa bạn chấp nhận
            điều khoản mới.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">8. Liên hệ</h2>
          <p>
            Mọi thắc mắc về điều khoản, vui lòng liên hệ qua kênh hỗ trợ của ứng dụng.
          </p>
        </section>
      </div>
    </div>
  );
}
