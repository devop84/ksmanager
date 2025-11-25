import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from '../locales/en/common.json'
import ptBRCommon from '../locales/pt-BR/common.json'
import frFRCommon from '../locales/fr-FR/common.json'
import esESCommon from '../locales/es-ES/common.json'
import deDECommon from '../locales/de-DE/common.json'
import itITCommon from '../locales/it-IT/common.json'

const resources = {
  'en-US': {
    translation: enCommon,
  },
  'pt-BR': {
    translation: ptBRCommon,
  },
  'fr-FR': {
    translation: frFRCommon,
  },
  'es-ES': {
    translation: esESCommon,
  },
  'de-DE': {
    translation: deDECommon,
  },
  'it-IT': {
    translation: itITCommon,
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en-US',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
  defaultNS: 'translation',
  ns: ['translation'],
})

export default i18n

