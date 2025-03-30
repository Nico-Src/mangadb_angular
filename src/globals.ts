import { ANIMATION_MODULE_TYPE } from "@angular/core";
import { TuiAlertService } from "@taiga-ui/core";
import moment from 'moment';
import 'moment/locale/de';
import 'moment/locale/ja';

export const API_BASE = 'http://localhost:4545';
export const CDN_BASE = 'http://localhost:5555';

export const CONFIG = {
    version: '0.0.1',
    default_locale: 'en',
    auth: {
        min_username_length: 3,
        max_username_length: 31,
        min_password_length: 6,
        max_password_length: 255
    }
};

export const LANGS = [
    {key: 'language.english', value: 'en', disabled: false},
    {key: 'language.german', value: 'de', disabled: false},
    {key: 'language.french', value: 'fr', disabled: true},
    {key: 'language.italian', value: 'it', disabled: true},
    {key: 'language.spanish', value: 'es', disabled: true},
    {key: 'language.japanese', value: 'jpn', disabled: true},
    {key: 'language.korean', value: 'kor', disabled: true},
]

export const THEMES = [
    {key: 'system'},
    {key: 'light'},
    {key: 'dark'},
    {key: 'crimson', disable: true},
];

export const DEFAULT_SETTINGS:any = {
    'theme-accent-color': '#71c94e',
    'prefered-content-language': 'interface',
    'theme': 'light',
    'nsfw-mode': 'settings.nsfw.hide-nsfw',
    'view-mode': 'column',
    'show-drag-indicator': true
};

export const NSFW_SETTINGS = [
    {key: 'settings.nsfw.hide-nsfw'},
    {key: 'settings.nsfw.show-nsfw'},
    {key: 'settings.nsfw.show-nsfw-18'}
];

export const ANNOUNCED_DATE = "date.announced";
export const UNKNOWN_DATE = "date.unknown";

export const dateFormats = [
    {locale: 'de', format: 'DD.MM.YYYY'},
    {locale: 'en', format: 'DD-MM-YYYY'},
    {locale: 'de_write_out', format: 'Do MMMM YYYY'},
    {locale: 'en_write_out', format: 'Do MMMM YYYY'},
    {locale: 'ja', format: 'DD日MM月YYYY年'},
    {locale: 'ja_write_out', format: 'DoMM月YYYY年'},
];

export const dateTimeFormats = [
    {locale: 'de', format: 'LLL'},
    {locale: 'en', format: 'LLL'},
    {locale: 'ja', format: 'LLL'},
];

export const REPORT_TYPES = [
    {key: 'wrong-info', name: 'Wrong Information', type: 'series'},
    {key: 'missing-info', name: 'Missing Information', type: 'series'},
    {key: 'missing-volumes', name: 'Missing Volumes', type: 'series'},
    {key: 'other', name: 'Other', type: 'series'},
    {key: 'broken-link', name: 'Broken Link', type: 'volume'},
    {key: 'wrong-info', name: 'Wrong Information', type: 'volume'},
    {key: 'missing-info', name: 'Missing Information', type: 'volume'},
    {key: 'explicit-content', name: 'Explicit Content', type: 'volume'},
    {key: 'other', name: 'Other', type: 'volume'},
];

export const REPORT_STATUSES = [
    {key: 'open', name: 'Open'},
    {key: 'under-review', name: 'Under Review'},
    {key: 'resolved', name: 'Resolved'},
    {key: 'refused', name: 'Refused'}
];

export const READ_STATUSES = [
    {key: 'started'},{key: 'completed'},{key: 'paused'},
    {key: 'dropped'}
];

export const READ_STATUS_VISIBILITY_OPTIONS = [
    {label: 'public', value: 'public'},{label: 'private', value: 'private'}
];

export const READ_STATUS_PROGRESS_TYPE_OPTIONS = [
    {key: 'chapters'},{key: 'volumes'}
];

export const READ_STATUS_PRIORITY_OPTIONS = [
    {key: 'low'},{key: 'mid'},{key: 'high'}
];

// show error alert
export const errorAlert = async (alerts: TuiAlertService, message: string, label: string = 'server.status.error', translate: any): Promise<void> => {
    const translatedLabel = await getTranslation(translate, label);
    alerts.open(message, {label: translatedLabel, appearance: 'negative'}).subscribe();
}

// show success alert
export const successAlert = async (alerts: TuiAlertService, message: string, label: string = 'server.status.success', translate: any): Promise<void> => {
    const translatedLabel = await getTranslation(translate, label);
    alerts.open(message, {label: translatedLabel, appearance: 'positive'}).subscribe();
}

// Convert Hex Color to RGB
export const hexToRGB = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

// Convert date to a human-readable format based on current locale
export const readableDate = (str: string,lang: string,writeOut: boolean) => {
    const locale = lang;
    if(!str) return null;
    const parsed = moment.utc(str);
    // year before 1100 is considered unknown
    // year after 2100 is considered announced (not yet known)
    if(parsed.year() < 1100) return UNKNOWN_DATE;
    if(parsed.year() >= 2100) return ANNOUNCED_DATE;

    // check if the date should be written out (31st december instead of 31-12)
    if(!writeOut) return parsed.locale(locale).format(dateFormats.find(f => f.locale === locale)?.format || 'YYYY-MM-DD');
    else return parsed.locale(locale).format(dateFormats.find(f => f.locale === `${locale}_write_out`)?.format || 'Do MMMM YYYY');
};

export const readableDatetime = (str: string,loc: string) => {
    const locale = loc;
    if(!str) return null;
    const parsed = moment.utc(str);
    // year before 1100 is considered unknown
    // year after 2100 is considered announced (not yet known)
    if(parsed.year() < 1100) return UNKNOWN_DATE;
    if(parsed.year() >= 2100) return ANIMATION_MODULE_TYPE;

    // check if the date should be written out (31st december instead of 31-12)
    return parsed.locale(locale).format(dateTimeFormats.find(f => f.locale === locale)?.format || 'en');
}

// convert language to locale
export const langToLocale = (lang:string) => {
    switch(lang){
        case "German": return "de";
        case "English": return "en";
        case "French": return "fr";
        case "Spanish": return "es";
        case "Italian": return "it";
        case "Korean": return "kor";
        case "Chinese": return "cn";
        case "Japanese": return "jpn";
        default: return "en";
    }
}

// convert locale to language
export const localeToLang = (locale:string) => {
    switch(locale){
        case "de": return "German";
        case "en": return "English";
        case "fr": return "French";
        case "es": return "Spanish";
        case "it": return "Italian";
        case "kor": return "Korean";
        case "cn": return "Chinese";
        case "jpn": return "Japanese";
        default: return "English";
    }
}

// check if date is in future
export const isDateInFuture = (date: string) => {
    return moment(date).isAfter(moment(new Date));
}

// Converts a UTC date string to a human-readable "time ago" format based on the current locale.
export const ago = (str: string,lang: string) => {
    // Get the current locale
    const locale = toMomentLocale(lang);
    // Parse the input string into a moment.js object (assuming the input string is in UTC format)
    const parsed = moment.utc(str);
    return parsed.locale(locale).fromNow();
}

// convert locale to moment locale code
export const toMomentLocale = (locale:string) => {
    switch(locale){
        case 'en':
        case 'de':
        case 'fr':
        case 'es':
        case 'it': return locale;
        case 'kor': return 'koh';
        case 'cn': return 'zh';
        case 'jpn': return 'ja';
        default: return 'en';
    }
}

// async get translation function
export const getTranslation = async (translate: any, key:string) => {
    return await translate.get(key).toPromise();
}