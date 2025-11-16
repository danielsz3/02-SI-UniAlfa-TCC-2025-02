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

const MinhaAppBar = (props: AppBarProps) => (
    <AppBar {...props} userMenu={<MenuUsuario />}  />
);

const CustomMenu = (props: MenuProps) => (
    <Menu {...props} className='no-print'>
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

const Layout = (props: LayoutProps) => (
    <LayoutRa {...props} appBar={MinhaAppBar} menu={CustomMenu} />
);

export default Layout;