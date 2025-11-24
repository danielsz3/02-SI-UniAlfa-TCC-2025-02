import {
    List,
    useListContext,
    TextInput,
    DateInput,
} from 'react-admin'
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
} from '@mui/material'
import { Link } from 'react-router-dom'
import { useCreatePath } from 'react-admin'
import CustomDatePicker from '../datepicker/customDatePicker';

const CARD_HEIGHT = 250;

const filters = [
    <TextInput label="Título" source="titulo" size="small" alwaysOn />,
    <CustomDatePicker
        label="Criado a partir de"
        source="created_at_from"
        alwaysOn
        past
    />,
    <CustomDatePicker
        label="Criado até"
        source="created_at_to"
        alwaysOn
        past
        future
    />,
]


const EventoGrid = () => {
    const { data, isLoading } = useListContext()
    const createPath = useCreatePath()

    if (isLoading || !data) return null

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return (
        <Grid container spacing={3} sx={{ p: 2, backgroundColor: (theme) => theme.palette.background.default }}>
            {data.map((record) => {

                const dataFim = new Date(record.data_fim);
                dataFim.setHours(0, 0, 0, 0);

                const isEncerrado = dataFim < hoje;

                return (
                    <Grid key={record.id} size={{ xs: 12, lg: 3, md: 4, sm: 6 }} >
                        <Link
                            to={createPath({ resource: 'eventos', id: record.id, type: 'edit' })}
                            style={{ textDecoration: 'none' }}
                        >
                            <Card
                                sx={{
                                    position: 'relative',
                                    height: CARD_HEIGHT,
                                    overflow: 'hidden',
                                    borderRadius: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundImage: `url(${record.imagem?.src ||
                                            import.meta.env.VITE_API_URL + '/imagens/' + record.imagem})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        filter: isEncerrado ? 'grayscale(80%)' : 'none', // 80% em tons de cinza
                                        opacity: isEncerrado ? 0.6 : 1,               // Leve transparência
                                        transition: 'filter 0.3s ease, opacity 0.3s ease',
                                    }}
                                />
                                {isEncerrado && (
                                    <Chip
                                        label={'Encerrado'}
                                        sx={{
                                            position: 'absolute',
                                            top: 16,
                                            right: 16,
                                            zIndex: 1,
                                            bgcolor: '#404040',
                                            color: '#FFF',
                                            fontWeight: 'bold',
                                        }}
                                    />
                                )}
                                <CardContent
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        width: '100%',
                                        color: 'white',
                                        background:
                                            'linear-gradient(to top, rgba(0,0,0,0.7),rgba(0,0,0,0.7),rgba(0,0,0,0.7), rgba(255, 255, 255, 0))',
                                        padding: 2,
                                        pb: "1rem !important",
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        component="div"
                                        sx={{ fontWeight: 'bold' }}
                                    >
                                        {record.titulo}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        component="div"
                                    >
                                        {new Date(record.data_inicio).toLocaleDateString('pt-br')} - {new Date(record.data_fim).toLocaleDateString('pt-br')}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        component="div"
                                    >
                                        {record.local}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Link>
                    </Grid>
                )
            })}
        </Grid>
    )
}

const EventoList = () => {
    return (
        <>
            <List
                filters={filters}
                sort={{ field: 'data_inicio', order: 'DESC' }}
                sx={{
                    '& .RaList-content': {
                        boxShadow: 'none',
                    },
                }}
            >
                <EventoGrid />
            </List>
        </>
    )
}

export default EventoList
