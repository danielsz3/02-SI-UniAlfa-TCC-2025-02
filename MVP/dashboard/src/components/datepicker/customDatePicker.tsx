import { useInput, type InputProps } from 'react-admin';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale/pt-BR';

type CustomDatePickerProps = InputProps & {
    label: string;
    future?: boolean;
};

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ source, label, ...props }) => {
    const { field, fieldState } = useInput({ source, ...props });

    const cleanMessage = (msg?: string) =>
        msg ? msg.replace(/^@@react-admin@@/, '').replace(/"/g, '') : undefined;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <DatePicker
                label={label}
                disableFuture={!props.future}
                value={field.value ? new Date(field.value) : null}
                onChange={field.onChange}
                sx={{ mb: 0}}
                slotProps={{
                    toolbar: {
                        toolbarFormat: "EEE, d 'de' MMM",
                    },
                    textField: {
                        fullWidth: true,
                        error: !!fieldState.error,
                        helperText: cleanMessage(fieldState.error?.message) || " ",
                        size: 'small',
                    },

                }}
                
            />
        </LocalizationProvider>
    );
};

export default CustomDatePicker;