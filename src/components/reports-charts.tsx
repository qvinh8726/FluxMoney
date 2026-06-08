"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatCurrency } from "@/lib/utils";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
} as const;

export function MonthlyBarChart({
  data,
  baseCurrency,
}: {
  data: { label: string; income: number; expense: number; net: number }[];
  baseCurrency: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCompact(Number(v))}
          width={48}
        />
        <Tooltip
          formatter={(v: number) => formatCurrency(v, baseCurrency)}
          contentStyle={tooltipStyle}
        />
        <Legend />
        <Bar dataKey="income" name="Thu" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Chi" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPieChart({
  data,
  baseCurrency,
}: {
  data: { name: string; value: number; color: string }[];
  baseCurrency: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((c) => (
            <Cell key={c.name} fill={c.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => formatCurrency(v, baseCurrency)}
          contentStyle={tooltipStyle}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
