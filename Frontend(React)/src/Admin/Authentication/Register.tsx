import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Typography, Paper, InputAdornment, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import API_URL from '../../config';
import { toast } from 'react-toastify';
import { Visibility, VisibilityOff } from "@mui/icons-material";

const IllustrationBox = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
  backgroundColor: '#f0f4f7'
}));

const FormBox = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: theme.spacing(4),
  minWidth: '300px'
}));

const AdminRegister: React.FC = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: ''
  });

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) =>
    /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);

  const clearError = (field: keyof typeof errors) =>
    setErrors(prev => ({ ...prev, [field]: '' }));

  const handleNameChange =
    (setter: React.Dispatch<React.SetStateAction<string>>, field: keyof typeof errors) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^[a-zA-Z\s]*$/.test(value)) setter(value);
        if (!value.trim())
          setErrors(prev => ({ ...prev, [field]: 'This field is required' }));
        else setErrors(prev => ({ ...prev, [field]: '' }));
      };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 10) setPhone(value);
    if (!value.trim())
      setErrors(prev => ({ ...prev, phone: 'This field is required' }));
    else setErrors(prev => ({ ...prev, phone: '' }));
  };

  const handleFieldChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    field: keyof typeof errors,
    validator?: (val: string) => boolean,
    errorMsg?: string
  ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setter(value);
      if (!value.trim())
        setErrors(prev => ({ ...prev, [field]: 'This field is required' }));
      else if (validator && !validator(value))
        setErrors(prev => ({ ...prev, [field]: errorMsg || 'Invalid input' }));
      else setErrors(prev => ({ ...prev, [field]: '' }));
    };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      firstName: !firstName.trim() ? 'First Name is required' : '',
      lastName: !lastName.trim() ? 'Last Name is required' : '',
      username: !username.trim() ? 'Username is required' : '',
      phone: !phone.trim() ? 'Phone is required' : '',
      email: !email.trim() ? 'Email is required' : !validateEmail(email) ? 'Invalid email format' : '',
      password: !password.trim() ? 'Password is required' : !validatePassword(password) ? 'Minimum 8 chars, 1 uppercase & 1 special char' : '',
      confirmPassword: confirmPassword !== password ? "Passwords do not match" : "",
      address: !address.trim() ? 'Address is required' : ''
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(e => e)) return;

    try {
      setLoading(true);
      await axios.post(`${API_URL}/admin-register`, {
        first_name: firstName,
        last_name: lastName, username,
        phone,
        email,
        password,
        address
      });
      toast.success("Registration Successful! Please login.", { autoClose: 3000 });
      setFirstName('');
      setLastName('');
      setUsername('');
      setPhone('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAddress('');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', justifyContent: 'center',
        alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(216deg, #eff2f3ff, #94b9d6ff)', padding: { xs: 2, sm: 4 } }} >
      <Paper elevation={3} sx={{ display: 'flex', width: '100%', maxWidth: 900, borderRadius: 2, overflow: 'hidden', flexDirection: { xs: 'column', md: 'row' } }} >
        <IllustrationBox sx={{ display: { xs: 'none', md: 'flex' }, background: 'linear-gradient(16deg, #eff2f3ff, #94b9d6ff)' }} >
          <img src="../../img/login-banner.png" alt="Illustration" style={{ maxWidth: '100%', height: 'auto' }} />
        </IllustrationBox>

        <FormBox>
          <Typography variant="h4" mb={5} textAlign="center">
            Register
          </Typography>

          <TextField label="First Name" fullWidth margin="normal" value={firstName}
            onChange={handleNameChange(setFirstName, 'firstName')} onFocus={() => clearError('firstName')} error={!!errors.firstName} helperText={errors.firstName} />

          <TextField label="Last Name" fullWidth margin="normal" value={lastName}
            onChange={handleNameChange(setLastName, 'lastName')} onFocus={() => clearError('lastName')} error={!!errors.lastName} helperText={errors.lastName} />

          <TextField label="Username" fullWidth margin="normal"
            value={username} onChange={handleFieldChange(setUsername, 'username')} onFocus={() => clearError('username')} error={!!errors.username} helperText={errors.username} />
          <TextField label="Phone" fullWidth
            margin="normal" value={phone} onChange={handlePhoneChange} onFocus={() => clearError('phone')} error={!!errors.phone} helperText={errors.phone} />
          <TextField label="Email" fullWidth margin="normal" value={email} onChange={handleFieldChange(setEmail, 'email', validateEmail, 'Invalid email format')}
            onFocus={() => clearError('email')} error={!!errors.email} helperText={errors.email} />

          <Box display="flex" gap={2}>
            <TextField label="Password" type={showPassword ? "text" : "password"} fullWidth margin="normal" value={password}
              onChange={handleFieldChange(setPassword, "password", validatePassword, "Minimum 8 chars, 1 uppercase & 1 special char"
              )} onFocus={() => clearError('password')} error={!!errors.password} helperText={errors.password} InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>)
              }} />

            <TextField label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"} fullWidth margin="normal" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => clearError('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword} InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>)
              }} />
          </Box>

          <TextField label="Address" fullWidth margin="normal" value={address} onChange={handleFieldChange(setAddress, 'address')} onFocus={() => clearError('address')} error={!!errors.address} helperText={errors.address} />

          <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{ mt: 4 }} >
            {loading ? "Registering..." : "REGISTER"}
          </Button>
        </FormBox>
      </Paper>
    </Box>
  );
};

export default AdminRegister;
