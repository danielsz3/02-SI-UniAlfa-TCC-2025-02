// Funções helper
import { format } from 'date-fns';

/**
 * Formata um objeto Date para uma string.
 */
export const formatDate = (date: Date | null): string | null => {
    if (!date || !(date instanceof Date)) return null;
    try {
        return format(date, 'dd/MM/yyyy');
    } catch (error) {
        console.error('Data inválida:', date, error);
        return null;
    }
};

/**
 * Formata um número para moeda BRL (R$).
 */
export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};