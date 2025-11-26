import { useLogin, Notification } from 'react-admin';
import { useState } from 'react';
import { TextField, Button, Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';

export const LoginPage = () => {
    const login = useLogin();
    const [formState, setFormState] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null); // limpa erro ao tentar novamente
        login(formState).catch(() => {
            setError('Credenciais inválidas');
            setLoading(false);
        });
    };

    return (
        <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="100vh"
            minWidth="100vw"
            bgcolor="#f5f5f5"
        >
            <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    Login
                </Typography>
                <form onSubmit={submit} noValidate>
                    <TextField
                        fullWidth
                        label="Usuário"
                        name="username"
                        margin="normal"
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        required
                    />
                    <TextField
                        fullWidth
                        label="Senha"
                        name="password"
                        type="password"
                        margin="normal"
                        value={formState.password}
                        onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                        required
                    />

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box mt={3} position="relative">
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
                        </Button>
                    </Box>
                </form>
                <Notification />
            </Paper>
        </Box>
    );
};
