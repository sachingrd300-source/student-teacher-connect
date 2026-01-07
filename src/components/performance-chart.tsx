"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartTooltipContent, ChartTooltip, ChartContainer } from "@/components/ui/chart"

export function PerformanceChart({ data }: { data: { name: string; score: number }[] }) {
    const chartConfig = {
      score: {
        label: "Score",
        color: "hsl(var(--primary))",
      },
    }
  
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Test Performance</CardTitle>
          <CardDescription>Recent test scores summary.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={{stroke: "hsl(var(--border))"}} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={{stroke: "hsl(var(--border))"}} tickFormatter={(value) => `${value}%`} />
                    <ChartTooltip 
                      cursor={false} 
                      content={<ChartTooltipContent 
                        indicator="dot"
                        labelClassName="font-bold font-body"
                        className="bg-card shadow-lg" 
                      />} 
                    />
                    <Bar dataKey="score" fill="var(--color-score)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    )
}
