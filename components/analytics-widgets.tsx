"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const dummyData = [
  { date: "2023-06-01", price: 1.2, volume: 1000, invested: 100 },
  { date: "2023-06-02", price: 1.3, volume: 1200, invested: 200 },
  { date: "2023-06-03", price: 1.1, volume: 800, invested: 300 },
  { date: "2023-06-04", price: 1.4, volume: 1500, invested: 400 },
  { date: "2023-06-05", price: 1.5, volume: 2000, invested: 500 },
  { date: "2023-06-06", price: 1.6, volume: 1800, invested: 600 },
  { date: "2023-06-07", price: 1.4, volume: 1600, invested: 700 },
]

export function AnalyticsWidgets() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">7.00 SOL</div>
          <p className="text-xs text-muted-foreground">+0.5 SOL from last transaction</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tokens Acquired</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">4,832</div>
          <p className="text-xs text-muted-foreground">+350 from last transaction</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Buy Price</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0.00145 SOL</div>
          <p className="text-xs text-muted-foreground">-0.00005 SOL from last transaction</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Market Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0.12%</div>
          <p className="text-xs text-muted-foreground">+0.01% from last transaction</p>
        </CardContent>
      </Card>
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dummyData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Volume vs Investment</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dummyData}>
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="volume" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="invested" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

