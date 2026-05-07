import { useState } from 'react';
import { useLandingPages, useCreateLandingPage, useUpdateLandingPage, useDeleteLandingPage, LandingPage, HowToUseCard } from '@/hooks/useLandingPages';
import { useProducts } from '@/hooks/useShopData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, ExternalLink, X, Copy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const emptyForm = (): Omit<LandingPage, 'id' | 'created_at' | 'updated_at'> => ({
  title: '',
  slug: '',
  is_active: true,
  hero_title: '',
  hero_subtitle: '',
  hero_image: '',
  hero_cta_text: 'Order Now',
  product_ids: [],
  how_to_use_cards: [],
  show_reviews: true,
});

export default function AdminLandingPages() {
  const { data: pages = [], isLoading } = useLandingPages();
  const { data: allProducts = [] } = useProducts();
  const createPage = useCreateLandingPage();
  const updatePage = useUpdateLandingPage();
  const deletePage = useDeleteLandingPage();

  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setIsOpen(true);
  };

  const openEdit = (p: LandingPage) => {
    setEditId(p.id);
    setForm({
      title: p.title,
      slug: p.slug,
      is_active: p.is_active,
      hero_title: p.hero_title,
      hero_subtitle: p.hero_subtitle || '',
      hero_image: p.hero_image || '',
      hero_cta_text: p.hero_cta_text,
      product_ids: p.product_ids || [],
      how_to_use_cards: p.how_to_use_cards || [],
      show_reviews: p.show_reviews,
    });
    setIsOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setForm(prev => ({
      ...prev,
      title,
      slug: editId ? prev.slug : generateSlug(title),
    }));
  };

  const toggleProduct = (id: string) => {
    setForm(prev => {
      const ids = prev.product_ids.includes(id)
        ? prev.product_ids.filter(p => p !== id)
        : prev.product_ids.length < 5
          ? [...prev.product_ids, id]
          : prev.product_ids;
      if (!prev.product_ids.includes(id) && prev.product_ids.length >= 5) {
        toast.error('Maximum 5 products allowed');
      }
      return { ...prev, product_ids: ids };
    });
  };

  const addHowToCard = () => {
    setForm(prev => ({
      ...prev,
      how_to_use_cards: [...prev.how_to_use_cards, { image: '', title: '', description: '' }],
    }));
  };

  const updateHowToCard = (index: number, field: keyof HowToUseCard, value: string) => {
    setForm(prev => {
      const cards = [...prev.how_to_use_cards];
      cards[index] = { ...cards[index], [field]: value };
      return { ...prev, how_to_use_cards: cards };
    });
  };

  const removeHowToCard = (index: number) => {
    setForm(prev => ({
      ...prev,
      how_to_use_cards: prev.how_to_use_cards.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.hero_title.trim()) {
      toast.error('Title and Hero Title are required');
      return;
    }
    if (form.product_ids.length === 0) {
      toast.error('Select at least one product');
      return;
    }

    if (editId) {
      await updatePage.mutateAsync({ id: editId, ...form });
    } else {
      await createPage.mutateAsync(form);
    }
    setIsOpen(false);
  };

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/lp/${slug}`);
    toast.success('URL copied');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Landing Pages</h1>
        <Button onClick={openCreate} className="btn-accent">
          <Plus className="h-4 w-4 mr-2" /> Create Landing Page
        </Button>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No landing pages yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pages.map((page) => (
            <div key={page.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {page.hero_image && (
                <img src={page.hero_image} alt="" className="w-20 h-14 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{page.title}</h3>
                  <Badge variant={page.is_active ? 'default' : 'secondary'}>
                    {page.is_active ? 'Active' : 'Draft'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">/lp/{page.slug} • {page.product_ids.length} products</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => copyUrl(page.slug)} title="Copy URL">
                  <Copy className="h-4 w-4" />
                </Button>
                <a href={`/lp/${page.slug}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                </a>
                <Button variant="ghost" size="icon" onClick={() => openEdit(page)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{page.title}"?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletePage.mutate(page.id)} className="bg-destructive text-destructive-foreground">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit' : 'Create'} Landing Page</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Basic Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Page Title *</label>
                  <Input value={form.title} onChange={e => handleTitleChange(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL Slug</label>
                  <Input value={form.slug} onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))} />
                  <p className="text-xs text-muted-foreground mt-1">/lp/{form.slug || '...'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(prev => ({ ...prev, is_active: v }))} />
                <span className="text-sm">Active</span>
              </div>
            </div>

            {/* Hero Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Hero Section</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Hero Title *</label>
                <Input value={form.hero_title} onChange={e => setForm(prev => ({ ...prev, hero_title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hero Subtitle</label>
                <Input value={form.hero_subtitle || ''} onChange={e => setForm(prev => ({ ...prev, hero_subtitle: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hero Image</label>
                <ImageUpload value={form.hero_image || ''} onChange={v => setForm(prev => ({ ...prev, hero_image: v }))} folder="landing-pages" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CTA Button Text</label>
                <Input value={form.hero_cta_text} onChange={e => setForm(prev => ({ ...prev, hero_cta_text: e.target.value }))} />
              </div>
            </div>

            {/* Products */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Products (max 5)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-border rounded-lg p-3">
                {allProducts.map(product => (
                  <label
                    key={product.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${
                      form.product_ids.includes(product.id) ? 'border-accent bg-accent/10' : 'border-transparent hover:bg-secondary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.product_ids.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="w-4 h-4"
                    />
                    <img src={product.images?.[0]} alt="" className="w-8 h-8 rounded object-cover" />
                    <span className="text-sm truncate">{product.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{form.product_ids.length}/5 selected</p>
            </div>

            {/* How to Use */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">How to Use Cards</h3>
                <Button type="button" variant="outline" size="sm" onClick={addHowToCard}>
                  <Plus className="h-4 w-4 mr-1" /> Add Card
                </Button>
              </div>
              {form.how_to_use_cards.map((card, i) => (
                <div key={i} className="border border-border rounded-lg p-4 space-y-3 relative">
                  <button type="button" onClick={() => removeHowToCard(i)} className="absolute top-2 right-2 text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <Input value={card.title} onChange={e => updateHowToCard(i, 'title', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Image</label>
                      <ImageUpload value={card.image} onChange={v => updateHowToCard(i, 'image', v)} folder="landing-pages" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={card.description}
                      onChange={e => updateHowToCard(i, 'description', e.target.value)}
                      className="input-shop min-h-[60px]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Reviews */}
            <div className="flex items-center gap-2">
              <Switch checked={form.show_reviews} onCheckedChange={v => setForm(prev => ({ ...prev, show_reviews: v }))} />
              <span className="text-sm">Show Reviews Section</span>
            </div>

            <Button onClick={handleSave} className="btn-accent w-full" disabled={createPage.isPending || updatePage.isPending}>
              {editId ? 'Update' : 'Create'} Landing Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
