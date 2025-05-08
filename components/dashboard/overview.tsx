"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts"

type OverviewProps = {
  data: any[]
}

export function Overview({ data = [] }: OverviewProps) {
  // Usar dados simulados se não houver dados reais
  const chartData =
    data.length > 0
      ? data
      : [
          {
            name: "Sem dados",
            Ótimo: 0,
            Regular: 0,
            Ruim: 0,
          },
        ]

  // Calcular o total para cada período para poder mostrar percentuais
  const dataWithPercentages = chartData.map((item) => {
    const total = (item.Ótimo || 0) + (item.Regular || 0) + (item.Ruim || 0)
    return {
      ...item,
      ÓtimoPercent: total > 0 ? Math.round((item.Ótimo / total) * 100) : 0,
      RegularPercent: total > 0 ? Math.round((item.Regular / total) * 100) : 0,
      RuimPercent: total > 0 ? Math.round((item.Ruim / total) * 100) : 0,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={dataWithPercentages}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value, name) => {
            if (name.includes("Percent")) return null
            return [value, name]
          }}
        />
        <Legend />
        <Bar dataKey="Ótimo" fill="#4ade80" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="ÓtimoPercent" position="top" formatter={(value) => `${value}%`} />
        </Bar>
        <Bar dataKey="Regular" fill="#facc15" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="RegularPercent" position="top" formatter={(value) => `${value}%`} />
        </Bar>
        <Bar dataKey="Ruim" fill="#f87171" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="RuimPercent" position="top" formatter={(value) => `${value}%`} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
