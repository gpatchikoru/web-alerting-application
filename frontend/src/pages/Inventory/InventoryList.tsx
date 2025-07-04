import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalPharmacy as MedicineIcon,
  Kitchen as KitchenIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { inventoryApi } from '../../services/api';
import { InventoryItem } from '../../services/api';

const InventoryList: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.getAll({ limit: 1000 });
      setItems(response.data?.data || []);
    } catch (err) {
      setError('Failed to load inventory');
      console.error('Inventory error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await inventoryApi.delete(id);
        setItems(items.filter(item => item.id !== id));
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete item');
      }
    }
  };

  const filteredItems = items.filter(item => {
    const matchesType = filterType === 'all' || item.itemType === filterType;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getStockColor = (item: InventoryItem) => {
    if (item.currentCount === 0) return 'error';
    if (item.currentCount <= item.lowStockThreshold) return 'warning';
    return 'success';
  };

  const getStockLabel = (item: InventoryItem) => {
    if (item.currentCount === 0) return 'Out of Stock';
    if (item.currentCount <= item.lowStockThreshold) return 'Low Stock';
    return 'In Stock';
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Inventory
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Inventory
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Inventory ({filteredItems.length} items)
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/inventory/new')}
        >
          Add Item
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Search items"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or description..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Type</InputLabel>
                <Select
                  value={filterType}
                  label="Filter by Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="all">All Items</MenuItem>
                  <MenuItem value="medicine">Medicines</MenuItem>
                  <MenuItem value="kitchen">Kitchen Items</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Inventory Grid */}
      <Grid container spacing={3}>
        {filteredItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center">
                    {item.itemType === 'medicine' ? (
                      <MedicineIcon color="primary" sx={{ mr: 1 }} />
                    ) : (
                      <KitchenIcon color="secondary" sx={{ mr: 1 }} />
                    )}
                    <Typography variant="h6" component="div">
                      {item.name}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/inventory/${item.id}/edit`)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(item.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {item.description && (
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    {item.description}
                  </Typography>
                )}

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">
                    Stock: {item.currentCount} {item.unit}
                  </Typography>
                  <Chip
                    label={getStockLabel(item)}
                    color={getStockColor(item)}
                    size="small"
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">
                    Threshold: {item.lowStockThreshold} {item.unit}
                  </Typography>
                  <Chip
                    label={item.category}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                {item.itemType === 'medicine' && item.expiryDate && (
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">
                      Expires: {new Date(item.expiryDate).toLocaleDateString()}
                    </Typography>
                    {new Date(item.expiryDate) < new Date() && (
                      <Chip label="Expired" color="error" size="small" />
                    )}
                  </Box>
                )}

                {item.location && (
                  <Typography variant="body2" color="textSecondary">
                    Location: {item.location}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" textAlign="center" color="textSecondary">
              No items found
            </Typography>
            <Typography textAlign="center" color="textSecondary">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Add your first inventory item to get started'
              }
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default InventoryList; 