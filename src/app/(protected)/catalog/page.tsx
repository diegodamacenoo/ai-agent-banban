"use client";

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Eye, Package, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { SkeletonProductGrid } from "@/components/ui/skeleton-loader";

// Tipos
interface Product {
  id: string;
  product_name: string;
  category: string;
}

interface ProductVariant {
  size: string;
  color: string;
  price_value: number;
  valid_from: string;
}

interface PricePoint {
  date: string;
  price: number;
}

// Dados mock para fallback
const MOCK_PRODUCTS: Product[] = [
  { id: '1', product_name: 'Camiseta Básica Premium', category: 'Roupas' },
  { id: '2', product_name: 'Tênis Running Performance', category: 'Calçados' },
  { id: '3', product_name: 'Relógio Smart Fitness', category: 'Acessórios' },
  { id: '4', product_name: 'Jaqueta Windbreaker', category: 'Roupas' },
  { id: '5', product_name: 'Boné Trucker Classic', category: 'Acessórios' },
];

const MOCK_VARIANTS: ProductVariant[] = [
  { size: 'M', color: 'Azul', price_value: 45.90, valid_from: '2024-01-01' },
  { size: 'M', color: 'Branco', price_value: 45.90, valid_from: '2024-01-01' },
  { size: 'G', color: 'Azul', price_value: 49.90, valid_from: '2024-01-01' },
  { size: 'G', color: 'Branco', price_value: 49.90, valid_from: '2024-01-01' },
];

const MOCK_PRICE_TIMELINE: PricePoint[] = [
  { date: '2024-01-01', price: 45.90 },
  { date: '2024-02-01', price: 47.90 },
  { date: '2024-03-01', price: 45.90 },
  { date: '2024-04-01', price: 49.90 },
  { date: '2024-05-01', price: 45.90 },
];

// Componente PriceTimeline
function PriceTimeline({ data }: { data: PricePoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Preços</CardTitle>
        <CardDescription>Evolução dos preços ao longo do tempo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
              />
              <YAxis
                tickFormatter={(value) => `R$ ${value.toFixed(2)}`}
              />
              <Tooltip
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Preço']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente ProductDrawer
function ProductDrawer({ product, onOpenChange }: { product: Product; onOpenChange: (open: boolean) => void }) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [priceTimeline, setPriceTimeline] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProductDetails = async () => {
      setLoading(true);
      try {
        const supabase = createSupabaseClient();

        // Query para variantes e preços
        const { data, error } = await supabase
          .from('core_product_variants')
          .select(`
            size,
            color,
            core_product_pricing (
              price_value,
              valid_from
            )
          `)
          .eq('product_id', product.id);

        if (!error && data) {
          // Processar variantes
          const processedVariants: ProductVariant[] = data.flatMap(variant =>
            variant.core_product_pricing?.map(pricing => ({
              size: variant.size,
              color: variant.color,
              price_value: pricing.price_value,
              valid_from: pricing.valid_from
            })) || []
          );

          setVariants(processedVariants);

          // Processar timeline de preços (agrupado por data)
          const priceMap = new Map<string, number[]>();
          processedVariants.forEach(variant => {
            const date = variant.valid_from;
            if (!priceMap.has(date)) {
              priceMap.set(date, []);
            }
            priceMap.get(date)!.push(variant.price_value);
          });

          const timeline: PricePoint[] = Array.from(priceMap.entries())
            .map(([date, prices]) => ({
              date,
              price: prices.reduce((acc, price) => acc + price, 0) / prices.length
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          setPriceTimeline(timeline);
        } else {
          throw new Error('Erro ao carregar dados');
        }
      } catch (error) {
        console.log('Usando dados mock:', error);
        setVariants(MOCK_VARIANTS);
        setPriceTimeline(MOCK_PRICE_TIMELINE);
      } finally {
        setLoading(false);
      }
    };

    loadProductDetails();
  }, [product.id]);

  // Agrupar variantes únicos
  const uniqueVariants = variants.reduce((acc, variant) => {
    const key = `${variant.size}-${variant.color}`;
    if (!acc.some(v => `${v.size}-${v.color}` === key)) {
      acc.push(variant);
    }
    return acc;
  }, [] as ProductVariant[]);

  return (
    <SheetContent className="sm:max-w-lg">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          {product.product_name}
        </SheetTitle>
        <SheetDescription>
          Categoria: {product.category}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 mt-6">
        {loading ? (
          <div className="text-center py-8">Carregando detalhes...</div>
        ) : (
          <>
            {/* Variantes */}
            <div>
              <h3 className="font-semibold mb-3">Variantes Disponíveis</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueVariants.map((variant, index) => (
                  <Badge key={index} variant="outline" className="px-3 py-1">
                    {variant.size} / {variant.color}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Timeline de Preços */}
            <PriceTimeline data={priceTimeline} />

            {/* Informações Adicionais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Variantes:</span>
                  <span className="font-medium">{uniqueVariants.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço Atual:</span>
                  <span className="font-medium text-green-600">
                    R$ {priceTimeline[priceTimeline.length - 1]?.price.toFixed(2) || '0,00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categoria:</span>
                  <span className="font-medium">{product.category}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </SheetContent>
  );
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
          .from('core_products')
          .select('id, product_name, category')
          .limit(20);

        if (!error && data) {
          setProducts(data);
        } else {
          throw new Error('Erro ao carregar produtos');
        }
      } catch (error) {
        console.log('Usando dados mock:', error);
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const columnHelper = createColumnHelper<Product>();

  const columns: ColumnDef<Product, any>[] = [
    columnHelper.accessor('product_name', {
      header: 'Nome',
      cell: (info) => (
        <div className="font-medium">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor('category', {
      header: 'Categoria',
      cell: (info) => (
        <Badge variant="secondary">{info.getValue()}</Badge>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Ações',
      cell: (props) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedProduct(props.row.original);
            setDrawerOpen(true);
          }}
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver detalhes
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <PageErrorBoundary>
      <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
        <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">Catálogo</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Filtros
            </Button>
            <Button variant="outline" size="sm">
              <Package className="w-4 h-4 mr-1" />
              Novo Produto
            </Button>
          </div>
        </div>
      </header>
      <div className="p-6 space-y-6">

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <SkeletonProductGrid items={6} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Produtos</CardTitle>
              <CardDescription>
                {products.length} produtos encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        Nenhum produto encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          {selectedProduct && (
            <ProductDrawer
              product={selectedProduct}
              onOpenChange={setDrawerOpen}
            />
          )}
        </Sheet>
      </div>
    </PageErrorBoundary>
  );
} 