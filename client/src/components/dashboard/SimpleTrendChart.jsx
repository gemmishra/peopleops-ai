import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '../../utils/formatters.js'

const compactMoney = (value) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

const payrollTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((entry) => (
        <span key={entry.dataKey}>
          {entry.name}: {formatCurrency(entry.value)}
        </span>
      ))}
    </div>
  )
}

export function SimpleTrendChart({ batches }) {
  if (!batches?.length) {
    return (
      <div className="chart-placeholder">
        Upload payroll batches to build a gross-versus-net trend.
      </div>
    )
  }

  const data = [...batches].reverse().map((batch, index) => ({
    name: `Batch ${index + 1}`,
    fileName: batch.originalFileName,
    grossPay: batch.aggregateTotals.grossPay,
    netPay: batch.aggregateTotals.netPay,
  }))

  return (
    <ResponsiveContainer width="100%" height={270}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e8edf4" strokeDasharray="3 3" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="name"
          tick={{ fill: '#7a8697', fontSize: 11 }}
          tickLine={false}
        />
        <YAxis
          axisLine={false}
          tick={{ fill: '#7a8697', fontSize: 11 }}
          tickFormatter={compactMoney}
          tickLine={false}
          width={52}
        />
        <Tooltip content={payrollTooltip} />
        <Legend iconSize={9} iconType="circle" />
        <Bar
          dataKey="grossPay"
          fill="#9db7eb"
          name="Gross pay"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="netPay"
          fill="#2864dc"
          name="Net pay"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
