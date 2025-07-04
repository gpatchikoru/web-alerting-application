import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Alert {
  id: string;
  type: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  itemId: string;
  itemName: string;
  itemType: string;
  currentCount?: number;
  threshold?: number;
  expiryDate?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  dismissedAt?: string;
}

interface AlertContextType {
  alerts: Alert[];
  activeAlerts: Alert[];
  addAlert: (alert: Alert) => void;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  removeAlert: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const activeAlerts = alerts.filter(alert => 
    alert.status === 'active' || alert.status === 'acknowledged'
  );

  const addAlert = (alert: Alert) => {
    setAlerts(prev => {
      // Check if alert already exists
      const exists = prev.find(a => a.id === alert.id);
      if (exists) {
        return prev.map(a => a.id === alert.id ? alert : a);
      }
      return [alert, ...prev];
    });
  };

  const updateAlert = (id: string, updates: Partial<Alert>) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === id ? { ...alert, ...updates } : alert
      )
    );
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const acknowledgeAlert = (id: string) => {
    updateAlert(id, { 
      status: 'acknowledged',
      acknowledgedAt: new Date().toISOString()
    });
  };

  const resolveAlert = (id: string) => {
    updateAlert(id, { 
      status: 'resolved',
      resolvedAt: new Date().toISOString()
    });
  };

  const dismissAlert = (id: string) => {
    updateAlert(id, { status: 'dismissed' });
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const value: AlertContextType = {
    alerts,
    activeAlerts,
    addAlert,
    updateAlert,
    removeAlert,
    acknowledgeAlert,
    resolveAlert,
    dismissAlert,
    clearAlerts
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
}; 