import type { Transaction, Category, TxType } from "./types";

// ── Helpers chuẩn hoá text ────────────────────────────────────────────────

/**
 * Bỏ dấu tiếng Việt, chuyển về lowercase, bỏ ký tự đặc biệt.
 * Không thêm lib mới — dùng String.prototype.normalize sẵn có của V8.
 */
function normalize(s: string): string {
  return s
    .normalize("NFD") // tách tổ hợp ký tự
    .replace(/[̀-ͯ]/g, "") // bỏ combining marks (dấu)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
}

/** Tách chuỗi thành danh sách token (bỏ chuỗi rỗng). */
function tokenize(s: string): string[] {
  return normalize(s).split(/\s+/).filter(Boolean);
}

// ── Kiểu đầu vào ─────────────────────────────────────────────────────────

export interface SuggestInput {
  note?: string;
  amount?: number;
  type: TxType;
}

export interface SuggestResult {
  categoryId: string;
  score: number; // [0, 1]
}

// ── Hàm chính ─────────────────────────────────────────────────────────────

/**
 * Gợi ý danh mục dựa trên lịch sử giao dịch của user.
 *
 * Thuật toán:
 * 1. Chỉ xét giao dịch cùng `type` và có `categoryId`.
 * 2. Tính điểm từng category theo:
 *    a. Khớp token trong note (ưu tiên cao).
 *    b. Tần suất xuất hiện (fallback khi không có note).
 * 3. Chuẩn hoá điểm max = 1, trả `topN` kết quả cao nhất.
 *
 * @param input   Thông tin giao dịch đang nhập
 * @param history Lịch sử giao dịch từ store
 * @param categories Danh sách danh mục hợp lệ
 * @param topN    Số gợi ý tối đa (mặc định 3)
 */
export function suggestCategories(
  input: SuggestInput,
  history: Transaction[],
  categories: Category[],
  topN = 3
): SuggestResult[] {
  // Tập categoryId hợp lệ theo đúng type
  const validIds = new Set(
    categories.filter((c) => c.type === input.type).map((c) => c.id)
  );

  // Lọc lịch sử: cùng type, có category, category còn tồn tại
  const relevant = history.filter(
    (t) => t.type === input.type && t.categoryId && validIds.has(t.categoryId)
  );

  if (relevant.length === 0) return [];

  // Token của note đầu vào (có thể rỗng)
  const inputTokens = input.note ? tokenize(input.note) : [];

  // Tổng hợp điểm theo categoryId
  const scoreMap = new Map<string, number>();

  for (const t of relevant) {
    const catId = t.categoryId as string;
    let delta = 0;

    if (inputTokens.length > 0 && t.note) {
      // Tính tỉ lệ token khớp giữa note đầu vào và note lịch sử
      const histTokens = tokenize(t.note);
      if (histTokens.length > 0) {
        let matchCount = 0;
        for (const tok of inputTokens) {
          if (histTokens.includes(tok)) matchCount++;
        }
        if (matchCount > 0) {
          // Điểm token: tỷ lệ khớp × hệ số ưu tiên cao
          delta = (matchCount / inputTokens.length) * 10;
        }
      }
    }

    // Mỗi lần xuất hiện cộng 1 điểm tần suất (luôn áp dụng)
    delta += 1;

    scoreMap.set(catId, (scoreMap.get(catId) ?? 0) + delta);
  }

  if (scoreMap.size === 0) return [];

  // Chuẩn hoá về [0, 1]
  const maxScore = Math.max(...scoreMap.values());

  const results: SuggestResult[] = Array.from(scoreMap.entries())
    .map(([categoryId, raw]) => ({
      categoryId,
      score: maxScore > 0 ? raw / maxScore : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return results;
}
