import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    en: {
        translation: {
            "welcome": "Welcome to UniFit",
            "login": "Login",
            "dashboard": "Dashboard",
            "occupancy": "Live Occupancy",
            "checkin": "Check In",
            "low_traffic": "Low Traffic - Great time to train!"
        }
    },
    jp: {
        translation: {
            "welcome": "UniFitへようこそ",
            "login": "ログイン",
            "dashboard": "ダッシュボード",
            "occupancy": "現在の混雑状況",
            "checkin": "チェックイン",
            "low_traffic": "空いています - トレーニングに最適です！"
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "jp", // Default language
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
