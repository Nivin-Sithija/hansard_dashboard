import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'hansard-lens-ui-language';

const translations = {
  en: {
    navOverview: 'Overview',
    navTopics: 'Topic Atlas',
    navTimeline: 'Timeline',
    navSpeeches: 'Speech Explorer',
    navSpeakers: 'Speakers',
    navCompare: 'Compare',
    navMethodology: 'Methodology',
    drawerExplore: 'Explore',
    drawerNext: 'Next',
    brandEyebrow: 'Trilingual Sri Lankan Hansard Explorer',
    languageLabel: 'UI language',
    uiEnglish: 'English',
    uiSinhala: 'සිංහල',
    routeLoading: 'Loading parliamentary insights...',
    loadingOverview: 'Loading overview...',
    loadingAtlas: 'Loading atlas...',
    loadingTimeline: 'Loading timeline...',
    loadingSpeeches: 'Loading speeches...',
    overviewHeroEyebrow: 'Political attention, made explorable',
    openTopicAtlas: 'Open Topic Atlas',
    browseSpeeches: 'Browse Speeches',
    speechesAnalyzed: 'Speeches analyzed',
    macroTopics: 'Macro-topics',
    yearsCovered: 'Years covered',
    languages: 'Languages',
    topic: 'Topic',
    allTopics: 'All topics',
    language: 'Language',
    allLanguages: 'All languages',
    year: 'Year',
    allYears: 'All years',
    excerptText: 'Excerpt text',
    speaker: 'Speaker',
    searchSpeechText: 'Search the speech text',
    searchSpeakerName: 'Search a speaker name',
    scope: 'Scope',
    clusteredOnly: 'Clustered only',
    proceduralNoiseOnly: 'Procedural noise only',
    everything: 'Everything',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    speechesMatch: 'speeches match your current filters.',
    speechesInView: 'speeches in view',
    atlasHint: 'Color = macro-topic. Fainter points = procedural noise. Hover to preview, click for evidence.',
    timelineNote: 'Tap the topic chips to isolate up to four debate lines, then read the event cards below for the source-backed explanation of the same years.',
    noSpeechMatches: 'No speeches match the current filters.',
    searchByNames: 'Search by Sinhala, Tamil, or English names.',
  },
  si: {
    navOverview: 'සාරාංශය',
    navTopics: 'මාතෘකා සිතියම',
    navTimeline: 'කාලරේඛාව',
    navSpeeches: 'කථන සෙවුම',
    navSpeakers: 'කථිකයන්',
    navCompare: 'සසඳන්න',
    navMethodology: 'ක්‍රමවේදය',
    drawerExplore: 'අවලෝකනය',
    drawerNext: 'ඊළඟ කොටස්',
    brandEyebrow: 'ත්‍රිභාෂා ශ්‍රී ලංකා හෑන්සාඩ් ගවේෂකය',
    languageLabel: 'අතුරුමුහුණත් භාෂාව',
    uiEnglish: 'English',
    uiSinhala: 'සිංහල',
    routeLoading: 'පාර්ලිමේන්තු දත්ත පූරණය වෙමින් පවතී...',
    loadingOverview: 'සාරාංශය පූරණය වෙමින් පවතී...',
    loadingAtlas: 'මාතෘකා සිතියම පූරණය වෙමින් පවතී...',
    loadingTimeline: 'කාලරේඛාව පූරණය වෙමින් පවතී...',
    loadingSpeeches: 'කථන පූරණය වෙමින් පවතී...',
    overviewHeroEyebrow: 'දේශපාලන අවධානය, ගවේෂණයට සූදානම්',
    openTopicAtlas: 'මාතෘකා සිතියම විවෘත කරන්න',
    browseSpeeches: 'කථන බලන්න',
    speechesAnalyzed: 'විශ්ලේෂිත කථන',
    macroTopics: 'මැක්‍රෝ මාතෘකා',
    yearsCovered: 'ආවරණය වන වසර',
    languages: 'භාෂා',
    topic: 'මාතෘකාව',
    allTopics: 'සියලු මාතෘකා',
    language: 'භාෂාව',
    allLanguages: 'සියලු භාෂා',
    year: 'වර්ෂය',
    allYears: 'සියලු වසර',
    excerptText: 'උපුටාගත් පාඨය',
    speaker: 'කථිකයා',
    searchSpeechText: 'කථන පාඨය සොයන්න',
    searchSpeakerName: 'කථික නාමයක් සොයන්න',
    scope: 'පරාසය',
    clusteredOnly: 'ක්ලස්ටර් කළ පමණයි',
    proceduralNoiseOnly: 'ක්‍රියාපටිපාටි ශබ්ද පමණයි',
    everything: 'සියල්ල',
    previous: 'පෙර',
    next: 'ඊළඟ',
    page: 'පිටුව',
    of: 'න්',
    speechesMatch: 'කථන ඔබගේ පෙරහන් සමඟ ගැළපේ.',
    speechesInView: 'දැනට පෙන්වන කථන',
    atlasHint: 'වර්ණ = මැක්‍රෝ මාතෘකාව. පැහැය අඩු ලක්ෂ්‍ය = ක්‍රියාපටිපාටි ශබ්ද. hover කර පෙරදසුන බලන්න, click කර සාක්ෂි බලන්න.',
    timelineNote: 'මාතෘකා චිප් තට්ටු කර රේඛා හතරක් දක්වා තනි කරන්න. ඉන්පසු එම වසර සඳහා මූලාශ්‍ර-ආධාරිත පැහැදිලි කිරීම පහත කියවන්න.',
    noSpeechMatches: 'වර්තමාන පෙරහන් වලට ගැළපෙන කථන නොමැත.',
    searchByNames: 'සිංහල, දෙමළ හෝ ඉංග්‍රීසි නාම මඟින් සොයන්න.',
  },
};

const languageNames = {
  en: {
    Sinhala: 'Sinhala',
    Tamil: 'Tamil',
    English: 'English',
    Mixed: 'Mixed',
  },
  si: {
    Sinhala: 'සිංහල',
    Tamil: 'දෙමළ',
    English: 'ඉංග්‍රීසි',
    Mixed: 'මිශ්‍ර',
  },
};

const UiLanguageContext = createContext(null);

export function UiLanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return window.localStorage.getItem(STORAGE_KEY) || 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t(key, fallback = key) {
      return translations[locale]?.[key] ?? translations.en[key] ?? fallback;
    },
    localizeLanguageLabel(language) {
      return languageNames[locale]?.[language] ?? language ?? '';
    },
  }), [locale]);

  return React.createElement(UiLanguageContext.Provider, { value }, children);
}

export function useUiLanguage() {
  const context = useContext(UiLanguageContext);
  if (!context) throw new Error('useUiLanguage must be used within UiLanguageProvider');
  return context;
}
