import { describe, it, expect } from "vitest";
import { transactionsToCsv, transfersToCsv } from "./csv";
import type { Transaction, Account, Category, Transfer } from "./types";

// --- Dữ liệu mẫu ---

const accounts: Account[] = [
  {
    id: "acc-1",
    name: "Ví tiền mặt",
    kind: "cash",
    initialBalance: 0,
    currency: "VND",
    color: "#000",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "acc-2",
    name: "Ngân hàng, Agribank",
    kind: "bank",
    initialBalance: 0,
    currency: "VND",
    color: "#000",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const categories: Category[] = [
  { id: "cat-1", name: "Ăn uống", type: "expense", icon: "utensils", color: "#f00" },
  { id: "cat-2", name: 'Thưởng "tháng 13"', type: "income", icon: "gift", color: "#0f0" },
];

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-" + Math.random(),
    type: "expense",
    amount: 100000,
    date: "2026-06-08",
    accountId: "acc-1",
    categoryId: "cat-1",
    createdAt: "2026-06-08T00:00:00Z",
    ...overrides,
  };
}

function tr(overrides: Partial<Transfer> = {}): Transfer {
  return {
    id: "tr-" + Math.random(),
    fromAccountId: "acc-1",
    toAccountId: "acc-2",
    amount: 500000,
    date: "2026-06-08",
    createdAt: "2026-06-08T00:00:00Z",
    ...overrides,
  };
}

// --- Test transactionsToCsv ---

describe("transactionsToCsv", () => {
  it("rỗng → chỉ có dòng header", () => {
    const result = transactionsToCsv([], accounts, categories);
    const lines = result.split("\r\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("Ngày,Loại,Số tiền,Danh mục,Ví,Ghi chú");
  });

  it("map đúng tên ví và danh mục", () => {
    const result = transactionsToCsv([tx()], accounts, categories);
    const lines = result.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe("2026-06-08,Chi tiêu,100000,Ăn uống,Ví tiền mặt,");
  });

  it("loại income hiển thị 'Thu nhập'", () => {
    const result = transactionsToCsv(
      [tx({ type: "income", categoryId: "cat-2" })],
      accounts,
      categories
    );
    const lines = result.split("\r\n");
    // cat-2 có tên chứa nháy kép → phải được escape
    expect(lines[1]).toContain("Thu nhập");
  });

  it("categoryId null → ô danh mục rỗng", () => {
    const result = transactionsToCsv([tx({ categoryId: null })], accounts, categories);
    const lines = result.split("\r\n");
    // format: date,loai,amount,,vi,note
    const cols = lines[1].split(",");
    expect(cols[3]).toBe(""); // danh mục rỗng
  });

  it("escape tên ví có dấu phẩy", () => {
    // acc-2 tên = "Ngân hàng, Agribank" → phải bọc trong ""
    const result = transactionsToCsv(
      [tx({ accountId: "acc-2" })],
      accounts,
      categories
    );
    expect(result).toContain('"Ngân hàng, Agribank"');
  });

  it("escape tên danh mục có nháy kép", () => {
    // cat-2 tên = 'Thưởng "tháng 13"'
    const result = transactionsToCsv(
      [tx({ type: "income", categoryId: "cat-2" })],
      accounts,
      categories
    );
    // Nháy kép bên trong phải được nhân đôi
    expect(result).toContain('"Thưởng ""tháng 13"""');
  });

  it("ghi chú có dấu phẩy được escape", () => {
    const result = transactionsToCsv(
      [tx({ note: "cà phê, bánh mì" })],
      accounts,
      categories
    );
    expect(result).toContain('"cà phê, bánh mì"');
  });

  it("ghi chú có nháy kép được nhân đôi", () => {
    const result = transactionsToCsv(
      [tx({ note: 'mua "áo mới"' })],
      accounts,
      categories
    );
    expect(result).toContain('"mua ""áo mới"""');
  });

  it("số tiền là số thuần, không format nghìn", () => {
    const result = transactionsToCsv([tx({ amount: 1500000 })], accounts, categories);
    expect(result).toContain("1500000");
    expect(result).not.toContain("1,500,000");
  });

  it("ngày dạng YYYY-MM-DD giữ nguyên", () => {
    const result = transactionsToCsv([tx({ date: "2026-01-15" })], accounts, categories);
    expect(result).toContain("2026-01-15");
  });

  it("accountId không tồn tại → ô ví rỗng", () => {
    const result = transactionsToCsv([tx({ accountId: "acc-xxx" })], accounts, categories);
    const lines = result.split("\r\n");
    const cols = lines[1].split(",");
    expect(cols[4]).toBe(""); // ví rỗng
  });

  it("nhiều giao dịch → nhiều hàng đúng thứ tự", () => {
    const txs = [
      tx({ date: "2026-06-01", amount: 50000 }),
      tx({ date: "2026-06-02", amount: 75000 }),
    ];
    const result = transactionsToCsv(txs, accounts, categories);
    const lines = result.split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("2026-06-01");
    expect(lines[2]).toContain("2026-06-02");
  });
});

// --- Test transfersToCsv ---

describe("transfersToCsv", () => {
  it("rỗng → chỉ có dòng header", () => {
    const result = transfersToCsv([], accounts);
    const lines = result.split("\r\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("Ngày,Số tiền,Ví nguồn,Ví đích,Ghi chú");
  });

  it("map đúng tên ví nguồn và ví đích", () => {
    const result = transfersToCsv([tr()], accounts);
    const lines = result.split("\r\n");
    expect(lines).toHaveLength(2);
    // acc-2 có dấu phẩy → bọc ""
    expect(lines[1]).toContain("Ví tiền mặt");
    expect(lines[1]).toContain('"Ngân hàng, Agribank"');
  });

  it("ghi chú rỗng → ô cuối rỗng", () => {
    const result = transfersToCsv([tr({ note: undefined })], accounts);
    const lines = result.split("\r\n");
    expect(lines[1].endsWith(",")).toBe(true);
  });
});
