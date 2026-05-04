import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function LanguageSwitcher({ showLabel = true }: { showLabel?: boolean }) {
  const { t, i18n } = useTranslation();

  const change = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('app_language', lng);
  };

  return (
    <div className="space-y-2">
      {showLabel && <Label htmlFor="language">{t('settings.language')}</Label>}
      <Select value={i18n.language?.startsWith('fr') ? 'fr' : 'en'} onValueChange={change}>
        <SelectTrigger id="language" className="w-full max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t('settings.english')} (English)</SelectItem>
          <SelectItem value="fr">{t('settings.french')} (Français)</SelectItem>
        </SelectContent>
      </Select>
      {showLabel && <p className="text-xs text-muted-foreground">{t('settings.languageHint')}</p>}
    </div>
  );
}
