import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/hooks/useLanguage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function Settings() {
  const { t } = useTranslation()
  const { changeLanguage, currentLanguage } = useLanguage()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold">{t('sidebar.settings')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('common.language') || 'Language'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('common.selectLanguage') || 'Select Language'}</label>
              <Select value={currentLanguage} onValueChange={changeLanguage}>
                <SelectTrigger className="w-48 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('common.english')}</SelectItem>
                  <SelectItem value="es">{t('common.spanish')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
