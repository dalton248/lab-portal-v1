'use client';

import { ServiceCatalog } from '@/components/billing/ServiceCatalog';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function ServicesPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('services.title')}</h1>
        <p className="text-slate-500">{t('services.subtitle')}</p>
      </div>
      <ServiceCatalog />
    </div>
  );
}
