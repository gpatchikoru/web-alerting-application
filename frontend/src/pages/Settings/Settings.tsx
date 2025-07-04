import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface SettingsData {
  // Alert Settings
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enableWebNotifications: boolean;
  alertCheckInterval: number;
  
  // Inventory Settings
  defaultLowStockThreshold: number;
  enableExpiryAlerts: boolean;
  expiryAlertDays: number;
  
  // System Settings
  autoBackup: boolean;
  backupInterval: number;
  enableLogging: boolean;
  logLevel: string;
  
  // Notification Methods
  notificationMethods: string[];
}

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newNotificationMethod, setNewNotificationMethod] = useState('');

  const [settings, setSettings] = useState<SettingsData>({
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    enableWebNotifications: true,
    alertCheckInterval: 300,
    defaultLowStockThreshold: 5,
    enableExpiryAlerts: true,
    expiryAlertDays: 30,
    autoBackup: true,
    backupInterval: 24,
    enableLogging: true,
    logLevel: 'info',
    notificationMethods: ['web', 'email']
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In a real app, this would load from API
      // For now, we'll use default values
      console.log('Loading settings...');
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // In a real app, this would save to API
      console.log('Saving settings:', settings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      enableEmailNotifications: true,
      enableSMSNotifications: false,
      enableWebNotifications: true,
      alertCheckInterval: 300,
      defaultLowStockThreshold: 5,
      enableExpiryAlerts: true,
      expiryAlertDays: 30,
      autoBackup: true,
      backupInterval: 24,
      enableLogging: true,
      logLevel: 'info',
      notificationMethods: ['web', 'email']
    });
    setSuccess('Settings reset to defaults');
  };

  const addNotificationMethod = () => {
    if (newNotificationMethod.trim() && !settings.notificationMethods.includes(newNotificationMethod.trim())) {
      handleSettingChange('notificationMethods', [...settings.notificationMethods, newNotificationMethod.trim()]);
      setNewNotificationMethod('');
    }
  };

  const removeNotificationMethod = (method: string) => {
    handleSettingChange('notificationMethods', settings.notificationMethods.filter(m => m !== method));
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Alert Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alert Settings
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableEmailNotifications}
                    onChange={(e) => handleSettingChange('enableEmailNotifications', e.target.checked)}
                  />
                }
                label="Enable Email Notifications"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableSMSNotifications}
                    onChange={(e) => handleSettingChange('enableSMSNotifications', e.target.checked)}
                  />
                }
                label="Enable SMS Notifications"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableWebNotifications}
                    onChange={(e) => handleSettingChange('enableWebNotifications', e.target.checked)}
                  />
                }
                label="Enable Web Notifications"
              />

              <TextField
                fullWidth
                label="Alert Check Interval (seconds)"
                type="number"
                value={settings.alertCheckInterval}
                onChange={(e) => handleSettingChange('alertCheckInterval', parseInt(e.target.value) || 300)}
                margin="normal"
                inputProps={{ min: 60, max: 3600 }}
                helperText="How often to check for new alerts (60-3600 seconds)"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Inventory Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inventory Settings
              </Typography>
              
              <TextField
                fullWidth
                label="Default Low Stock Threshold"
                type="number"
                value={settings.defaultLowStockThreshold}
                onChange={(e) => handleSettingChange('defaultLowStockThreshold', parseInt(e.target.value) || 5)}
                margin="normal"
                inputProps={{ min: 1, max: 100 }}
                helperText="Default threshold for low stock alerts"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableExpiryAlerts}
                    onChange={(e) => handleSettingChange('enableExpiryAlerts', e.target.checked)}
                  />
                }
                label="Enable Expiry Alerts"
              />

              <TextField
                fullWidth
                label="Expiry Alert Days"
                type="number"
                value={settings.expiryAlertDays}
                onChange={(e) => handleSettingChange('expiryAlertDays', parseInt(e.target.value) || 30)}
                margin="normal"
                inputProps={{ min: 1, max: 365 }}
                helperText="Days before expiry to send alerts"
                disabled={!settings.enableExpiryAlerts}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Settings
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoBackup}
                    onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                  />
                }
                label="Enable Auto Backup"
              />

              <TextField
                fullWidth
                label="Backup Interval (hours)"
                type="number"
                value={settings.backupInterval}
                onChange={(e) => handleSettingChange('backupInterval', parseInt(e.target.value) || 24)}
                margin="normal"
                inputProps={{ min: 1, max: 168 }}
                helperText="How often to create backups (1-168 hours)"
                disabled={!settings.autoBackup}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableLogging}
                    onChange={(e) => handleSettingChange('enableLogging', e.target.checked)}
                  />
                }
                label="Enable System Logging"
              />

              <TextField
                fullWidth
                select
                label="Log Level"
                value={settings.logLevel}
                onChange={(e) => handleSettingChange('logLevel', e.target.value)}
                margin="normal"
                disabled={!settings.enableLogging}
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </TextField>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Methods */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notification Methods
              </Typography>
              
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  label="Add notification method"
                  value={newNotificationMethod}
                  onChange={(e) => setNewNotificationMethod(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNotificationMethod())}
                  size="small"
                />
                <Button
                  variant="outlined"
                  onClick={addNotificationMethod}
                  disabled={!newNotificationMethod.trim()}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>

              <List dense>
                {settings.notificationMethods.map((method) => (
                  <ListItem key={method}>
                    <ListItemText primary={method} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => removeNotificationMethod(method)}
                        disabled={method === 'web' || method === 'email'}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              <Typography variant="caption" color="textSecondary">
                Web and email methods cannot be removed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  startIcon={<RefreshIcon />}
                  disabled={saving}
                >
                  Reset to Defaults
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings; 