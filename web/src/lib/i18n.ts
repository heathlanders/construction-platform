import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '../../locales/en/common.json';
import enProjects from '../../locales/en/projects.json';
import esCommon from '../../locales/es/common.json';
import esProjects from '../../locales/es/projects.json';
import enFinancial from '../../locales/en/financial.json';
import esFinancial from '../../locales/es/financial.json';
import enSafety from '../../locales/en/safety.json';
import esSafety from '../../locales/es/safety.json';
import enField from '../../locales/en/field.json';
import esField from '../../locales/es/field.json';
import enElectrical from '../../locales/en/trade-electrical.json';
import esElectrical from '../../locales/es/trade-electrical.json';
import enPlumbing from '../../locales/en/trade-plumbing.json';
import esPlumbing from '../../locales/es/trade-plumbing.json';
import enConnections from '../../locales/en/connections.json';
import esConnections from '../../locales/es/connections.json';
import enPayroll from '../../locales/en/payroll.json';
import esPayroll from '../../locales/es/payroll.json';
import enPortal from '../../locales/en/portal.json';
import esPortal from '../../locales/es/portal.json';
import enStudio from '../../locales/en/studio.json';
import esStudio from '../../locales/es/studio.json';

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: {
        common: enCommon,
        projects: enProjects,
        financial: enFinancial,
        safety: enSafety,
        field: enField,
        'trade-electrical': enElectrical,
        'trade-plumbing': enPlumbing,
        connections: enConnections,
        payroll: enPayroll,
        portal: enPortal,
        studio: enStudio,
      },
      es: {
        common: esCommon,
        projects: esProjects,
        financial: esFinancial,
        safety: esSafety,
        field: esField,
        'trade-electrical': esElectrical,
        'trade-plumbing': esPlumbing,
        connections: esConnections,
        payroll: esPayroll,
        portal: esPortal,
        studio: esStudio,
      },
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18next;
