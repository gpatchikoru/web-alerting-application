import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert as MuiAlert,
  Paper
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { inventoryApi, alertsApi, Alert } from '../../services/api';

interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  expiredItems: number;
  activeAlerts: number;
  medicines: number;
  kitchenItems: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStockItems: 0,
    expiredItems: 0,
    activeAlerts: 0,
    medicines: 0,
    kitchenItems: 0
  });
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load inventory data
      const [inventoryResponse, alertsResponse] = await Promise.all([
        inventoryApi.getAll({ limit: 1000 }),
        alertsApi.getActive()
      ]);

      const items = inventoryResponse.data?.data || [];
      const alerts = alertsResponse.data?.data || [];

      // Calculate statistics
      const medicines = items.filter(item => item.itemType === 'medicine');
      const kitchenItems = items.filter(item => item.itemType === 'kitchen');
      
      const lowStockItems = items.filter(item => 
        item.currentCount <= item.lowStockThreshold
      ).length;

      const expiredItems = medicines.filter(item => {
        if (!item.expiryDate) return false;
        return new Date(item.expiryDate) < new Date();
      }).length;

      setStats({
        totalItems: items.length,
        lowStockItems,
        expiredItems,
        activeAlerts: alerts.length,
        medicines: medicines.length,
        kitchenItems: kitchenItems.length
      });

      setRecentAlerts(alerts.slice(0, 5)); // Show last 5 alerts
      
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <MuiAlert severity="error">{error}</MuiAlert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Items"
            value={stats.totalItems}
            icon={<InventoryIcon sx={{ fontSize: 40 }} />}
            color="#1976d2"
            subtitle="In inventory"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock"
            value={stats.lowStockItems}
            icon={<WarningIcon sx={{ fontSize: 40 }} />}
            color="#ed6c02"
            subtitle="Need attention"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Expired Items"
            value={stats.expiredItems}
            icon={<ErrorIcon sx={{ fontSize: 40 }} />}
            color="#d32f2f"
            subtitle="Need disposal"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Alerts"
            value={stats.activeAlerts}
            icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
            color="#2e7d32"
            subtitle="Require action"
          />
        </Grid>
      </Grid>

      {/* Category Breakdown */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inventory by Category
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography>Medicines</Typography>
                <Chip label={stats.medicines} color="primary" />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography>Kitchen Items</Typography>
                <Chip label={stats.kitchenItems} color="secondary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stock Status
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography>In Stock</Typography>
                <Chip 
                  label={stats.totalItems - stats.lowStockItems} 
                  color="success" 
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography>Low Stock</Typography>
                <Chip 
                  label={stats.lowStockItems} 
                  color="warning" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Alerts */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Alerts
              </Typography>
              {recentAlerts.length === 0 ? (
                <Typography color="textSecondary">
                  No active alerts at the moment.
                </Typography>
              ) : (
                recentAlerts.map((alert) => (
                  <Paper key={alert.id} sx={{ p: 2, mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {alert.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {alert.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(alert.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                      <Chip 
                        label={alert.severity} 
                        color={
                          alert.severity === 'critical' ? 'error' :
                          alert.severity === 'high' ? 'warning' :
                          alert.severity === 'medium' ? 'info' : 'default'
                        }
                        size="small"
                      />
                    </Box>
                  </Paper>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 