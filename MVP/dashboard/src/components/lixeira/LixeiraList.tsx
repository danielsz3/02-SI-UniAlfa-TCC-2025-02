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


const Lixeira = () => {
    const { data, isLoading } = useListContext()

    if (isLoading || !data) return null

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return (
        <Grid container spacing={3} sx={{ p: 2, backgroundColor: (theme) => theme.palette.background.default }}>
            {data.map((record) => {

               

                return (
                    <Grid key={record.id} size={{ xs: 12, lg: 3, md: 4, sm: 6 }} >

                        <Card
                            sx={{
                                position: 'relative',
                                height: CARD_HEIGHT,
                                overflow: 'hidden',
                                borderRadius: 2,
                            }}
                        >

                        </Card>
                    </Grid>
                )
            })}
        </Grid>
    )
}

const LixeixaList = () => {
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
                <Lixeira />
            </List>
        </>
    )
}

export default LixeixaList
