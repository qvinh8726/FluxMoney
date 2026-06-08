"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ArrowLeftRight,
  Wallet,
  Tags,
  PiggyBank,
  BarChart3,
  Sparkles,
  Settings,
  Repeat,
  Target,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

const nav = [
  { href: "/", label: "Lịch dòng tiền", icon: CalendarDays },
  { href: "/transactions", label: "Giao dịch", icon: ArrowLeftRight },
  { href: "/accounts", label: "Ví / Tài khoản", icon: Wallet },
  { href: "/categories", label: "Danh mục", icon: Tags },
  { href: "/budgets", label: "Ngân sách", icon: PiggyBank },
  { href: "/savings", label: "Mục tiêu", icon: Target },
  { href: "/recurring", label: "Định kỳ", icon: Repeat },
  { href: "/reports", label: "Báo cáo", icon: BarChart3 },
  { href: "/ai", label: "AI Phân tích", icon: Sparkles },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

// Các trang đứng riêng, không dùng khung sidebar và không nạp dữ liệu user.
const STANDALONE_PATHS = ["/login", "/terms", "/privacy"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const loaded = useStore((s) => s.loaded);
  const loadAll = useStore((s) => s.loadAll);

  const standalone = STANDALONE_PATHS.includes(pathname);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!standalone) {
      loadAll();
    }
  }, [standalone, loadAll]);

  // Trang đứng riêng không dùng khung sidebar.
  if (standalone) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Sidebar (mobile drawer) */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r bg-card shadow-xl">
            <SidebarContent pathname={pathname} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Mở menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/logo.png" alt="FluxMoney" className="size-6 rounded" />
            <span className="font-semibold">FluxMoney</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {loaded ? (
            children
          ) : (
            <div className="flex h-[60vh] items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    useStore.getState().clear();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <img src="/logo.png" alt="FluxMoney" className="size-7 rounded" />
        <span className="text-lg font-bold tracking-tight">FluxMoney</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        {email && (
          <p className="mb-2 truncate px-2 text-xs text-muted-foreground" title={email}>
            {email}
          </p>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={signOut}
        >
          <LogOut className="size-5" /> Đăng xuất
        </Button>
        <div className="mt-2 flex items-center gap-2 px-2 text-xs text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground hover:underline">
            Điều khoản
          </Link>
          <span aria-hidden>·</span>
          <Link href="/privacy" className="hover:text-foreground hover:underline">
            Quyền riêng tư
          </Link>
        </div>
      </div>
    </>
  );
}
