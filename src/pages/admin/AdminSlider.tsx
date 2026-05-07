import { useState } from 'react';
import { Plus, Edit, Trash2, MoreHorizontal, GripVertical } from 'lucide-react';
import { useSliderSlides, useCreateSlide, useUpdateSlide, useDeleteSlide, SliderSlide } from '@/hooks/useShopData';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/admin/ImageUpload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';

export default function AdminSlider() {
  const { data: slides = [], isLoading, error } = useSliderSlides(false); // Get all slides including inactive
  const createSlide = useCreateSlide();
  const updateSlide = useUpdateSlide();
  const deleteSlide = useDeleteSlide();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SliderSlide | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    image: '',
    heading: '',
    text: '',
    cta_text: 'Shop Now',
    cta_link: '/shop',
    sort_order: 0,
    is_active: true,
  });

  const handleEdit = (slide: SliderSlide) => {
    setEditingSlide(slide);
    setFormData({
      image: slide.image,
      heading: slide.heading,
      text: slide.text,
      cta_text: slide.cta_text,
      cta_link: slide.cta_link,
      sort_order: slide.sort_order,
      is_active: slide.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteSlide.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleToggleActive = async (slide: SliderSlide) => {
    await updateSlide.mutateAsync({
      id: slide.id,
      is_active: !slide.is_active,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSlide) {
        await updateSlide.mutateAsync({ id: editingSlide.id, ...formData });
      } else {
        await createSlide.mutateAsync(formData);
      }
      setIsDialogOpen(false);
      setEditingSlide(null);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setFormData({
      image: '',
      heading: '',
      text: '',
      cta_text: 'Shop Now',
      cta_link: '/shop',
      sort_order: slides.length,
      is_active: true,
    });
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Failed to load slides. Check RLS policies.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Hero Slider</h1>
          <p className="text-muted-foreground mt-1">
            Manage homepage hero slider images
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="btn-accent"
              onClick={() => {
                setEditingSlide(null);
                resetForm();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSlide ? 'Edit Slide' : 'Add New Slide'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Slide Image *</label>
                <ImageUpload
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  folder="slider"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Heading *</label>
                <input
                  type="text"
                  value={formData.heading}
                  onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                  className="input-shop"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Text *</label>
                <input
                  type="text"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  className="input-shop"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">CTA Text *</label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    className="input-shop"
                    placeholder="Shop Now"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CTA Link *</label>
                  <input
                    type="text"
                    value={formData.cta_link}
                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                    className="input-shop"
                    placeholder="/shop"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    className="input-shop"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <label className="text-sm font-medium">Active</label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="btn-accent flex-1" disabled={createSlide.isPending || updateSlide.isPending}>
                  {editingSlide ? 'Update Slide' : 'Create Slide'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Slides List */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto" />
        </div>
      ) : (
        <div className="space-y-4">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`bg-card rounded-xl border border-border overflow-hidden ${!slide.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image Preview */}
                <div className="sm:w-64 h-40 sm:h-auto shrink-0">
                  <img
                    src={slide.image || '/placeholder.svg'}
                    alt={slide.heading}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Slide {index + 1} {!slide.is_active && '(Inactive)'}
                      </p>
                      <h3 className="font-semibold">{slide.heading}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{slide.text}</p>
                      <p className="text-xs text-accent mt-2">
                        {slide.cta_text} → {slide.cta_link}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={slide.is_active}
                      onCheckedChange={() => handleToggleActive(slide)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(slide)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteId(slide.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {slides.length === 0 && !isLoading && (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">No slides yet. Add your first slide!</p>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this slide? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
