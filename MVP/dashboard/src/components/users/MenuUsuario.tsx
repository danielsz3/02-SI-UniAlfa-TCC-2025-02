import React from 'react';
import { UserMenu, MenuItemLink, Logout } from 'react-admin';
import SettingsIcon from '@mui/icons-material/Settings';

const MeuMenuUsuario: React.FC = () => (
    <UserMenu>
        <MenuItemLink
            to="/configuracoes"
            primaryText="Configurações"
            leftIcon={<SettingsIcon />}
        />
        <Logout />
    </UserMenu>
);

export default MeuMenuUsuario;