import {
    List,
    useListContext,
    SimpleList,
    TextInput,
} from 'react-admin'
import {
    Grid,
    Card,
    CardContent,
    Typography,
    useTheme,
    useMediaQuery,
    Box,
} from '@mui/material'
import { Link } from 'react-router-dom'
import { useCreatePath } from 'react-admin'

const CARD_HEIGHT = 250;

const filters = [
    <TextInput label="Nome" source="nome" size="small" alwaysOn />,
];

const ParceiroGrid = () => {
    const { data, isLoading } = useListContext()
    const createPath = useCreatePath()

    if (isLoading || !data) return null

    return (
        <Grid container spacing={3}
            sx={{
                p: 2,
                backgroundColor: (theme) => theme.palette.background.default,
            }}
        >
            {data.map((record) => (
                <Grid key={record.id} size={{ xs: 12, xl: 2, lg: 3, md: 4, sm: 6 }} >
                    <Link
                        to={createPath({ resource: 'parceiros', id: record.id, type: 'edit' })}
                        style={{ textDecoration: 'none' }}
                    >
                        <Card sx={{ position: 'relative', height: CARD_HEIGHT, overflow: 'hidden', borderRadius: 2 }}>
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: `url(${record.imagem.src || import.meta.env.VITE_API_URL + '/imagens/' + record.imagem})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            />
                            <CardContent
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    width: '100%',
                                    color: 'white',
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.7),rgba(0,0,0,0.7),rgba(0,0,0,0.7), rgba(255, 255, 255, 0))',
                                    padding: 2,
                                }}
                            >
                                <Typography variant="body1" component="div" sx={{ fontWeight: 'bold' }}>
                                    {record.nome}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Link>
                </Grid>
            ))}
        </Grid>
    )
}

const ParceiroList = () => {
    const theme = useTheme()
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

    return (
        <List filters={filters}
            sx={{
                '& .RaList-content': {
                    boxShadow: 'none',
                },
            }}
        >
            {isSmall ? (
                <SimpleList
                    leftAvatar={(record) => import.meta.env.VITE_API_URL + '/imagens/' + record.imagem}
                    primaryText={(record) => record.nome}
                    secondaryText={(record) => record.url_site}
                />
            ) : (
                <ParceiroGrid />
            )}
        </List>
    )
}

export default ParceiroList
