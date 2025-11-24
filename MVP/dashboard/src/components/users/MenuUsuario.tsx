import React from 'react';
import { UserMenu, Logout } from 'react-admin';
import { Avatar, Typography } from '@mui/material';

const getUserImageFromLocalStorage = () => {
    const userString = localStorage.getItem('user');
    if (!userString) return undefined;
    const user = JSON.parse(userString);
    const imageUrl = user.imagem ? `${import.meta.env.VITE_API_URL}/imagens/${user.imagem}` : undefined;
    return imageUrl;
}

const getNameUserFromLocalStorage = () => {
    const userString = localStorage.getItem('user');
    if (!userString) return undefined;
    const user = JSON.parse(userString);
    return user.nome;
}

const MeuMenuUsuario = () => (
    <>
        {getNameUserFromLocalStorage()}
        <UserMenu
            icon={
                <Avatar
                    sx={{
                        height: 30,
                        width: 30,
                    }}
                    src={getUserImageFromLocalStorage()}
                />
            }
        >
            <Logout />
        </UserMenu>
    </>
);

export default MeuMenuUsuario;