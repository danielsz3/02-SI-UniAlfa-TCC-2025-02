// src/components/ExportActions.tsx

import React, { useState } from 'react';
import {
    useListContext,
    TopToolbar,
    FilterButton,
    CreateButton,
    RaRecord
} from 'react-admin';
import { Button, Menu, MenuItem } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- TIPO PARA A FUNÇÃO DE FORMATAÇÃO ---
type DataFormatter = (data: RaRecord[]) => Record<string, any>[];

// --- LÓGICA GENÉRICA DE XLSX ---
const exportarParaXLSX = (dataFormatada: Record<string, any>[], nomeArquivo: string) => {
    if (dataFormatada.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }
    const ws = XLSX.utils.json_to_sheet(dataFormatada);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
};

// --- LÓGICA GENÉRICA DE PDF ---
const exportarParaPDF = (dataFormatada: Record<string, any>[], nomeArquivo: string) => {
    if (dataFormatada.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }

    const headers = Object.keys(dataFormatada[0]);
    const body = dataFormatada.map(row => Object.values(row));

    const doc = new jsPDF({ orientation: 'landscape', format: 'a3' });
    autoTable(doc, {
        head: [headers],
        body: body,
    });
    doc.save(`${nomeArquivo}.pdf`);
};

// --- O MENU DE EXPORTAÇÃO DINÂMICO ---
// (Recebe o formatador e o nome do arquivo via props)
interface MenuExportacaoProps {
    formatter: DataFormatter;
    nomeArquivo: string;
}

const MenuExportacao = ({ formatter, nomeArquivo }: MenuExportacaoProps) => {
    const { data } = useListContext(); // Pega os dados brutos da lista
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // O handle agora USA o formatador que veio via props
    const handleExportXLSX = () => {
        const dataFormatada = formatter(data); // Formata os dados
        exportarParaXLSX(dataFormatada, nomeArquivo); // Exporta
        handleClose();
    };

    const handleExportPDF = () => {
        const dataFormatada = formatter(data); // Formata os dados
        exportarParaPDF(dataFormatada, nomeArquivo); // Exporta
        handleClose();
    };

    return (
        <>
            <Button
                aria-controls={open ? 'menu-exportacao' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                startIcon={<DownloadIcon />}
                size="small"
            >
                Exportar
            </Button>
            <Menu
                id="menu-exportacao"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                <MenuItem onClick={handleExportXLSX}>XLSX (Excel)</MenuItem>
                <MenuItem onClick={handleExportPDF}>PDF</MenuItem>
            </Menu>
        </>
    );
};

// --- O COMPONENTE DE AÇÕES CUSTOMIZADO ---
// (Também recebe o formatador e passa para o menu)
interface CustomListActionsProps {
    formatter: DataFormatter;
    nomeArquivo: string;
}

export const CustomListActions = ({ formatter, nomeArquivo }: CustomListActionsProps) => (
    <TopToolbar
        sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#F2F1F0 !important' }}
    >
        <FilterButton />
        <CreateButton />
        <MenuExportacao formatter={formatter} nomeArquivo={nomeArquivo} />
    </TopToolbar>
);