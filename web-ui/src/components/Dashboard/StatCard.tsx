import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { cn, formatNumber } from '../../utils/formatters';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon?: React.ReactNode;
  description?: string;
}

export function StatCard({ title, value, trend, icon, description }: StatCardProps) {
  const trendIcon = trend !== undefined ? (
    trend > 0 ? (
      <ArrowUp className="w-4 h-4" />
    ) : trend < 0 ? (
      <ArrowDown className="w-4 h-4" />
    ) : (
      <Minus className="w-4 h-4" />
    )
  ) : null;

  const trendColor = trend !== undefined ? (
    trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
  ) : '';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>
        {trend !== undefined && (
          <div className={cn('flex items-center text-sm mt-1', trendColor)}>
            {trendIcon}
            <span className="ml-1">{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
