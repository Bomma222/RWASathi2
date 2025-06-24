import { useState, useEffect } from 'react';
import { setLanguage, getLanguage, type Language } from '@/lib/i18n';

export default function LanguageToggle() {
  const [currentLang, setCurrentLang] = useState<Language>(getLanguage());

  useEffect(() => {
    setLanguage(currentLang);
  }, [currentLang]);

  const toggleLanguage = () => {
    const newLang: Language = currentLang === 'en' ? 'te' : 'en';
    setCurrentLang(newLang);
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="text-sm bg-white/20 px-2 py-1 rounded text-white"
    >
      {currentLang === 'en' ? 'EN' : 'తె'}
    </button>
  );
}
