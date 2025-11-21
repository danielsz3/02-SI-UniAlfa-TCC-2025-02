import { useState } from 'react';
import { Box, IconButton, SxProps, Theme, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface CopyTextProps {
    text: string;
    label?: string; // Opcional: caso queiras mostrar um texto diferente do valor copiado
    sx?: SxProps<Theme>;
}

export const CopyText = ({ text, label, sx }: CopyTextProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
        try {
            event.stopPropagation();
            // API nativa do navegador para copiar
            await navigator.clipboard.writeText(text);

            // Ativa o estado de "copiado"
            setCopied(true);

            // Volta ao estado normal após 2 segundos
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (err) {
            console.error('Falha ao copiar:', err);
        }
    };

    return (
        <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{
                ...sx,
                borderRadius: 1,
                width: 'fit-content',
                zIndex: 999,
            }}
        >
            {label || text}

            <Tooltip title={copied ? "Copiado!" : "Copiar"}>
                <IconButton onClick={handleCopy} size="small" color={copied ? "success" : "default"}>
                    {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                </IconButton>
            </Tooltip>
        </Box>
    );
};