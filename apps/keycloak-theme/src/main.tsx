import { createRoot } from 'react-dom/client';
import KcPage from './login/KcPage';
import type { KcContext } from 'keycloakify/login/KcContext';
import '@dtx/ui/styles.css';
import './theme.css';
declare global { interface Window { kcContext?: KcContext } }
createRoot(document.getElementById('root')!).render(window.kcContext ? <KcPage kcContext={window.kcContext} /> : <p>Open this theme through Keycloak.</p>);
