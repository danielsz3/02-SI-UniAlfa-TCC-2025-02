import * as React from 'react';
import {
    Toolbar,
    useRecordContext,
    ToolbarProps,
} from 'react-admin';
import { Box } from '@mui/material';

interface CustomToolbarProps extends ToolbarProps {
    leftButtons?: React.ReactNode; 
    rightButtons?: React.ReactNode;
    spacing?: number;
}

export const CustomToolbar: React.FC<CustomToolbarProps> = ({
    leftButtons,
    rightButtons,
    spacing = 1.5,
    ...props
}) => {
    const record = useRecordContext();

    return (
        <Toolbar
            {...props}
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center',
                py: 1,
                ...props.sx,
            }}
        >
            {/* Lado Esquerdo */}
            <Box sx={{ display: 'flex', gap: spacing }}>
                {leftButtons}
            </Box>

            {/* Lado Direito */}
            <Box sx={{ display: 'flex', gap: spacing }}>
                {rightButtons}
            </Box>
        </Toolbar>
    );
};
