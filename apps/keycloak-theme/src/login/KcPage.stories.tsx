import type { Meta, StoryObj } from '@storybook/react-vite';
import { createGetKcContextMock } from 'keycloakify/login/KcContext';
import KcPage from './KcPage';

const { getKcContextMock } = createGetKcContextMock({
  kcContextExtension: { themeName: 'project-management', properties: {} },
  kcContextExtensionPerPage: {},
});

const meta = { title: 'Keycloak/Login', component: KcPage } satisfies Meta<typeof KcPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Login: Story = { args: { kcContext: getKcContextMock({ pageId: 'login.ftl' }) } };
export const InvalidCredentials: Story = {
  args: { kcContext: getKcContextMock({ pageId: 'login.ftl', overrides: {
    login: { username: 'user@example.com' },
    messagesPerField: {
      existsError: (...fields: string[]) => fields.some(field => field === 'username' || field === 'password'),
      get: (field: string) => field === 'username' || field === 'password' ? 'Invalid username or password.' : '',
    },
  } }) },
};
export const Registration: Story = { args: { kcContext: getKcContextMock({ pageId: 'register.ftl' }) } };
export const ResetPassword: Story = { args: { kcContext: getKcContextMock({ pageId: 'login-reset-password.ftl' }) } };
export const OneTimePassword: Story = { args: { kcContext: getKcContextMock({ pageId: 'login-otp.ftl' }) } };
