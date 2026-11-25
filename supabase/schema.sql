-- Retail IQ Complete Supabase PostgreSQL Schema
-- Enables UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Shops
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'Grocery & General Store',
  phone TEXT,
  address TEXT,
  gst_number TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  categories TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'packets',
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Product Codes (QR / Barcode mappings)
CREATE TABLE IF NOT EXISTS public.product_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_id UUID,
  code_value TEXT NOT NULL,
  code_type TEXT NOT NULL DEFAULT 'QR', -- 'QR' | 'BARCODE' | 'RETAIL_IQ_BATCH'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, code_value)
);

-- 6. Inventory Batches (Batch-wise expiry & pricing)
CREATE TABLE IF NOT EXISTS public.inventory_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  batch_number TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  initial_quantity INTEGER NOT NULL CHECK (initial_quantity >= 0),
  purchase_price NUMERIC(10, 2) NOT NULL CHECK (purchase_price >= 0),
  selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price >= 0),
  mrp NUMERIC(10, 2) NOT NULL CHECK (mrp >= 0),
  discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  manufacturing_date DATE,
  expiry_date DATE,
  qr_code_payload TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Stock Movements (Audit trail)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.inventory_batches(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL, -- 'IN_QR' | 'IN_VOICE' | 'IN_MANUAL' | 'OUT_SALE' | 'OUT_BILL' | 'ADJUSTMENT'
  quantity_change INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Uploaded Bills (Duplicate prevention via file_hash)
CREATE TABLE IF NOT EXISTS public.uploaded_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  bill_date DATE,
  total_amount NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'rejected'
  extracted_items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, file_hash)
);

-- 9. Sales
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES public.uploaded_bills(id) ON DELETE SET NULL,
  sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'bill_scan'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Sale Items
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.inventory_batches(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12, 2) NOT NULL
);

-- 11. AI Recommendations
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.inventory_batches(id) ON DELETE CASCADE,
  suggested_discount_percent NUMERIC(5, 2) NOT NULL,
  suggested_selling_price NUMERIC(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  estimated_revenue NUMERIC(12, 2) NOT NULL,
  potential_loss_avoided NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'applied' | 'dismissed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  festival TEXT NOT NULL,
  message TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  background_url TEXT,
  poster_data_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'active' | 'shared'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Campaign Products
CREATE TABLE IF NOT EXISTS public.campaign_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.inventory_batches(id) ON DELETE SET NULL,
  original_price NUMERIC(10, 2) NOT NULL,
  discount_percent NUMERIC(5, 2) NOT NULL,
  offer_price NUMERIC(10, 2) NOT NULL
);

-- 14. Social Integrations
CREATE TABLE IF NOT EXISTS public.social_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'whatsapp' | 'instagram' | 'facebook'
  account_name TEXT,
  is_connected BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, platform)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_integrations ENABLE ROW LEVEL SECURITY;

-- Policies: Users can access only their own profile & shop data
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "shops_own" ON public.shops FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "suppliers_shop" ON public.suppliers FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
CREATE POLICY "products_shop" ON public.products FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
CREATE POLICY "product_codes_shop" ON public.product_codes FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
CREATE POLICY "batches_shop" ON public.inventory_batches FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
CREATE POLICY "movements_shop" ON public.stock_movements FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
CREATE POLICY "bills_shop" ON public.uploaded_bills FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
CREATE POLICY "sales_shop" ON public.sales FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
CREATE POLICY "sale_items_shop" ON public.sale_items FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
CREATE POLICY "ai_rec_shop" ON public.ai_recommendations FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
CREATE POLICY "campaigns_shop" ON public.campaigns FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
CREATE POLICY "campaign_products_shop" ON public.campaign_products FOR ALL
  USING (campaign_id IN (SELECT id FROM public.campaigns WHERE shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())));
CREATE POLICY "social_shop" ON public.social_integrations FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
