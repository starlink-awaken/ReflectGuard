import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { useSettingsStore } from '../stores/settingsStore';
import {
  Settings as SettingsIcon,
  Brain,
  User,
  Server,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function Settings() {
  const {
    modelConfig,
    userPreferences,
    systemConfig,
    hasUnsavedChanges,
    isSaving,
    lastSaved,
    error,
    updateModelConfig,
    updateUserPreferences,
    updateSystemConfig,
    saveSettings,
    resetToDefaults,
    clearError,
  } = useSettingsStore();

  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = async () => {
    await saveSettings();
  };

  const handleReset = () => {
    if (confirm('确定要恢复默认设置吗？这将丢失所有自定义配置。')) {
      resetToDefaults();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">设置</h1>
          <p className="text-sm text-muted-foreground mt-1">系统配置和偏好设置</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Status Bar */}
        {(error || lastSaved || hasUnsavedChanges) && (
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2">
              {error ? (
                <>
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                  <button
                    onClick={clearError}
                    className="ml-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    关闭
                  </button>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm">有未保存的更改</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    最后保存: {new Date(lastSaved!).toLocaleString('zh-CN')}
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="px-4 py-2 text-sm border rounded-md hover:bg-accent disabled:opacity-50 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                恢复默认
              </button>
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? '保存中...' : '保存设置'}
              </button>
            </div>
          </div>
        )}

        {/* Model Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              模型配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">AI 提供商</label>
              <select
                value={modelConfig.provider}
                onChange={(e) =>
                  updateModelConfig({
                    provider: e.target.value as 'anthropic' | 'openai' | 'custom',
                  })
                }
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI (GPT)</option>
                <option value="custom">自定义</option>
              </select>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">模型</label>
              <select
                value={modelConfig.model}
                onChange={(e) => updateModelConfig({ model: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                {modelConfig.provider === 'anthropic' && (
                  <>
                    <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
                    <option value="claude-opus-4-5-20251101">Claude Opus 4.5</option>
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                  </>
                )}
                {modelConfig.provider === 'openai' && (
                  <>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </>
                )}
                {modelConfig.provider === 'custom' && (
                  <option value="custom-model">自定义模型</option>
                )}
              </select>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={modelConfig.apiKey}
                  onChange={(e) => updateModelConfig({ apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 pr-10 border rounded-md bg-background"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                您的 API Key 将安全存储在本地浏览器中
              </p>
            </div>

            {/* Custom Endpoint */}
            {modelConfig.provider === 'custom' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">API 端点</label>
                <input
                  type="url"
                  value={modelConfig.apiEndpoint || ''}
                  onChange={(e) => updateModelConfig({ apiEndpoint: e.target.value })}
                  placeholder="https://api.example.com/v1"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
            )}

            {/* Advanced Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">Temperature</label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={modelConfig.temperature}
                  onChange={(e) =>
                    updateModelConfig({ temperature: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
                <p className="text-xs text-muted-foreground">控制输出的随机性 (0-2)</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">最大 Tokens</label>
                <input
                  type="number"
                  min="256"
                  max="32768"
                  step="256"
                  value={modelConfig.maxTokens}
                  onChange={(e) => updateModelConfig({ maxTokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
                <p className="text-xs text-muted-foreground">最大输出长度</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              用户偏好
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Theme */}
            <div className="space-y-2">
              <label className="text-sm font-medium">主题</label>
              <select
                value={userPreferences.theme}
                onChange={(e) =>
                  updateUserPreferences({ theme: e.target.value as 'light' | 'dark' | 'auto' })
                }
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="light">浅色</option>
                <option value="dark">深色</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="text-sm font-medium">语言</label>
              <select
                value={userPreferences.language}
                onChange={(e) =>
                  updateUserPreferences({ language: e.target.value as 'zh-CN' | 'en-US' })
                }
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">启用通知</label>
                <p className="text-xs text-muted-foreground">接收系统通知和告警</p>
              </div>
              <input
                type="checkbox"
                checked={userPreferences.notifications}
                onChange={(e) => updateUserPreferences({ notifications: e.target.checked })}
                className="w-4 h-4"
              />
            </div>

            {/* Auto Save */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">自动保存</label>
                <p className="text-xs text-muted-foreground">自动保存配置更改</p>
              </div>
              <input
                type="checkbox"
                checked={userPreferences.autoSave}
                onChange={(e) => updateUserPreferences({ autoSave: e.target.checked })}
                className="w-4 h-4"
              />
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              系统配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Base URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">API 基础 URL</label>
              <input
                type="text"
                value={systemConfig.apiBaseUrl}
                onChange={(e) => updateSystemConfig({ apiBaseUrl: e.target.value })}
                placeholder="/api/v1"
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>

            {/* WebSocket URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">WebSocket URL</label>
              <input
                type="text"
                value={systemConfig.websocketUrl}
                onChange={(e) => updateSystemConfig({ websocketUrl: e.target.value })}
                placeholder="/ws"
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>

            {/* Enable Analytics */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">启用分析</label>
                <p className="text-xs text-muted-foreground">收集匿名使用统计</p>
              </div>
              <input
                type="checkbox"
                checked={systemConfig.enableAnalytics}
                onChange={(e) => updateSystemConfig({ enableAnalytics: e.target.checked })}
                className="w-4 h-4"
              />
            </div>

            {/* Debug Mode */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">调试模式</label>
                <p className="text-xs text-muted-foreground">在控制台显示详细日志</p>
              </div>
              <input
                type="checkbox"
                checked={systemConfig.enableDebugMode}
                onChange={(e) => updateSystemConfig({ enableDebugMode: e.target.checked })}
                className="w-4 h-4"
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>提示：</strong> 所有设置都保存在本地浏览器中，不会上传到服务器。
              </p>
              <p>版本: v3.0.0 | 构建时间: 2026-02-07</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
