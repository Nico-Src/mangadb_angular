import { TuiAlertService } from "@taiga-ui/core";

export const API_BASE = 'http://localhost:4545';
export const CDN_BASE = 'http://localhost:5555';

export const CONFIG = {
    version: '0.0.1',
    default_locale: 'en'
};

export const LANGS = [
    {key: 'language.english', value: 'en', disabled: false},
    {key: 'language.german', value: 'de', disabled: false},
    {key: 'language.french', value: 'fr', disabled: true},
]

export const DEFAULT_SETTINGS = {
    'theme-accent-color': '#71c94e',
    'prefered-content-language': 'interface',
    'theme': 'light',
    'nsfw-mode': 'settings.nsfw.hide-nsfw',
    'view-mode': 'column',
};

export const errorAlert = (alerts: TuiAlertService, message: string, label: string = 'Error'): void => {
    alerts.open(message, {label: label, appearance: 'negative'}).subscribe();
}

export const successAlert = (alerts: TuiAlertService, message: string, label: string = 'Success'): void => {
    alerts.open(message, {label: label, appearance: 'positive'}).subscribe();
}