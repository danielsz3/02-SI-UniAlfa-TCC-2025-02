import React from 'react';
import {
    Layout as LayoutRa, 
    AppBar,
    type AppBarProps,
    type LayoutProps,
    type MenuProps,
    Menu
} from 'react-admin';
import MenuUsuario from '../components/users/MenuUsuario'; 

const MinhaAppBar: React.FC<AppBarProps> = (props) => (
    <AppBar {...props} userMenu={<MenuUsuario />} />
);

const CustomMenu: React.FC<MenuProps> = (props) => (
    <Menu {...props}>
        <Menu.ResourceItems />
    </Menu>
);

const Layout: React.FC<LayoutProps> = (props) => (
    <LayoutRa {...props} appBar={MinhaAppBar} menu={CustomMenu} />
);

export default Layout;