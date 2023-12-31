import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(localizedFormat)

import en from './en.json'
import 'dayjs/locale/en'

import ru from './ru.json'
import 'dayjs/locale/ru'

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			en,
			ru,
		},
		fallbackLng: 'en',
		detection: {
			order: ['navigator', 'localStorage'],
			caches: ['localStorage'],
		},
	})

export default i18n