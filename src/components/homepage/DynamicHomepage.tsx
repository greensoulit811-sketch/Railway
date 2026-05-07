import { useActiveTemplate, useActiveTemplateSections } from '@/hooks/useHomepageTemplates';
import { Layout } from '@/components/layout/Layout';
import { DefaultHomepage } from './templates/DefaultHomepage';
import { GroceryHomepage } from './templates/GroceryHomepage';
import { CosmeticsHomepage } from './templates/CosmeticsHomepage';
import { GadgetsHomepage } from './templates/GadgetsHomepage';
import { FurnitureHomepage } from './templates/FurnitureHomepage';
import { Skeleton } from '@/components/ui/skeleton';

export function DynamicHomepage() {
  const { data: activeTemplate, isLoading: templateLoading } = useActiveTemplate();
  const { data: sections = [], isLoading: sectionsLoading } = useActiveTemplateSections();

  if (templateLoading || sectionsLoading) {
    return (
      <Layout>
        <div className="container-shop py-12 space-y-8">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const enabledSections = sections.filter((s) => s.enabled).sort((a, b) => a.sort_order - b.sort_order);
  const templateName = activeTemplate?.name || 'default';

  const templateMap: Record<string, React.ComponentType<{ sections: typeof enabledSections }>> = {
    default: DefaultHomepage,
    grocery: GroceryHomepage,
    cosmetics: CosmeticsHomepage,
    gadgets: GadgetsHomepage,
    furniture: FurnitureHomepage,
  };

  const TemplateComponent = templateMap[templateName] || DefaultHomepage;

  return <TemplateComponent sections={enabledSections} />;
}
