import './App.css';
import { Admin, CustomRoutes, ListGuesser, Resource, ShowGuesser } from 'react-admin';
import { Route } from 'react-router-dom';

import Layout from './layout/Layout';
import { authProvider } from './authProvider/authProvider';
import ConfiguracaoUsuario from './components/users/Configuracao';
import { LoginPage } from './components/LoginPage';
import Groups2Icon from '@mui/icons-material/Groups2';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import NightShelterOutlinedIcon from '@mui/icons-material/NightShelterOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import WebhookOutlinedIcon from '@mui/icons-material/WebhookOutlined';
import PetsIcon from '@mui/icons-material/Pets';
import EventIcon from '@mui/icons-material/Event';

import { i18nProvider, myTheme } from './theme';
import UserCreate from './components/users/UsuarioCreate';
import { UsuarioList } from './components/users/UsuarioList';
import ParceiroList from './components/parceiros/ParceiroList';
import ParceiroCreate from './components/parceiros/ParceiroCreate';
import { dataProvider } from './dataProvider/dataProvider';
import UserEdit from './components/users/UsuarioEdit';
import ParceiroEdit from './components/parceiros/ParceiroEdit';
import TransacaoCreate from './components/transacoes/TransacaoCreate';
import { TransacaoList } from './components/transacoes/TransacaoList';
import TransacaoEdit from './components/transacoes/TransacaoEdit';
import { ArquivoList } from './components/arquivos/ArquivoList';
import ArquivoCreate from './components/arquivos/ArquivoCreate';
import LarTempCreate from './components/lar_temporarios/LarTempCreate';
import { LarTempList } from './components/lar_temporarios/LarTempList';
import ArquivoEdit from './components/arquivos/ArquivoEdit';
import LarTempEdit from './components/lar_temporarios/LarTempEdit';
import { Loading } from './components/Loading';
import { IntegracaoList } from './components/integracoes/IntegracoesList';
import AnimalCreate from './components/animais/AnimalCreate';
import AnimalList from './components/animais/AnimalList';
import AnimalEdit from './components/animais/AnimalEdit';
import EventoList from './components/eventos/EventoList';
import EventoCreate from './components/eventos/EventoCreate';
import EventoEdit from './components/eventos/EventoEdit';

function App() {
  return (
    <Admin
      layout={Layout}
      theme={myTheme}
      loading={Loading}
      dataProvider={dataProvider}
      i18nProvider={i18nProvider}
      authProvider={authProvider}
      loginPage={LoginPage}
    >
      <CustomRoutes>
        <Route
          path="/configuracoes"
          element={<ConfiguracaoUsuario />}
        />
      </CustomRoutes>
      <Resource
        options={{ label: "Usuários" }}
        name="usuarios"
        icon={PeopleOutlineIcon}
        list={UsuarioList}
        edit={UserEdit}
        create={UserCreate}
      />
      <Resource
        options={{ label: "Animais" }}
        name="animais"
        icon={PetsIcon}
        list={AnimalList}
        edit={AnimalEdit}
        create={AnimalCreate}
      />
      <Resource
        options={{ label: "Parceiros" }}
        name="parceiros"
        icon={Groups2Icon}
        list={ParceiroList}
        edit={ParceiroEdit}
        create={ParceiroCreate}
      />
      <Resource
        options={{ label: "Eventos" }}
        name="eventos"
        icon={EventIcon}
        list={EventoList}
        edit={EventoEdit}
        create={EventoCreate}
      />
      <Resource
        options={{ label: "Transações" }}
        name="transacoes"
        icon={PaymentsRoundedIcon}
        list={TransacaoList}
        edit={TransacaoEdit}
        create={TransacaoCreate}
      />
      <Resource
        options={{ label: "Documentos" }}
        name="documentos"
        icon={DescriptionOutlinedIcon}
        list={ArquivoList}
        edit={ArquivoEdit}
        create={ArquivoCreate}
      />
      <Resource
        options={{ label: "Lares Temporários" }}
        name="lares-temporarios"
        icon={NightShelterOutlinedIcon}
        list={LarTempList}
        create={LarTempCreate}
        edit={LarTempEdit}
      />

       <Resource
        options={{ label: "Integrações" }}
        name="integracoes"
        icon={WebhookOutlinedIcon}
        list={IntegracaoList}
      />

    </Admin>
  )
}

export default App
