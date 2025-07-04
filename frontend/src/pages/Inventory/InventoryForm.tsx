import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  LinearProgress,
  Alert,
  Divider
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryApi } from '../../services/api';

interface InventoryFormData {
  name: string;
  description: string;
  currentCount: number;
  lowStockThreshold: number;
  itemType: 'medicine' | 'kitchen';
  category: string;
  unit: string;
  location: string;
  notes: string;
  dosageForm: string;
  strength: string;
  expiryDate: string;
  manufacturer: string;
  prescriptionRequired: boolean;
  sideEffects: string[];
  instructions: string;
  brand: string;
  nutritionalInfo: any;
}

const InventoryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sideEffectInput, setSideEffectInput] = useState('');

  const [formData, setFormData] = useState<InventoryFormData>({
    name: '',
    description: '',
    currentCount: 0,
    lowStockThreshold: 5,
    itemType: 'kitchen',
    category: '',
    unit: '',
    location: '',
    notes: '',
    dosageForm: '',
    strength: '',
    expiryDate: '',
    manufacturer: '',
    prescriptionRequired: false,
    sideEffects: [],
    instructions: '',
    brand: '',
    nutritionalInfo: {}
  });

  useEffect(() => {
    if (isEditing && id) {
      loadItem();
    }
  }, [id, isEditing]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.getById(id!);
      const item = response.data?.data;
      
      if (item) {
        setFormData({
          name: item.name,
          description: item.description || '',
          currentCount: item.currentCount,
          lowStockThreshold: item.lowStockThreshold,
          itemType: item.itemType,
          category: item.category,
          unit: item.unit,
          location: item.location || '',
          notes: item.notes || '',
          dosageForm: item.dosageForm || '',
          strength: item.strength || '',
          expiryDate: item.expiryDate || '',
          manufacturer: item.manufacturer || '',
          prescriptionRequired: item.prescriptionRequired || false,
          sideEffects: item.sideEffects || [],
          instructions: item.instructions || '',
          brand: item.brand || '',
          nutritionalInfo: item.nutritionalInfo || {}
        });
      }
    } catch (err) {
      setError('Failed to load item');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof InventoryFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSideEffectAdd = () => {
    if (sideEffectInput.trim()) {
      setFormData(prev => ({
        ...prev,
        sideEffects: [...prev.sideEffects, sideEffectInput.trim()]
      }));
      setSideEffectInput('');
    }
  };

  const handleSideEffectRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sideEffects: prev.sideEffects.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.unit) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isEditing && id) {
        await inventoryApi.update(id, formData);
      } else {
        await inventoryApi.create(formData);
      }

      navigate('/inventory');
    } catch (err) {
      setError('Failed to save item');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/inventory');
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          {isEditing ? 'Edit Item' : 'Add New Item'}
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEditing ? 'Edit Item' : 'Add New Item'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name *"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Item Type *</InputLabel>
                  <Select
                    value={formData.itemType}
                    label="Item Type *"
                    onChange={(e) => handleInputChange('itemType', e.target.value)}
                  >
                    <MenuItem value="medicine">Medicine</MenuItem>
                    <MenuItem value="kitchen">Kitchen Item</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Category *"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unit *"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>

              {/* Stock Information */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Stock Information
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Current Count"
                  type="number"
                  value={formData.currentCount}
                  onChange={(e) => handleInputChange('currentCount', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Low Stock Threshold"
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>

              {/* Medicine-specific fields */}
              {formData.itemType === 'medicine' && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Medicine Details
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Dosage Form"
                      value={formData.dosageForm}
                      onChange={(e) => handleInputChange('dosageForm', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Strength"
                      value={formData.strength}
                      onChange={(e) => handleInputChange('strength', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Expiry Date"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Brand"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.prescriptionRequired}
                          onChange={(e) => handleInputChange('prescriptionRequired', e.target.checked)}
                        />
                      }
                      label="Prescription Required"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Instructions"
                      value={formData.instructions}
                      onChange={(e) => handleInputChange('instructions', e.target.value)}
                      multiline
                      rows={3}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Side Effects
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <TextField
                        label="Add side effect"
                        value={sideEffectInput}
                        onChange={(e) => setSideEffectInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSideEffectAdd())}
                        size="small"
                      />
                      <Button
                        variant="outlined"
                        onClick={handleSideEffectAdd}
                        disabled={!sideEffectInput.trim()}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {formData.sideEffects.map((effect, index) => (
                        <Chip
                          key={index}
                          label={effect}
                          onDelete={() => handleSideEffectRemove(index)}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                </>
              )}

              {/* Kitchen-specific fields */}
              {formData.itemType === 'kitchen' && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Kitchen Item Details
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nutritional Information (JSON)"
                      value={JSON.stringify(formData.nutritionalInfo, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          handleInputChange('nutritionalInfo', parsed);
                        } catch (err) {
                          // Invalid JSON, keep as string
                        }
                      }}
                      multiline
                      rows={4}
                      helperText="Enter nutritional information as JSON (optional)"
                    />
                  </Grid>
                </>
              )}

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (isEditing ? 'Update Item' : 'Add Item')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InventoryForm; 