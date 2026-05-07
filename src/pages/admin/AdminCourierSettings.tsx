import { useState, useEffect } from 'react';
import { Truck, Save, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCourierSettings, useSaveCourierSettings, useTestCourierConnection } from '@/hooks/useCourierSettings';
import { toast } from 'sonner';

export default function AdminCourierSettings() {
  const { data: settings, isLoading } = useCourierSettings('steadfast');
  const saveSettings = useSaveCourierSettings();
  const testConnection = useTestCourierConnection();

  const [formData, setFormData] = useState({
    enabled: false,
    api_base_url: 'https://portal.packzy.com/api/v1',
    api_key: '',
    api_secret: '',
    merchant_id: '',
    pickup_address: '',
    pickup_phone: '',
    default_weight: 0.5,
    cod_enabled: true,
    show_tracking_to_customer: false,
  });

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (settings) {
      setFormData({
        enabled: settings.enabled,
        api_base_url: settings.api_base_url || 'https://portal.packzy.com/api/v1',
        api_key: settings.api_key || '',
        api_secret: settings.api_secret || '',
        merchant_id: settings.merchant_id || '',
        pickup_address: settings.pickup_address || '',
        pickup_phone: settings.pickup_phone || '',
        default_weight: settings.default_weight || 0.5,
        cod_enabled: settings.cod_enabled,
        show_tracking_to_customer: settings.show_tracking_to_customer,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    await saveSettings.mutateAsync({
      provider: 'steadfast',
      ...formData,
    });
  };

  const handleTestConnection = async () => {
    setConnectionStatus('idle');
    try {
      const result = await testConnection.mutateAsync('steadfast');
      if (result.success) {
        setConnectionStatus('success');
        toast.success(`Connected! Balance: ${result.balance || 'N/A'} BDT`);
      } else {
        setConnectionStatus('error');
        toast.error(result.error || 'Connection failed');
      }
    } catch (error: any) {
      setConnectionStatus('error');
      toast.error(error.message || 'Connection failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Truck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Courier Integrations</h1>
          <p className="text-muted-foreground">Configure courier services for order delivery</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <img 
                  src="https://steadfast.com.bd/images/steadfast-logo.png" 
                  alt="Steadfast" 
                  className="h-6 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                Steadfast Courier
              </CardTitle>
              <CardDescription>
                Connect your Steadfast courier account to create and track parcels
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="enabled" className="text-sm">Enable</Label>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              API Configuration
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="api_base_url">API Base URL</Label>
              <Input
                id="api_base_url"
                value={formData.api_base_url}
                onChange={(e) => setFormData({ ...formData, api_base_url: e.target.value })}
                placeholder="https://portal.packzy.com/api/v1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Enter API key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api_secret">API Secret</Label>
                <Input
                  id="api_secret"
                  type="password"
                  value={formData.api_secret}
                  onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                  placeholder="Enter API secret"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="merchant_id">Merchant/Store ID (optional)</Label>
              <Input
                id="merchant_id"
                value={formData.merchant_id}
                onChange={(e) => setFormData({ ...formData, merchant_id: e.target.value })}
                placeholder="Your Steadfast merchant ID"
              />
            </div>
          </div>

          {/* Pickup Configuration */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Pickup Settings
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="pickup_address">Default Pickup Address</Label>
              <Input
                id="pickup_address"
                value={formData.pickup_address}
                onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                placeholder="Your store/warehouse address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup_phone">Pickup Phone</Label>
                <Input
                  id="pickup_phone"
                  value={formData.pickup_phone}
                  onChange={(e) => setFormData({ ...formData, pickup_phone: e.target.value })}
                  placeholder="+880..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_weight">Default Weight (kg)</Label>
                <Input
                  id="default_weight"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.default_weight}
                  onChange={(e) => setFormData({ ...formData, default_weight: parseFloat(e.target.value) || 0.5 })}
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Options
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="cod_enabled">Enable COD</Label>
                <p className="text-sm text-muted-foreground">Allow Cash on Delivery orders</p>
              </div>
              <Switch
                id="cod_enabled"
                checked={formData.cod_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, cod_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show_tracking">Show Tracking to Customers</Label>
                <p className="text-sm text-muted-foreground">Display tracking info on order confirmation</p>
              </div>
              <Switch
                id="show_tracking"
                checked={formData.show_tracking_to_customer}
                onCheckedChange={(checked) => setFormData({ ...formData, show_tracking_to_customer: checked })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-6 border-t border-border">
            <Button 
              onClick={handleSave} 
              disabled={saveSettings.isPending}
              className="min-w-[140px] bg-[#f59e0b] hover:bg-[#d97706] text-white border-none"
            >
              {saveSettings.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={testConnection.isPending || !formData.api_key || !formData.api_secret}
              className="min-w-[140px]"
            >
              {testConnection.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : connectionStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              ) : connectionStatus === 'error' ? (
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
