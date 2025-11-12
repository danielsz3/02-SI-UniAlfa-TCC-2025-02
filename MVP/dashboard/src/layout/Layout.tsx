import React from 'react';
import {
    Layout as LayoutRa,
    AppBar,
    type AppBarProps,
    type LayoutProps,
    type MenuProps,
    Menu,
    MenuItemLink
} from 'react-admin';
import MenuUsuario from '../components/users/MenuUsuario';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

const MinhaAppBar: React.FC<AppBarProps> = (props) => (
    <AppBar {...props} userMenu={<MenuUsuario />} />
);

const CustomMenu: React.FC<MenuProps> = (props) => (
    <Menu {...props}>
        <MenuItemLink 
            to="/"
            primaryText="Dashboard"
            leftIcon={<AutoGraphIcon />}
        />
        <MenuItemLink
            to="/ongs/edit/1"
            primaryText="ONG"
            leftIcon={<AccountBalanceIcon />}
        />

        <Menu.ResourceItems />
    </Menu>
);

const Layout: React.FC<LayoutProps> = (props) => (
    <LayoutRa {...props} appBar={MinhaAppBar} menu={CustomMenu} />
);

export default Layout;