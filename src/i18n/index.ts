import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import translationEN from './en.json';
import translationZH from './zh-CN.json';
import translationJA from './ja.json';
import {bitable} from "@lark-base-open/js-sdk";


// 初始化 i18n
i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: translationEN,
    },
    zh: {
      translation: translationZH,
    },
    ja: {
      translation: translationJA,
    }
  },
  fallbackLng: 'en', // 如果没有对应的语言文件，则使用默认语言
  interpolation: {
    escapeValue: false, // 不进行 HTML 转义
  },
});

bitable.bridge.getLanguage().then(async (lng) => {
  if (i18n.language !== lng) {
    await i18n.changeLanguage(lng);
  }
});

export default i18n;