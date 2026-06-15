import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const colors = {
  Low: '#2f9e75',
  Medium: '#e4a534',
  High: '#d6575f',
}

const riskTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="chart-tooltip">
      <strong>{payload[0].name}</strong>
      <span>{payload[0].value} employees</span>
    </div>
  )
}

export function RiskDistributionChart({ riskCounts }) {
  const data = [
    { name: 'Low', value: riskCounts?.low || 0 },
    { name: 'Medium', value: riskCounts?.medium || 0 },
    { name: 'High', value: riskCounts?.high || 0 },
  ]
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <div className="chart-placeholder">
        No valid employee risk results are available for the latest batch.
      </div>
    )
  }

  return (
    <div className="risk-chart-wrap">
      <ResponsiveContainer width="100%" height={270}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={62}
            nameKey="name"
            outerRadius={92}
            paddingAngle={3}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell fill={colors[entry.name]} key={entry.name} />
            ))}
          </Pie>
          <Tooltip content={riskTooltip} />
          <Legend
            iconSize={9}
            iconType="circle"
            verticalAlign="bottom"
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="risk-chart-total">
        <strong>{total}</strong>
        <span>employees</span>
      </div>
    </div>
  )
}
