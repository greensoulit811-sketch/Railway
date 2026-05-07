import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface CsvRow {
  name: string;
  slug: string;
  sku: string;
  price: string;
  sale_price?: string;
  stock: string;
  category_name?: string;
  short_description?: string;
  description?: string;
  images?: string;
  is_new?: string;
  is_best_seller?: string;
  is_featured?: string;
  is_active?: string;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  );

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || '';
    });
    return row as unknown as CsvRow;
  });
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function downloadSampleCsv() {
  const headers = 'name,sku,price,sale_price,stock,category_name,short_description,description,images,is_new,is_best_seller,is_featured,is_active';
  const sampleRow = '"Sample Product","SKU-001","100","80","50","Category Name","Short desc","Full description","https://example.com/img1.jpg|https://example.com/img2.jpg","false","false","false","true"';
  const csv = `${headers}\n${sampleRow}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products_sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function CsvProductUpload() {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      if (rows.length === 0) {
        toast.error('CSV file is empty or has no data rows');
        return;
      }
      setPreview(rows);
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (preview.length === 0) return;

    setUploading(true);
    setProgress(0);
    const errors: string[] = [];
    let success = 0;

    // Fetch categories for name-to-id mapping
    const { data: categories } = await supabase.from('categories').select('id, name');
    const catMap = new Map(
      (categories || []).map((c) => [c.name.toLowerCase(), c.id])
    );

    for (let i = 0; i < preview.length; i++) {
      const row = preview[i];
      const rowNum = i + 2; // +2 for header + 0-index

      if (!row.name || !row.sku || !row.price) {
        errors.push(`Row ${rowNum}: Missing required fields (name, sku, price)`);
        setProgress(Math.round(((i + 1) / preview.length) * 100));
        continue;
      }

      const price = parseFloat(row.price);
      if (isNaN(price) || price <= 0) {
        errors.push(`Row ${rowNum}: Invalid price "${row.price}"`);
        setProgress(Math.round(((i + 1) / preview.length) * 100));
        continue;
      }

      const salePrice = row.sale_price ? parseFloat(row.sale_price) : null;
      const stock = row.stock ? parseInt(row.stock) : 0;
      const categoryId = row.category_name
        ? catMap.get(row.category_name.toLowerCase()) || null
        : null;

      if (row.category_name && !categoryId) {
        errors.push(`Row ${rowNum}: Category "${row.category_name}" not found`);
      }

      const images = row.images
        ? row.images.split('|').map((s) => s.trim()).filter(Boolean)
        : [];

      const toBool = (val?: string) =>
        val?.toLowerCase() === 'true' || val === '1';

      const productData = {
        name: row.name,
        slug: row.slug || generateSlug(row.name),
        sku: row.sku,
        price,
        sale_price: salePrice,
        stock: isNaN(stock) ? 0 : stock,
        category_id: categoryId,
        short_description: row.short_description || null,
        description: row.description || null,
        images,
        is_new: toBool(row.is_new),
        is_best_seller: toBool(row.is_best_seller),
        is_featured: toBool(row.is_featured),
        is_active: row.is_active !== undefined ? toBool(row.is_active) : true,
      };

      const { error } = await supabase.from('products').insert(productData);
      if (error) {
        errors.push(`Row ${rowNum} ("${row.name}"): ${error.message}`);
      } else {
        success++;
      }

      setProgress(Math.round(((i + 1) / preview.length) * 100));
    }

    setResult({ success, failed: errors.length, errors });
    setUploading(false);
    if (success > 0) {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${success} product(s) imported successfully`);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreview([]);
    setResult(null);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Sample download */}
          <Button variant="link" size="sm" className="p-0 h-auto" onClick={downloadSampleCsv}>
            <Download className="h-4 w-4 mr-1" />
            Download sample CSV template
          </Button>

          {/* File input */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Select a CSV file with columns: name, sku, price, sale_price, stock, category_name, short_description, description, images (pipe-separated URLs), is_new, is_best_seller, is_featured, is_active
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Choose CSV File
            </Button>
          </div>

          {/* Preview */}
          {preview.length > 0 && !result && (
            <div>
              <p className="text-sm font-medium mb-2">
                Preview: {preview.length} product(s) found
              </p>
              <div className="overflow-x-auto max-h-48 border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">SKU</th>
                      <th className="px-3 py-2 text-left">Price</th>
                      <th className="px-3 py-2 text-left">Stock</th>
                      <th className="px-3 py-2 text-left">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {preview.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5">{i + 1}</td>
                        <td className="px-3 py-1.5 max-w-[150px] truncate">{row.name}</td>
                        <td className="px-3 py-1.5">{row.sku}</td>
                        <td className="px-3 py-1.5">{row.price}</td>
                        <td className="px-3 py-1.5">{row.stock || '0'}</td>
                        <td className="px-3 py-1.5">{row.category_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    ...and {preview.length - 10} more rows
                  </p>
                )}
              </div>

              {uploading && (
                <div className="mt-3">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Importing... {progress}%</p>
                </div>
              )}

              <Button
                className="btn-accent mt-3 w-full"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Importing...' : `Import ${preview.length} Product(s)`}
              </Button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>{result.success} imported successfully</span>
              </div>
              {result.failed > 0 && (
                <>
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>{result.failed} failed</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto bg-secondary/50 rounded-lg p-3 text-xs space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-destructive">{err}</p>
                    ))}
                  </div>
                </>
              )}
              <Button variant="outline" className="w-full" onClick={handleClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
