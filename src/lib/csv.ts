// Tiện ích xuất CSV cho giao dịch và chuyển khoản.
// Tuân thủ RFC 4180: các ô chứa dấu phẩy, nháy kép hoặc xuống dòng được bọc trong "".
// Nháy kép bên trong ô được nhân đôi ("").

import type { Transaction, Account, Category, Transfer } from "./types";

// --- Hàm nội bộ ---

/** Escape một ô CSV theo RFC 4180 */
function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Bọc trong nháy kép nếu có dấu phẩy, nháy kép, hoặc xuống dòng
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/** Ghép một hàng CSV từ mảng giá trị */
function buildRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCell).join(",");
}

// --- API công khai ---

/**
 * Chuyển danh sách giao dịch thành chuỗi CSV.
 * Header: Ngày, Loại, Số tiền, Danh mục, Ví, Ghi chú
 * Số tiền để dạng số thuần (Excel nhận là number).
 * Ngày dạng YYYY-MM-DD.
 */
export function transactionsToCsv(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[]
): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const header = buildRow(["Ngày", "Loại", "Số tiền", "Danh mục", "Ví", "Ghi chú"]);

  const rows = transactions.map((tx) => {
    const loai = tx.type === "income" ? "Thu nhập" : "Chi tiêu";
    const danhMuc = tx.categoryId ? (categoryMap.get(tx.categoryId) ?? "") : "";
    const vi = accountMap.get(tx.accountId) ?? "";
    return buildRow([tx.date, loai, tx.amount, danhMuc, vi, tx.note ?? ""]);
  });

  return [header, ...rows].join("\r\n");
}

/**
 * Chuyển danh sách chuyển khoản thành chuỗi CSV.
 * Header: Ngày, Số tiền, Ví nguồn, Ví đích, Ghi chú
 */
export function transfersToCsv(transfers: Transfer[], accounts: Account[]): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  const header = buildRow(["Ngày", "Số tiền", "Ví nguồn", "Ví đích", "Ghi chú"]);

  const rows = transfers.map((tr) => {
    const viNguon = accountMap.get(tr.fromAccountId) ?? "";
    const viDich = accountMap.get(tr.toAccountId) ?? "";
    return buildRow([tr.date, tr.amount, viNguon, viDich, tr.note ?? ""]);
  });

  return [header, ...rows].join("\r\n");
}
