import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Avatar
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface LoginForm {
  username: string;
  password: string;
}



const Login: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (field: keyof LoginForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (data.success) {
        // Use auth context to login
        login(data.data.token, data.data.user);
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Avatar sx={{ bgcolor: 'primary.main', mb: 2 }}>
                <LockIcon />
              </Avatar>
              <Typography variant="h4" component="h1" gutterBottom>
                Login
              </Typography>
              <Typography variant="body2" color="textSecondary" textAlign="center">
                Sign in to access your inventory dashboard
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Username"
                value={form.username}
                onChange={handleInputChange('username')}
                margin="normal"
                required
                autoComplete="username"
                autoFocus
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={form.password}
                onChange={handleInputChange('password')}
                margin="normal"
                required
                autoComplete="current-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>


          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Login; 