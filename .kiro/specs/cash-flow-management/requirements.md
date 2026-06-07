# Requirements Document

Tài liệu Yêu cầu — Quản lý Dòng tiền (Cash Flow Management)

## Introduction

Tính năng **Quản lý Dòng tiền** cho phép người dùng cuối ghi nhận, phân loại và theo dõi thu nhập, chi tiêu của họ theo thời gian trong môi trường SaaS đa người thuê (multi-tenant). Người dùng có thể quản lý nhiều ví/tài khoản, gắn giao dịch vào danh mục, thiết lập ngân sách, tạo giao dịch định kỳ và xem báo cáo dòng tiền trực quan. Mọi dữ liệu tài chính được cô lập chặt chẽ theo từng tenant và từng người dùng, đúng với nguyên tắc "secure-by-default" và "multi-tenant isolation" của sản phẩm.

Tài liệu này định nghĩa *cái gì* (what) và *tại sao* (why). Các quyết định kỹ thuật (schema cụ thể, RLS policy, Server Actions...) được để dành cho giai đoạn thiết kế (`architecture.md`).

Các user story được ưu tiên **P1/P2/P3**, mỗi story có thể kiểm thử độc lập. **P1 là MVP** có thể vận hành độc lập.

## Glossary

- **System**: Toàn bộ ứng dụng Quản lý Dòng tiền (Cash Flow Management).
- **Transaction_Service**: Thành phần xử lý tạo, sửa, xóa, truy vấn giao dịch.
- **Category_Service**: Thành phần quản lý danh mục thu/chi.
- **Account_Service**: Thành phần quản lý ví/tài khoản tiền (account/wallet).
- **Budget_Service**: Thành phần quản lý ngân sách theo danh mục và theo kỳ.
- **Recurring_Service**: Thành phần tạo và thực thi giao dịch định kỳ (recurring).
- **Report_Service**: Thành phần tổng hợp dữ liệu dòng tiền và sinh báo cáo/biểu đồ.
- **Auth_Service**: Thành phần xác thực và phiên đăng nhập (Supabase Auth).
- **Tenant**: Tổ chức/không gian làm việc sở hữu dữ liệu; mọi bản ghi tài chính đều thuộc về một tenant.
- **Tenant_Context**: Định danh tenant đang hoạt động được xác định cho mỗi yêu cầu, dùng làm phạm vi cô lập dữ liệu.
- **User**: Người dùng đã đăng nhập, thuộc một hoặc nhiều tenant với vai trò xác định.
- **Transaction**: Một bản ghi thu (income) hoặc chi (expense) gồm số tiền, ngày, danh mục, tài khoản.
- **Account/Wallet**: Nơi chứa tiền (tiền mặt, tài khoản ngân hàng, ví điện tử...) với số dư.
- **Category**: Nhãn phân loại giao dịch (ví dụ: Lương, Ăn uống, Đi lại).
- **Budget**: Giới hạn chi tiêu dự kiến cho một danh mục trong một kỳ (period).
- **Period**: Kỳ ngân sách hoặc kỳ định kỳ xác định theo lịch dương (ví dụ: tháng dương lịch, quý, năm) với mốc bắt đầu và kết thúc rõ ràng.
- **Recurring_Rule**: Quy tắc lặp lại để tự sinh giao dịch theo lịch.
- **Base_Currency**: Đơn vị tiền tệ chính của một tenant dùng để quy đổi và tổng hợp báo cáo.
- **Supported_Currency**: Loại tiền tệ có mã ISO 4217 nằm trong danh sách hệ thống hỗ trợ.
- **Exchange_Rate**: Tỷ giá áp dụng để quy đổi một số tiền từ loại tiền tệ gốc sang Base_Currency.
- **Cash_Flow**: Chênh lệch giữa tổng thu và tổng chi trong một khoảng thời gian (tổng thu trừ tổng chi).

## Requirements

### Requirement 1: Quản lý giao dịch thu/chi (P1)

**User Story:** Là một người dùng, tôi muốn ghi nhận các khoản thu và chi của mình, để tôi theo dõi được tiền vào và tiền ra.

*Vì sao ưu tiên P1:* Ghi nhận giao dịch là giá trị cốt lõi tối thiểu; không có nó thì không có dữ liệu để phân tích.

*Kiểm thử độc lập:* Đăng nhập, tạo một giao dịch thu và một giao dịch chi, sửa và xóa chúng, xác nhận danh sách phản ánh đúng các thao tác.

#### Acceptance Criteria

1. WHEN một User gửi yêu cầu tạo giao dịch với số tiền từ 0,01 đến 999.999.999,99 (tối đa 2 chữ số thập phân), loại thuộc {thu, chi}, ngày không ở tương lai và một tài khoản thuộc tenant hiện tại, THE Transaction_Service SHALL lưu giao dịch và gắn giao dịch với tenant và user hiện tại.
2. IF số tiền giao dịch nhỏ hơn 0,01, lớn hơn 999.999.999,99 hoặc có quá 2 chữ số thập phân, THEN THE Transaction_Service SHALL từ chối yêu cầu và trả về thông báo lỗi mô tả ràng buộc số tiền.
3. IF yêu cầu tạo hoặc sửa giao dịch thiếu một trong các trường bắt buộc (số tiền, loại, ngày, tài khoản), THEN THE Transaction_Service SHALL từ chối yêu cầu, không lưu thay đổi và trả về thông báo lỗi chỉ rõ trường còn thiếu.
4. IF ngày giao dịch ở tương lai hoặc tài khoản không thuộc tenant hiện tại, THEN THE Transaction_Service SHALL từ chối yêu cầu và trả về thông báo lỗi tương ứng.
5. WHEN một User yêu cầu chỉnh sửa một giao dịch thuộc tenant hiện tại với các giá trị hợp lệ mới, THE Transaction_Service SHALL cập nhật giao dịch và giữ nguyên liên kết tenant và user của giao dịch.
6. IF một User yêu cầu sửa hoặc xóa một giao dịch không tồn tại trong tenant hiện tại, THEN THE Transaction_Service SHALL từ chối yêu cầu và trả về thông báo lỗi không tìm thấy giao dịch mà không tiết lộ dữ liệu của tenant khác.
7. WHEN một User yêu cầu xóa một giao dịch thuộc tenant hiện tại, THE Transaction_Service SHALL xóa giao dịch và loại bỏ khỏi danh sách hiển thị.
8. WHEN một User yêu cầu xem danh sách giao dịch, THE Transaction_Service SHALL trả về các giao dịch thuộc tenant hiện tại theo trang tối đa 50 bản ghi mỗi trang, sắp xếp theo ngày giảm dần và với các giao dịch cùng ngày thì theo thời điểm tạo giảm dần.
9. THE Transaction_Service SHALL lưu mỗi giao dịch với ngày, số tiền, loại, danh mục và tài khoản liên kết.

### Requirement 2: Quản lý danh mục thu/chi (P1)

**User Story:** Là một người dùng, tôi muốn phân loại giao dịch vào các danh mục, để tôi hiểu tiền của mình đi vào đâu.

*Vì sao ưu tiên P1:* Phân loại là điều kiện cần để báo cáo và ngân sách có ý nghĩa; gắn liền với MVP.

*Kiểm thử độc lập:* Tạo danh mục thu và chi, gắn giao dịch vào danh mục, xác nhận giao dịch hiển thị đúng danh mục.

#### Acceptance Criteria

1. WHEN một User tạo một danh mục với tên dài từ 1 đến 50 ký tự sau khi loại bỏ khoảng trắng đầu cuối (trim) và loại thuộc {thu, chi}, THE Category_Service SHALL lưu danh mục gắn với tenant hiện tại.
2. IF tên danh mục sau khi trim rỗng hoặc dài quá 50 ký tự, hoặc loại không thuộc {thu, chi}, THEN THE Category_Service SHALL từ chối yêu cầu, không lưu danh mục và trả về thông báo lỗi validation tương ứng.
3. IF một User tạo một danh mục có tên trùng với danh mục đang tồn tại cùng loại trong tenant hiện tại (so sánh sau khi trim, không phân biệt hoa thường), THEN THE Category_Service SHALL từ chối yêu cầu và trả về thông báo lỗi trùng tên.
4. WHEN một User gán một danh mục thuộc tenant hiện tại và cùng loại với giao dịch, THE Transaction_Service SHALL gán danh mục đó cho giao dịch.
5. IF một User gán cho giao dịch một danh mục thuộc tenant khác hoặc lệch loại với giao dịch, THEN THE Transaction_Service SHALL từ chối yêu cầu, giữ nguyên danh mục cũ của giao dịch và trả về thông báo lỗi.
6. WHEN một User yêu cầu xóa một danh mục đang được giao dịch sử dụng, THE Category_Service SHALL giữ nguyên các giao dịch và chuyển chúng về trạng thái "Chưa phân loại" (Uncategorized).
7. WHEN một tenant được khởi tạo lần đầu, THE Category_Service SHALL cung cấp một tập danh mục mặc định gồm tối thiểu một danh mục thu và một danh mục chi.

### Requirement 3: Quản lý ví/tài khoản và số dư (P1)

**User Story:** Là một người dùng, tôi muốn quản lý nhiều ví/tài khoản, để tôi theo dõi số dư ở từng nơi chứa tiền.

*Vì sao ưu tiên P1:* Giao dịch phải gắn với một nơi chứa tiền để số dư có ý nghĩa; cần thiết cho MVP.

*Kiểm thử độc lập:* Tạo một ví với số dư ban đầu, thêm giao dịch thu/chi, xác nhận số dư cập nhật chính xác.

#### Acceptance Criteria

1. WHEN một User tạo một Account/Wallet với tên dài từ 1 đến 100 ký tự và số dư ban đầu từ -999.999.999,99 đến 999.999.999,99 (tối đa 2 chữ số thập phân), THE Account_Service SHALL lưu tài khoản gắn với tenant hiện tại.
2. IF tên tài khoản rỗng hoặc dài quá 100 ký tự, hoặc số dư ban đầu nằm ngoài khoảng cho phép hoặc có quá 2 chữ số thập phân, THEN THE Account_Service SHALL từ chối yêu cầu, không lưu tài khoản một phần và trả về thông báo lỗi theo từng trường vi phạm.
3. WHEN một giao dịch thu được gắn với một Account/Wallet, THE Account_Service SHALL tăng số dư của tài khoản đó đúng bằng số tiền giao dịch.
4. WHEN một giao dịch chi được gắn với một Account/Wallet, THE Account_Service SHALL giảm số dư của tài khoản đó đúng bằng số tiền giao dịch, kể cả khi số dư kết quả nhỏ hơn 0.
5. WHEN một giao dịch được sửa hoặc xóa, THE Account_Service SHALL tính lại số dư của các tài khoản liên quan một cách xác định và nhất quán dựa trên toàn bộ giao dịch còn lại của tài khoản.
6. WHEN một User yêu cầu xem tổng quan, THE Account_Service SHALL trả về số dư hiện tại của từng tài khoản và tổng số dư quy đổi về Base_Currency theo tỷ giá hiện hành, làm tròn đến 2 chữ số thập phân.
7. IF một tỷ giá cần thiết để quy đổi về Base_Currency không có sẵn khi tính tổng quan, THEN THE Account_Service SHALL trả về thông báo lỗi thiếu tỷ giá và không hiển thị tổng số dư sai lệch.
8. IF một User yêu cầu xóa một Account/Wallet còn giao dịch liên kết, THEN THE Account_Service SHALL yêu cầu xác nhận, nêu rõ số lượng giao dịch bị ảnh hưởng và chỉ xóa tài khoản sau khi User xác nhận.

### Requirement 4: Xác thực và cô lập dữ liệu đa người thuê (P1)

**User Story:** Là một người dùng, tôi muốn dữ liệu tài chính của mình được bảo mật và cô lập, để không ai ngoài tenant của tôi xem được.

*Vì sao ưu tiên P1:* Đây là yêu cầu bảo mật nền tảng (secure-by-default); mọi story khác phụ thuộc vào nó.

*Kiểm thử độc lập:* Đăng nhập bằng hai tenant khác nhau, xác nhận dữ liệu của tenant này không truy cập được từ tenant kia.

#### Acceptance Criteria

1. IF một yêu cầu truy cập dữ liệu tài chính kèm phiên đăng nhập không hợp lệ (thiếu, hết hạn hoặc đã bị thu hồi), THEN THE Auth_Service SHALL từ chối yêu cầu, không trả về bất kỳ dữ liệu tài chính nào và chuyển hướng tới luồng đăng nhập trong vòng 2 giây.
2. WHEN một bản ghi tài chính (giao dịch, danh mục, tài khoản, ngân sách, quy tắc định kỳ) được tạo, THE System SHALL gán bản ghi đó cho đúng một tenant duy nhất.
3. IF không xác định được Tenant_Context tại thời điểm tạo một bản ghi tài chính, THEN THE System SHALL từ chối yêu cầu, không lưu bản ghi và trả về thông báo lỗi thiếu tenant context.
4. WHEN một User truy vấn bất kỳ dữ liệu tài chính nào, THE System SHALL chỉ trả về các bản ghi có định danh tenant khớp với Tenant_Context đang hoạt động và loại trừ bản ghi của tenant khác.
5. IF một User cố truy cập bản ghi thuộc tenant khác, THEN THE System SHALL từ chối yêu cầu mà không tiết lộ sự tồn tại của bản ghi và ghi nhận (audit) sự kiện gồm định danh user, tenant đang hoạt động và thời điểm xảy ra.
6. WHERE một User thuộc nhiều tenant, THE System SHALL đánh giá mọi truy cập theo Tenant_Context đang hoạt động được chọn.

### Requirement 5: Ngân sách theo danh mục (P2)

**User Story:** Là một người dùng, tôi muốn đặt ngân sách cho từng danh mục theo kỳ, để tôi kiểm soát chi tiêu.

*Vì sao ưu tiên P2:* Tăng giá trị kiểm soát chi tiêu nhưng phụ thuộc vào giao dịch và danh mục đã có ở P1.

*Kiểm thử độc lập:* Đặt ngân sách cho một danh mục trong tháng, thêm chi tiêu vượt mức, xác nhận hệ thống báo đã vượt ngân sách.

#### Acceptance Criteria

1. WHEN một User đặt một Budget cho một danh mục chi với số tiền từ 0,01 đến 999.999.999,99 và một Period xác định, THE Budget_Service SHALL lưu ngân sách gắn với tenant hiện tại.
2. IF số tiền Budget nhỏ hơn 0,01, lớn hơn 999.999.999,99 hoặc có quá 2 chữ số thập phân, THEN THE Budget_Service SHALL từ chối yêu cầu, không lưu ngân sách và trả về thông báo lỗi validation số tiền.
3. WHILE một Period ngân sách đang diễn ra, THE Budget_Service SHALL tính tổng chi tiêu thực tế của danh mục trong Period đó.
4. WHEN tổng chi tiêu thực tế của một danh mục đạt hoặc vượt 80% số tiền Budget của Period, THE Budget_Service SHALL hiển thị cảnh báo gần đạt mức ngân sách cho User.
5. WHEN tổng chi tiêu thực tế của một danh mục đạt hoặc vượt 100% số tiền Budget của Period, THE Budget_Service SHALL đánh dấu ngân sách đó là "Vượt mức" (Over budget) và hiển thị cảnh báo vượt mức cho User.
6. WHEN một User xem một Budget, THE Budget_Service SHALL hiển thị số tiền ngân sách, số đã chi và số còn lại của Period hiện tại.
7. IF một User đặt hai Budget cho cùng một danh mục trong cùng một Period, THEN THE Budget_Service SHALL từ chối yêu cầu và trả về thông báo lỗi trùng ngân sách.

### Requirement 6: Giao dịch định kỳ (P2)

**User Story:** Là một người dùng, tôi muốn thiết lập giao dịch lặp lại tự động, để tôi không phải nhập tay các khoản cố định như lương hay tiền thuê nhà.

*Vì sao ưu tiên P2:* Tiện lợi cao nhưng không cần thiết cho MVP; phụ thuộc vào giao dịch ở P1.

*Kiểm thử độc lập:* Tạo một quy tắc lặp hằng tháng, mô phỏng tới ngày đến hạn, xác nhận giao dịch tương ứng được sinh ra một lần cho mỗi kỳ.

#### Acceptance Criteria

1. WHEN một User tạo một Recurring_Rule với số tiền từ 0,01 đến 999.999.999,99, loại thuộc {thu, chi}, tần suất thuộc {hằng ngày, hằng tuần, hằng tháng, hằng năm}, một danh mục, một tài khoản và ngày bắt đầu không sớm hơn ngày hôm nay, THE Recurring_Service SHALL lưu quy tắc gắn với tenant hiện tại.
2. IF một trường đầu vào của Recurring_Rule không hợp lệ (số tiền ngoài khoảng, loại không thuộc {thu, chi}, tần suất không thuộc danh sách cho phép, hoặc ngày bắt đầu sớm hơn hôm nay), THEN THE Recurring_Service SHALL từ chối yêu cầu, không lưu quy tắc và trả về thông báo lỗi theo từng trường vi phạm.
3. WHEN một Recurring_Rule đến ngày đến hạn của một Period, THE Recurring_Service SHALL sinh một giao dịch sao chép số tiền, loại, danh mục và tài khoản của quy tắc.
4. WHEN một Recurring_Rule đã sinh giao dịch cho một Period, THE Recurring_Service SHALL không sinh thêm giao dịch trùng cho Period đó, đảm bảo mỗi Period đến hạn được sinh đúng một lần.
5. WHILE một Recurring_Rule đang ở trạng thái tạm dừng (paused), THE Recurring_Service SHALL không sinh giao dịch mới cho quy tắc đó.
6. WHEN một User hủy một Recurring_Rule, THE Recurring_Service SHALL dừng sinh giao dịch cho các kỳ đến hạn sau thời điểm hủy và giữ nguyên các giao dịch đã sinh trước đó.
7. WHERE một Recurring_Rule có ngày kết thúc (end date), THE Recurring_Service SHALL không sinh giao dịch cho kỳ có ngày đến hạn sau ngày kết thúc đó.

### Requirement 7: Báo cáo và bảng điều khiển dòng tiền (P2)

**User Story:** Là một người dùng, tôi muốn xem báo cáo dòng tiền theo thời gian, để tôi hiểu xu hướng thu chi của mình.

*Vì sao ưu tiên P2:* Mang lại insight giá trị cao nhưng phụ thuộc vào dữ liệu giao dịch và danh mục.

*Kiểm thử độc lập:* Nhập một tập giao dịch trong nhiều tháng, xác nhận báo cáo hiển thị đúng tổng thu, tổng chi và dòng tiền ròng theo từng kỳ.

#### Acceptance Criteria

1. WHEN một User yêu cầu báo cáo dòng tiền cho một khoảng thời gian xác định bởi ngày bắt đầu (start) và ngày kết thúc (end) bao gồm cả hai đầu mút, THE Report_Service SHALL trả về tổng thu, tổng chi và Cash_Flow ròng (tổng thu trừ tổng chi) cho khoảng thời gian đó trong vòng 5 giây.
2. WHEN một User yêu cầu phân tích theo danh mục cho một khoảng thời gian, THE Report_Service SHALL trả về tổng chi tiêu theo từng danh mục trong khoảng thời gian đó theo thứ tự sắp xếp xác định.
3. WHEN một User mở bảng điều khiển (dashboard), THE Report_Service SHALL hiển thị tổng số dư hiện tại, dòng tiền ròng của tháng dương lịch hiện tại và chuỗi 12 tháng dòng tiền ròng theo từng tháng.
4. WHEN một User yêu cầu báo cáo, THE Report_Service SHALL chỉ tổng hợp các bản ghi thuộc tenant đang hoạt động.
5. WHERE tenant có giao dịch ở nhiều loại tiền tệ, THE Report_Service SHALL quy đổi mọi số tiền về Base_Currency trước khi tổng hợp.
6. IF một tỷ giá cần thiết để quy đổi về Base_Currency không có sẵn, THEN THE Report_Service SHALL trả về thông báo lỗi thiếu tỷ giá và không sinh báo cáo với số liệu sai lệch.
7. IF khoảng thời gian được yêu cầu không hợp lệ (ngày bắt đầu lớn hơn ngày kết thúc), THEN THE Report_Service SHALL từ chối yêu cầu, không sinh báo cáo và trả về thông báo lỗi khoảng thời gian không hợp lệ.
8. IF không có giao dịch nào trong khoảng thời gian được yêu cầu, THEN THE Report_Service SHALL trả về báo cáo với tổng thu bằng 0, tổng chi bằng 0 và Cash_Flow ròng bằng 0 cùng trạng thái rỗng rõ ràng.

### Requirement 8: Hỗ trợ đa tiền tệ (P3)

**User Story:** Là một người dùng, tôi muốn ghi nhận giao dịch ở nhiều loại tiền tệ, để tôi quản lý tiền khi giao dịch quốc tế.

*Vì sao ưu tiên P3:* Nâng cao trải nghiệm cho một nhóm người dùng cụ thể; không bắt buộc cho phần lớn người dùng.

*Kiểm thử độc lập:* Tạo giao dịch ở một loại tiền khác Base_Currency, xác nhận báo cáo quy đổi đúng theo tỷ giá.

#### Acceptance Criteria

1. WHEN một User tạo một giao dịch với một Supported_Currency (mã ISO 4217 trong danh sách hệ thống hỗ trợ) và số tiền từ 0,01 đến 999.999.999,99, THE Transaction_Service SHALL lưu cả số tiền gốc và loại tiền tệ của giao dịch đó.
2. WHEN một giao dịch khác Base_Currency được tổng hợp vào báo cáo, THE Report_Service SHALL quy đổi số tiền sang Base_Currency theo Exchange_Rate áp dụng, làm tròn đến 2 chữ số thập phân.
3. WHEN một số tiền được quy đổi sang Base_Currency, THE Report_Service SHALL hiển thị Exchange_Rate đã dùng để người dùng truy vết.
4. THE System SHALL cho phép mỗi tenant cấu hình đúng một Base_Currency.
5. WHILE một tenant chưa cấu hình Base_Currency, THE System SHALL áp dụng Base_Currency mặc định của hệ thống cho tenant đó.
6. IF một User chọn một loại tiền tệ không được hỗ trợ, THEN THE System SHALL từ chối yêu cầu, không lưu giao dịch và trả về danh sách các Supported_Currency.
7. IF một Exchange_Rate cần áp dụng để quy đổi không có sẵn, THEN THE System SHALL trả về thông báo lỗi thiếu tỷ giá và không quy đổi với số liệu sai lệch. [NEEDS CLARIFICATION: nguồn tỷ giá và tần suất cập nhật tỷ giá — dùng tỷ giá nhập tay, API bên ngoài, hay tỷ giá tại thời điểm giao dịch?]

## Functional Requirements

- **FR-001**: THE System SHALL yêu cầu phiên đăng nhập hợp lệ cho mọi thao tác đọc/ghi dữ liệu tài chính.
- **FR-002**: THE System SHALL gán mọi bản ghi tài chính cho đúng một tenant và cô lập dữ liệu giữa các tenant ở cả tầng ứng dụng lẫn tầng cơ sở dữ liệu (RLS).
- **FR-003**: THE Transaction_Service SHALL hỗ trợ tạo, đọc, cập nhật và xóa giao dịch thu và chi.
- **FR-004**: THE Transaction_Service SHALL từ chối giao dịch có số tiền nằm ngoài khoảng từ 0,01 đến 999.999.999,99 hoặc có quá 2 chữ số thập phân.
- **FR-005**: THE Category_Service SHALL hỗ trợ tạo, sửa, xóa danh mục và cung cấp danh mục mặc định khi khởi tạo tenant.
- **FR-006**: THE Category_Service SHALL ngăn trùng tên danh mục trong cùng loại và cùng tenant.
- **FR-007**: THE Account_Service SHALL duy trì số dư chính xác cho mỗi Account/Wallet sau mỗi thao tác tạo/sửa/xóa giao dịch.
- **FR-008**: THE Account_Service SHALL hiển thị tổng số dư quy về Base_Currency của tenant.
- **FR-009**: THE Budget_Service SHALL cho phép đặt ngân sách theo danh mục và theo kỳ, và tính số đã chi so với ngân sách.
- **FR-010**: THE Budget_Service SHALL phát cảnh báo khi chi tiêu đạt hoặc vượt ngân sách của kỳ.
- **FR-011**: THE Recurring_Service SHALL sinh giao dịch định kỳ đúng một lần cho mỗi kỳ đến hạn theo quy tắc đang hoạt động.
- **FR-012**: THE Report_Service SHALL tổng hợp tổng thu, tổng chi và Cash_Flow ròng theo khoảng thời gian và theo danh mục.
- **FR-013**: THE Report_Service SHALL hiển thị trạng thái rỗng rõ ràng khi không có dữ liệu trong kỳ được yêu cầu.
- **FR-014**: THE System SHALL ghi nhận (log) các sự kiện truy cập bị từ chối và các lỗi ảnh hưởng tới người dùng.
- **FR-015**: WHERE đa tiền tệ được bật, THE System SHALL lưu loại tiền tệ gốc của giao dịch và quy đổi về Base_Currency khi tổng hợp.
- **FR-016**: THE System SHALL áp dụng giới hạn theo gói thuê (entitlements) cho các tính năng/giới hạn sử dụng có thu phí. [NEEDS CLARIFICATION: tính năng nào bị giới hạn theo gói, ví dụ số tài khoản, đa tiền tệ, hay báo cáo nâng cao?]

## Key Entities

- **Transaction**: Một khoản thu hoặc chi. Thuộc tính chính: số tiền, loại (thu/chi), ngày, loại tiền tệ, ghi chú. Quan hệ: thuộc một Tenant, một User, một Account/Wallet, và (tùy chọn) một Category.
- **Category**: Nhãn phân loại. Thuộc tính: tên, loại (thu/chi), cờ mặc định. Quan hệ: thuộc một Tenant; có nhiều Transaction.
- **Account/Wallet**: Nơi chứa tiền. Thuộc tính: tên, loại (tiền mặt/ngân hàng/ví...), số dư ban đầu, số dư hiện tại, loại tiền tệ. Quan hệ: thuộc một Tenant; có nhiều Transaction.
- **Budget**: Giới hạn chi cho một danh mục trong một kỳ. Thuộc tính: số tiền, kỳ (tháng/quý/năm). Quan hệ: thuộc một Tenant; liên kết một Category.
- **Recurring_Rule**: Quy tắc sinh giao dịch lặp. Thuộc tính: số tiền, loại, tần suất, ngày bắt đầu, ngày kết thúc (tùy chọn), trạng thái. Quan hệ: thuộc một Tenant; liên kết một Category và một Account/Wallet; sinh ra nhiều Transaction.
- **Tenant**: Tổ chức/không gian làm việc sở hữu dữ liệu. Thuộc tính: tên, Base_Currency, gói thuê. Quan hệ: có nhiều User, Transaction, Category, Account/Wallet, Budget, Recurring_Rule.
- **User**: Người dùng đã đăng nhập. Thuộc tính: định danh, email, vai trò trong tenant. Quan hệ: thuộc một hoặc nhiều Tenant.

## Success Criteria

- **SC-001**: Một người dùng mới có thể tạo giao dịch thu/chi đầu tiên trong vòng dưới 2 phút kể từ khi đăng nhập.
- **SC-002**: 100% truy vấn dữ liệu tài chính chỉ trả về bản ghi thuộc tenant đang hoạt động (không rò rỉ chéo tenant).
- **SC-003**: Số dư của mỗi Account/Wallet khớp với tổng các giao dịch liên quan sau mọi thao tác tạo/sửa/xóa.
- **SC-004**: Báo cáo dòng tiền cho một kỳ phản ánh đúng tổng thu, tổng chi và Cash_Flow ròng so với dữ liệu giao dịch gốc.
- **SC-005**: Bảng điều khiển dòng tiền cho một tài khoản với tối đa 10.000 giao dịch tải xong các chỉ số chính trong dưới 2 giây ở p95. [NEEDS CLARIFICATION: ngưỡng dữ liệu và mục tiêu hiệu năng cụ thể cho người dùng cá nhân]
- **SC-006**: Cảnh báo vượt ngân sách hiển thị cho người dùng ngay trong kỳ khi chi tiêu đạt hoặc vượt mức ngân sách.
- **SC-007**: Giao dịch định kỳ được sinh đúng một lần cho mỗi kỳ đến hạn, không trùng lặp.

## Assumptions

- Xác thực và quản lý phiên dùng lại Supabase Auth có sẵn của nền tảng; tính năng này không tự xây luồng đăng nhập riêng.
- Mô hình đa người thuê (tenant/organization) và vai trò đã tồn tại ở nền tảng; tính năng này tái sử dụng tenant đang hoạt động làm phạm vi dữ liệu.
- Phạm vi MVP (P1) gồm giao dịch, danh mục, ví/tài khoản và cô lập dữ liệu; ngân sách, định kỳ, báo cáo nâng cao và đa tiền tệ thuộc các bước sau.
- Mỗi tenant có một Base_Currency mặc định; đa tiền tệ là tùy chọn (P3).
- "Người dùng" trong các story chủ yếu là cá nhân quản lý tài chính của chính họ trong phạm vi tenant; quản lý tài chính cộng tác nhiều người trong cùng tenant không nằm trong phạm vi ban đầu. [NEEDS CLARIFICATION: dữ liệu tài chính dùng chung trong một tenant hay riêng từng user?]
- Giao dịch chuyển khoản giữa hai ví (transfer) chưa nằm trong phạm vi ban đầu. [NEEDS CLARIFICATION: có cần loại giao dịch chuyển khoản giữa các ví không?]
- Đính kèm hóa đơn/chứng từ (receipt attachment) và import từ ngân hàng/CSV chưa nằm trong phạm vi ban đầu.
