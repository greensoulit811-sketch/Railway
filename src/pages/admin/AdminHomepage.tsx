import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GripVertical, Save, Eye, LayoutTemplate, ChevronUp, ChevronDown } from 'lucide-react';
import {
  useHomepageTemplates,
  useTemplateSections,
  useSetActiveTemplate,
  useBulkUpdateSections,
  useUpdateSection,
  HomepageSection,
} from '@/hooks/useHomepageTemplates';
import { toast } from 'sonner';

const TEMPLATE_ICONS: Record<string, string> = {
  default: '🏠',
  grocery: '🥦',
  cosmetics: '💄',
  gadgets: '📱',
  furniture: '🛋️',
};

const SECTION_LABELS: Record<string, string> = {
  hero_slider: 'Hero Slider',
  featured_categories: 'Featured Categories',
  featured_products: 'Featured Products',
  new_arrivals: 'New Arrivals',
  best_sellers: 'Best Sellers',
  customer_reviews: 'Customer Reviews',
  newsletter: 'Newsletter',
  category_icons: 'Category Icons Grid',
  flash_sale: 'Flash Sale Countdown',
  product_grid: 'Product Grid',
  combo_offers: 'Combo Offers',
  delivery_strip: 'Delivery Promise Strip',
  hero_banner: 'Hero Banner',
  shop_by_concern: 'Shop by Concern',
  brand_slider: 'Brand Slider',
  ingredient_highlight: 'Ingredient Highlight',
  featured_hero: 'Featured Product Hero',
  hot_deals: 'Hot Deals',
  shop_by_brand: 'Shop by Brand',
  comparison_block: 'Comparison Block',
  warranty_strip: 'Warranty & Support Strip',
  visual_hero: 'Visual Hero Banner',
  shop_by_room: 'Shop by Room',
  featured_collections: 'Featured Collections',
  material_highlight: 'Material & Size Highlight',
  customer_gallery: 'Customer Gallery',
};

export default function AdminHomepage() {
  const { data: templates, isLoading: templatesLoading } = useHomepageTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const { data: sections = [], isLoading: sectionsLoading } = useTemplateSections(selectedTemplateId);
  const setActive = useSetActiveTemplate();
  const bulkUpdate = useBulkUpdateSections();
  const updateSection = useUpdateSection();

  const [localSections, setLocalSections] = useState<HomepageSection[]>([]);

  useEffect(() => {
    if (templates?.length && !selectedTemplateId) {
      const active = templates.find((t) => t.is_active);
      if (active) setSelectedTemplateId(active.id);
      else setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  useEffect(() => {
    setLocalSections([...sections]);
  }, [sections]);

  const activeTemplate = templates?.find((t) => t.is_active);
  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...localSections];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newSections.length) return;
    [newSections[index], newSections[swapIdx]] = [newSections[swapIdx], newSections[index]];
    newSections.forEach((s, i) => (s.sort_order = i + 1));
    setLocalSections(newSections);
  };

  const toggleSection = (id: string) => {
    setLocalSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const updateSectionField = (id: string, field: string, value: string) => {
    setLocalSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async () => {
    // Save sort order + enabled for all sections
    await bulkUpdate.mutateAsync(
      localSections.map((s) => ({ id: s.id, sort_order: s.sort_order, enabled: s.enabled }))
    );
    // Save individual field updates
    for (const s of localSections) {
      const original = sections.find((o) => o.id === s.id);
      if (original && (original.title !== s.title || original.subtitle !== s.subtitle || original.layout_style !== s.layout_style || original.product_source !== s.product_source)) {
        await updateSection.mutateAsync({
          id: s.id,
          title: s.title,
          subtitle: s.subtitle,
          layout_style: s.layout_style,
          product_source: s.product_source,
        });
      }
    }
    toast.success('All changes saved!');
  };

  const handleActivate = () => {
    if (selectedTemplateId) setActive.mutate(selectedTemplateId);
  };

  if (templatesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6" /> Homepage Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Select and configure your homepage template
          </p>
        </div>
      </div>

      {/* Template Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {templates?.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id)}
                className={`relative p-4 rounded-xl border-2 transition-all text-center ${
                  selectedTemplateId === t.id
                    ? 'border-accent bg-accent/5 shadow-md'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <span className="text-3xl">{TEMPLATE_ICONS[t.name] || '📄'}</span>
                <p className="font-medium mt-2 text-sm">{t.label}</p>
                {t.is_active && (
                  <Badge className="absolute -top-2 -right-2 text-[10px]" variant="default">
                    Active
                  </Badge>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleActivate}
              disabled={!selectedTemplateId || activeTemplate?.id === selectedTemplateId || setActive.isPending}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {setActive.isPending ? 'Activating...' : 'Save & Apply'}
            </Button>
            {selectedTemplate && activeTemplate?.id !== selectedTemplateId && (
              <p className="text-sm text-muted-foreground self-center">
                Click to switch to <strong>{selectedTemplate.label}</strong>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Builder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            Sections — {selectedTemplate?.label || '...'}
          </CardTitle>
          <Button onClick={handleSave} disabled={bulkUpdate.isPending} size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            {bulkUpdate.isPending ? 'Saving...' : 'Save Sections'}
          </Button>
        </CardHeader>
        <CardContent>
          {sectionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : localSections.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sections configured</p>
          ) : (
            <div className="space-y-2">
              {localSections.map((section, index) => (
                <div
                  key={section.id}
                  className={`border rounded-lg p-4 transition-all ${
                    section.enabled ? 'bg-card border-border' : 'bg-muted/30 border-border/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 hover:bg-secondary rounded disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === localSections.length - 1}
                        className="p-0.5 hover:bg-secondary rounded disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    <GripVertical className="h-5 w-5 text-muted-foreground" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {SECTION_LABELS[section.section_type] || section.section_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          value={section.title}
                          onChange={(e) => updateSectionField(section.id, 'title', e.target.value)}
                          placeholder="Section title"
                          className="h-8 text-sm"
                        />
                        <Input
                          value={section.subtitle || ''}
                          onChange={(e) => updateSectionField(section.id, 'subtitle', e.target.value)}
                          placeholder="Subtitle"
                          className="h-8 text-sm"
                        />
                        <Select
                          value={section.layout_style}
                          onValueChange={(v) => updateSectionField(section.id, 'layout_style', v)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grid">Grid</SelectItem>
                            <SelectItem value="slider">Slider</SelectItem>
                            <SelectItem value="list">List</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Switch
                      checked={section.enabled}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
