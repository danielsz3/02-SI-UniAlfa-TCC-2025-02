import { useLogin, useNotify, Notification } from 'react-admin';
import { useState } from 'react';
import {
    TextField,
    Button,
    Box,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Grid, // Grid v2
    IconButton,
    InputAdornment
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export const LoginPage = () => {
    const login = useLogin();
    const notify = useNotify();

    const [formState, setFormState] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    // URL da imagem para facilitar a reutilização
    const bgImage = 'url(https://images.unsplash.com/vector-1762815717043-b2c4678999ee?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)';

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        login(formState)
            .then(() => {
                notify('Login realizado com sucesso!');
            })
            .catch((error) => {
                setLoading(false);
                if (error && error.message === 'Permissão insuficiente') {
                    setError('Acesso negado: Usuários comuns não podem acessar esta área.');
                } else {
                    setError('Credenciais inválidas.');
                }
            });
    };

    return (
        <Grid
            container
            component="main"
            sx={{
                height: '100vh',
                width: '100vw',
                overflow: 'hidden',
                backgroundImage: { xs: bgImage, md: 'none' },
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >

            {/* ITEM DA ESQUERDA: Imagem (Apenas Desktop) */}
            <Grid
                size={{ md: 9 }}
                sx={{
                    display: { xs: 'none', md: 'block' },
                    backgroundImage: bgImage,
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: (t) =>
                        t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            <Grid
                size={{ xs: 12, md: 3 }}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: { xs: 'transparent', md: 'background.paper' },
                }}
            >
                {/* O CARD DO LOGIN */}
                <Paper
                    elevation={6}
                    square={false}
                    sx={{
                        width: { xs: '90%', sm: '400px', md: '100%' },
                        height: { xs: 'auto', md: '100%' },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 4,
                        boxShadow: { md: 'none' },
                        borderRadius: { md: 0 },
                        overflowY: 'auto'
                    }}
                >
                    <Box width="100%" maxWidth="400px">
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: "center" }}>
                            <img src='/logo.svg' width={100} />
                        </Box>
                        <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                            Bem-vindo
                        </Typography>
                        <Typography variant="body2" color="textSecondary" mb={3} sx={{ textAlign: 'center' }}>
                            Insira os seus dados para entrar no sistema
                        </Typography>

                        <form onSubmit={submit} noValidate style={{ width: '100%' }}>
                            <TextField
                                fullWidth
                                label="E-mail / Usuário"
                                name="username"
                                margin="normal"
                                value={formState.email}
                                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                                required
                                autoFocus
                            />

                            <TextField
                                fullWidth
                                label="Senha"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                margin="normal"
                                value={formState.password}
                                onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                                required
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={handleClickShowPassword}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }
                                }}
                            />

                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                disabled={loading}
                                sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem' }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
                            </Button>
                        </form>
                    </Box>
                </Paper>
            </Grid>
            <Notification />
        </Grid>
    );
};