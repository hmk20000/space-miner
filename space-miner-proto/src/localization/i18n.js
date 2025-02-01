import en from './translations/en';
import ko from './translations/ko';
import ja from './translations/ja';

class I18n {
    constructor() {
        this.language = this.detectLanguage();
        this.listeners = [];
        this.translations = { en, ko };
    }

    // 브라우저 언어 감지
    detectLanguage() {
        // 브라우저의 선호 언어 목록 가져오기
        const browserLangs = navigator.languages || [navigator.language || navigator.userLanguage];
        
        // 지원하는 언어 목록
        const supportedLangs = ['en', 'ko'];
        
        // 브라우저 언어와 매칭되는 지원 언어 찾기
        for (let lang of browserLangs) {
            // 언어 코드 정규화 (예: ko-KR -> ko)
            const normalizedLang = lang.split('-')[0].toLowerCase();
            
            if (supportedLangs.includes(normalizedLang)) {
                return normalizedLang;
            }
        }
        
        // 매칭되는 언어가 없으면 영어를 기본값으로 사용
        return 'en';
    }

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.language = lang;
            this.notifyListeners();
        }
    }

    t(key, params = {}) {
        const translation = this.translations[this.language]?.[key] || key;
        return this.interpolate(translation, params);
    }

    interpolate(text, params) {
        return text.replace(/{(\w+)}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback());
    }

    getCurrentLanguage() {
        return this.language;
    }
}

export default new I18n(); 