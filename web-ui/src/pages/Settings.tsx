import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">设置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            系统配置和偏好设置
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              系统设置
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <p className="text-lg mb-2">🚧 开发中</p>
                <p className="text-sm">Phase 3 Week 3-4 将完成此功能</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
