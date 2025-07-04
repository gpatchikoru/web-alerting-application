import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  LinearProgress,
  Alert as MuiAlert,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { alertsApi } from '../../services/api';
import { Alert as AlertType } from '../../services/api';

const AlertLog: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertsApi.getAll({ limit: 100 });
      setAlerts(response.data?.data || []);
    } catch (err) {
      setError('Failed to load alerts');
      console.error('Alerts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alert: AlertType) => {
    try {
      await alertsApi.acknowledge(alert.id, { acknowledgedBy: 'User' });
      setAlerts(alerts.map(a => 
        a.id === alert.id 
          ? { ...a, status: 'acknowledged' }
          : a
      ));
    } catch (err) {
      console.error('Acknowledge error:', err);
      setError('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (alert: AlertType) => {
    try {
      await alertsApi.resolve(alert.id, { resolvedBy: 'User' });
      setAlerts(alerts.map(a => 
        a.id === alert.id 
          ? { ...a, status: 'resolved' }
          : a
      ));
    } catch (err) {
      console.error('Resolve error:', err);
      setError('Failed to resolve alert');
    }
  };

  const handleDismiss = async (alert: AlertType) => {
    try {
      await alertsApi.dismiss(alert.id);
      setAlerts(alerts.map(a => 
        a.id === alert.id 
          ? { ...a, status: 'dismissed' }
          : a
      ));
    } catch (err) {
      console.error('Dismiss error:', err);
      setError('Failed to dismiss alert');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <WarningIcon color="warning" />;
      case 'medium':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="action" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'error';
      case 'acknowledged':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'dismissed':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Alert Log
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Alert Log
        </Typography>
        <MuiAlert severity="error">{error}</MuiAlert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Alert Log ({alerts.length} alerts)
      </Typography>

      <Grid container spacing={3}>
        {alerts.map((alert) => (
          <Grid item xs={12} key={alert.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" flex={1}>
                    {getSeverityIcon(alert.severity)}
                    <Box ml={2} flex={1}>
                      <Typography variant="h6" component="div">
                        {alert.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {alert.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(alert.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedAlert(alert);
                        setDialogOpen(true);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    {alert.status === 'active' && (
                      <>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleAcknowledge(alert)}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDismiss(alert)}
                        >
                          <CancelIcon />
                        </IconButton>
                      </>
                    )}
                    {alert.status === 'acknowledged' && (
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleResolve(alert)}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip
                    label={alert.severity}
                    color={getSeverityColor(alert.severity)}
                    size="small"
                  />
                  <Chip
                    label={alert.status}
                    color={getStatusColor(alert.status)}
                    size="small"
                  />
                  <Chip
                    label={alert.type}
                    variant="outlined"
                    size="small"
                  />
                  {alert.currentCount !== undefined && (
                    <Chip
                      label={`Stock: ${alert.currentCount}`}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {alerts.length === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" textAlign="center" color="textSecondary">
              No alerts found
            </Typography>
            <Typography textAlign="center" color="textSecondary">
              Alerts will appear here when inventory items need attention
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Alert Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedAlert && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                {getSeverityIcon(selectedAlert.severity)}
                {selectedAlert.title}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedAlert.message}
              </Typography>
              
              <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                <Chip
                  label={selectedAlert.severity}
                  color={getSeverityColor(selectedAlert.severity)}
                  size="small"
                />
                <Chip
                  label={selectedAlert.status}
                  color={getStatusColor(selectedAlert.status)}
                  size="small"
                />
                <Chip
                  label={selectedAlert.type}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="textSecondary">
                <strong>Item:</strong> {selectedAlert.itemName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Type:</strong> {selectedAlert.itemType}
              </Typography>
              {selectedAlert.currentCount !== undefined && (
                <Typography variant="body2" color="textSecondary">
                  <strong>Current Count:</strong> {selectedAlert.currentCount}
                </Typography>
              )}
              {selectedAlert.threshold !== undefined && (
                <Typography variant="body2" color="textSecondary">
                  <strong>Threshold:</strong> {selectedAlert.threshold}
                </Typography>
              )}
              {selectedAlert.expiryDate && (
                <Typography variant="body2" color="textSecondary">
                  <strong>Expiry Date:</strong> {new Date(selectedAlert.expiryDate).toLocaleDateString()}
                </Typography>
              )}
              <Typography variant="body2" color="textSecondary">
                <strong>Created:</strong> {new Date(selectedAlert.createdAt).toLocaleString()}
              </Typography>
            </DialogContent>
            <DialogActions>
              {selectedAlert.status === 'active' && (
                <>
                  <Button
                    onClick={() => {
                      handleAcknowledge(selectedAlert);
                      setDialogOpen(false);
                    }}
                    color="warning"
                  >
                    Acknowledge
                  </Button>
                  <Button
                    onClick={() => {
                      handleDismiss(selectedAlert);
                      setDialogOpen(false);
                    }}
                    color="error"
                  >
                    Dismiss
                  </Button>
                </>
              )}
              {selectedAlert.status === 'acknowledged' && (
                <Button
                  onClick={() => {
                    handleResolve(selectedAlert);
                    setDialogOpen(false);
                  }}
                  color="success"
                >
                  Resolve
                </Button>
              )}
              <Button onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AlertLog; 