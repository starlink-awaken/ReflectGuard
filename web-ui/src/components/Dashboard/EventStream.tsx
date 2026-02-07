import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Activity, AlertCircle, CheckCircle, Info } from 'lucide-react';

const WS_URL = import.meta.env.DEV ? 'ws://localhost:3000/ws' : `ws://${window.location.host}/ws`;

interface Event {
  id: string;
  type: 'check' | 'violation' | 'retro' | 'info';
  message: string;
  timestamp: string;
}

const EVENT_ICONS = {
  check: CheckCircle,
  violation: AlertCircle,
  retro: Activity,
  info: Info,
};

const EVENT_COLORS = {
  check: 'text-green-600',
  violation: 'text-red-600',
  retro: 'text-blue-600',
  info: 'text-gray-600',
};

export function EventStream() {
  const [events, setEvents] = useState<Event[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log('[EventStream] WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle different message types
        if (data.type === 'event') {
          const newEvent: Event = {
            id: data.id || `${Date.now()}-${Math.random()}`,
            type: data.eventType || 'info',
            message: data.message,
            timestamp: data.timestamp || new Date().toISOString(),
          };

          setEvents((prev) => [newEvent, ...prev].slice(0, 10)); // Keep last 10 events
        }
      } catch (error) {
        console.error('[EventStream] Failed to parse message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[EventStream] WebSocket error:', error);
      setConnected(false);
    };

    ws.onclose = () => {
      console.log('[EventStream] WebSocket disconnected');
      setConnected(false);
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-medium">实时事件流</CardTitle>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {connected ? '已连接' : '未连接'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {events.length > 0 ? (
            events.map((event) => {
              const Icon = EVENT_ICONS[event.type];
              const colorClass = EVENT_COLORS[event.type];

              return (
                <div key={event.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorClass}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{event.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(event.timestamp).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              {connected ? '等待事件...' : '尝试连接中...'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
