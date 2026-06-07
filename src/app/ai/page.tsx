"use client";

import * as React from "react";
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  ShieldCheck,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Info,
  Send,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { cn, formatCurrency } from "@/lib/utils";
import { analyze, buildSummaryText, type InsightTone } from "@/lib/insights";
import { answerQuestion, SUGGESTED_QUESTIONS } from "@/lib/assistant";

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
}

export default function AiPage() {
  const hydrated = useHydrated();
  const transactions = useStore((s) => s.transactions);
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const budgets = useStore((s) => s.budgets);
  const transfers = useStore((s) => s.transfers);
  const baseCurrency = useStore((s) => s.baseCurrency);

  const analysis = React.useMemo(
    () => analyze(transactions, accounts, categories, budgets, transfers),
    [transactions, accounts, categories, budgets, transfers]
  );

  const [deep, setDeep] = React.useState<string | null>(null);
  const [deepLoading, setDeepLoading] = React.useState(false);
  const [deepNote, setDeepNote] = React.useState<string | null>(null);

  const [chat, setChat] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  async function runDeepAnalysis() {
    setDeepLoading(true);
    setDeepNote(null);
    setDeep(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: buildSummaryText(analysis, baseCurrency) }),
      });
      const data = await res.json();
      if (data.available) {
        setDeep(data.content);
      } else {
        setDeepNote(data.reason ?? "Phân tích AI chưa khả dụng.");
      }
    } catch {
      setDeepNote("Không gọi được dịch vụ AI. Đang dùng phân tích cục bộ.");
    } finally {
      setDeepLoading(false);
    }
  }

  function ask(question: string) {
    const text = question.trim();
    if (!text) return;
    const answer = answerQuestion(text, analysis, baseCurrency);
    setChat((c) => [
      ...c,
      { role: "user", text },
      { role: "assistant", text: answer },
    ]);
    setInput("");
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="p-8 text-center text-sm text-muted-foreground">Đang tải…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Phân tích</h1>
          <p className="text-sm text-muted-foreground">
            Nhận định tài chính thông minh và trợ lý hỏi-đáp về dòng tiền của bạn.
          </p>
        </div>
      </div>

      {/* Highlight stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Highlight
          label="Tỷ lệ tiết kiệm"
          value={`${(analysis.savingsRate * 100).toFixed(0)}%`}
          icon={<PiggyBank className="size-5" />}
          tone={analysis.savingsRate >= 0.2 ? "positive" : analysis.savingsRate >= 0 ? "info" : "warning"}
        />
        <Highlight
          label="Dòng tiền ròng tháng"
          value={formatCurrency(analysis.net, baseCurrency)}
          icon={analysis.net >= 0 ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
          tone={analysis.net >= 0 ? "positive" : "warning"}
        />
        <Highlight
          label="Dự báo chi cả tháng"
          value={formatCurrency(analysis.projectedExpense, baseCurrency)}
          icon={<TrendingDown className="size-5" />}
          tone="info"
        />
        <Highlight
          label="Quỹ dự phòng"
          value={
            analysis.runwayMonths !== null
              ? `${analysis.runwayMonths.toFixed(1)} tháng`
              : "—"
          }
          icon={<ShieldCheck className="size-5" />}
          tone={
            analysis.runwayMonths === null
              ? "info"
              : analysis.runwayMonths >= 6
              ? "positive"
              : analysis.runwayMonths < 3
              ? "warning"
              : "info"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Insights */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="size-5 text-amber-500" /> Nhận định
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {analysis.insights.map((ins, i) => (
              <InsightRow key={i} tone={ins.tone} title={ins.title} detail={ins.detail} />
            ))}

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={runDeepAnalysis}
                disabled={deepLoading}
              >
                {deepLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Đang phân tích…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> Phân tích sâu bằng AI
                  </>
                )}
              </Button>
              {deep && (
                <div className="mt-3 whitespace-pre-wrap rounded-lg border bg-primary/5 p-3 text-sm">
                  {deep}
                </div>
              )}
              {deepNote && (
                <p className="mt-2 flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  {deepNote}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top categories + Chat */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top chi tiêu tháng này</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.topCategories.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  Chưa có khoản chi nào trong tháng.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {analysis.topCategories.map((c) => (
                    <li key={c.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(c.amount, baseCurrency)} · {c.pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${c.pct}%`, backgroundColor: c.color }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-5 text-primary" /> Hỏi trợ lý
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <div className="mb-3 max-h-64 space-y-2 overflow-y-auto scrollbar-thin">
                {chat.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">
                    Hỏi bất cứ điều gì về dòng tiền của bạn.
                  </p>
                ) : (
                  chat.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                        m.role === "user"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {m.text}
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="mb-2 flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(input);
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Nhập câu hỏi…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button type="submit" size="icon" aria-label="Gửi">
                  <Send className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Highlight({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: InsightTone;
}) {
  const toneCls =
    tone === "positive"
      ? "bg-income/15 text-income"
      : tone === "warning"
      ? "bg-expense/15 text-expense"
      : "bg-primary/10 text-primary";
  return (
    <Card>
      <CardContent className="p-4">
        <span className={cn("flex size-9 items-center justify-center rounded-full", toneCls)}>
          {icon}
        </span>
        <p className="mt-2 text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function InsightRow({
  tone,
  title,
  detail,
}: {
  tone: InsightTone;
  title: string;
  detail: string;
}) {
  const Icon =
    tone === "positive" ? CheckCircle2 : tone === "warning" ? AlertTriangle : Info;
  const cls =
    tone === "positive"
      ? "text-income"
      : tone === "warning"
      ? "text-expense"
      : "text-primary";
  return (
    <div className="flex gap-3 rounded-lg border p-3">
      <Icon className={cn("mt-0.5 size-5 shrink-0", cls)} />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
