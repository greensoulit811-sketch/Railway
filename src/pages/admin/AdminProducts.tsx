import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { useProducts, useCategories, useCreateProduct, useUpdateProduct, useDeleteProduct, Product, Category } from '@/hooks/useShopData';
import { ProductVariantManager } from '@/components/admin/ProductVariantManager';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
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
import { MultiImageUpload } from '@/components/admin/ImageUpload';
import { CsvProductUpload } from '@/components/admin/CsvProductUpload';

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

export default function AdminProducts() {
  const { data: products = [], isLoading, error } = useProducts();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: '',
    sale_price: '',
    category_id: '',
    stock: '0',
    sku: '',
    short_description: '',
    description: '',
    images: [] as string[],
    is_new: false,
    is_best_seller: false,
    is_featured: false,
    is_active: true,
    is_variable: false,
    hide_stock: false,
    specifications: [] as { label: string; value: string }[],
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      price: product.price.toString(),
      sale_price: product.sale_price?.toString() || '',
      category_id: product.category_id || '',
      stock: product.stock.toString(),
      sku: product.sku,
      short_description: product.short_description || '',
      description: product.description || '',
      images: product.images || [],
      is_new: product.is_new || false,
      is_best_seller: product.is_best_seller || false,
      is_featured: product.is_featured || false,
      is_active: (product as any).is_active ?? true,
      is_variable: (product as any).is_variable ?? false,
      hide_stock: (product as any).hide_stock ?? false,
      specifications: (product as any).specifications || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteProduct.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteProduct.mutateAsync(id);
    }
    setSelectedIds(new Set());
    setShowBulkDelete(false);
    toast.success(`${selectedIds.size} product(s) deleted`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    const productData = {
      name: formData.name,
      slug: formData.slug,
      price: parseFloat(formData.price),
      sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
      category_id: formData.category_id || null,
      stock: parseInt(formData.stock),
      sku: formData.sku || `SKU-${Date.now()}`,
      short_description: formData.short_description || null,
      description: formData.description || null,
      images: formData.images,
      is_new: formData.is_new,
      is_best_seller: formData.is_best_seller,
      is_featured: formData.is_featured,
      is_variable: formData.is_variable,
      hide_stock: formData.hide_stock,
      specifications: formData.specifications.filter(s => s.label.trim()).length > 0 ? formData.specifications.filter(s => s.label.trim()) : null,
    };

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
      } else {
        await createProduct.mutateAsync(productData as any);
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      price: '',
      sale_price: '',
      category_id: '',
      stock: '0',
      sku: '',
      short_description: '',
      description: '',
      images: [],
      is_new: false,
      is_best_seller: false,
      is_featured: false,
      is_active: true,
      is_variable: false,
      hide_stock: false,
      specifications: [],
    });
  };

  // Auto-generate slug from name
  useEffect(() => {
    if (!editingProduct && formData.name) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(prev.name) }));
    }
  }, [formData.name, editingProduct]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Failed to load products. Check RLS policies.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Products</h1>
        <div className="flex gap-2">
          <CsvProductUpload />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="btn-accent"
              onClick={() => {
                setEditingProduct(null);
                resetForm();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-shop"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="input-shop"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input-shop"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sale Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    className="input-shop"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stock *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="input-shop"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input-shop"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Short Description</label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  className="input-shop"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-shop min-h-[100px]"
                />
              </div>
              {/* Specifications */}
              <div>
                <label className="block text-sm font-medium mb-2">Specifications (optional)</label>
                {formData.specifications.map((spec, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Label (e.g. Material)"
                      value={spec.label}
                      onChange={(e) => {
                        const updated = [...formData.specifications];
                        updated[index] = { ...updated[index], label: e.target.value };
                        setFormData({ ...formData, specifications: updated });
                      }}
                      className="input-shop flex-1"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. Cotton)"
                      value={spec.value}
                      onChange={(e) => {
                        const updated = [...formData.specifications];
                        updated[index] = { ...updated[index], value: e.target.value };
                        setFormData({ ...formData, specifications: updated });
                      }}
                      className="input-shop flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updated = formData.specifications.filter((_, i) => i !== index);
                        setFormData({ ...formData, specifications: updated });
                      }}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, specifications: [...formData.specifications, { label: '', value: '' }] })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Spec
                </Button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product Images *
                </label>
                <MultiImageUpload
                  values={formData.images}
                  onChange={(urls) => setFormData({ ...formData, images: urls })}
                  folder="products"
                  maxImages={5}
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_variable}
                    onChange={(e) => setFormData({ ...formData, is_variable: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Variable Product</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_new}
                    onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">New Arrival</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_best_seller}
                    onChange={(e) => setFormData({ ...formData, is_best_seller: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Best Seller</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Featured</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.hide_stock}
                    onChange={(e) => setFormData({ ...formData, hide_stock: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Hide Stock</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="btn-accent flex-1" disabled={createProduct.isPending || updateProduct.isPending}>
                  {editingProduct ? 'Update Product' : 'Create Product'}
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

            {/* Product Variants Manager - only for variable products */}
            {editingProduct && formData.is_variable && (
              <div className="mt-8 pt-8 border-t border-border">
                <ProductVariantManager
                  productId={editingProduct.id}
                  productName={editingProduct.name}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search & Bulk Actions */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-shop pl-10 w-full"
          />
        </div>
        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowBulkDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {selectedIds.size} Selected
          </Button>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded"
                      checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-secondary/30 transition-colors ${selectedIds.has(product.id) ? 'bg-accent/10' : ''}`}>
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images[0] || '/placeholder.svg'}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover bg-secondary"
                        />
                        <span className="font-medium line-clamp-1">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{product.sku}</td>
                    <td className="px-6 py-4">
                      {product.sale_price ? (
                        <div>
                          <span className="font-medium">${product.sale_price}</span>
                          <span className="text-sm text-muted-foreground line-through ml-2">${product.price}</span>
                        </div>
                      ) : (
                        <span className="font-medium">${product.price}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{product.category?.name || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteId(product.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
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

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Product(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected product(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
