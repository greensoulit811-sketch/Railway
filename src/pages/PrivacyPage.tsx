import { Layout } from '@/components/layout/Layout';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useStoreSettings } from '@/hooks/useStoreSettings';

export default function PrivacyPage() {
  const { t } = useSiteSettings();
  const { data: storeSettings, isLoading } = useStoreSettings();

  const title = storeSettings?.privacy_title || 'Privacy Policy';
  const content = storeSettings?.privacy_content || '';

  return (
    <Layout>
      <div className="container-shop section-padding">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">{title}</h1>
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/6" />
          </div>
        ) : content ? (
          <div
            className="prose prose-lg max-w-none text-foreground
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4
              [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3
              [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-muted-foreground
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
              [&_li]:mb-2 [&_li]:text-muted-foreground
              [&_strong]:text-foreground"
            dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }}
          />
        ) : (
          <p className="text-muted-foreground">No privacy policy has been published yet.</p>
        )}
      </div>
    </Layout>
  );
}
