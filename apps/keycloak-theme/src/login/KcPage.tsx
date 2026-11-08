import { Suspense } from 'react';
import DefaultPage from 'keycloakify/login/DefaultPage';
import Template from 'keycloakify/login/Template';
import UserProfileFormFields from 'keycloakify/login/UserProfileFormFields';
import { useI18n } from './i18n';
import type { KcContext } from 'keycloakify/login/KcContext';
import Login from './Login';
export default function KcPage({ kcContext }: { kcContext: KcContext }) {
  const { i18n } = useI18n({ kcContext });
  const common = { i18n, Template, doUseDefaultCss: true };
  return <Suspense>{kcContext.pageId === 'login.ftl' ? <Login kcContext={kcContext} {...common} /> : <DefaultPage kcContext={kcContext} {...common} UserProfileFormFields={UserProfileFormFields} doMakeUserConfirmPassword />}</Suspense>;
}
