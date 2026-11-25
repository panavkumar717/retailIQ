export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "expiring_soon" | "expired";

export interface ShopProfile {
  id: string;
  name: string;
  ownerName: string;
  businessType: string;
  phone: string;
  address: string;
  gstNumber: string;
  currency: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  categories: string[];
  notes: string;
  createdAt: string;
}

export interface InventoryBatch {
  id: string;
  productId: string;
  batchNumber: string;
  supplierId?: string;
  quantity: number;
  initialQuantity: number;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  discountPercent: number;
  manufacturingDate: string;
  expiryDate: string;
  qrCodePayload: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  lowStockThreshold: number;
  imageUrl: string;
  barcode?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithBatches extends Product {
  batches: InventoryBatch[];
  totalQuantity: number;
  earliestExpiry: string | null;
  status: StockStatus;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  batchId?: string;
  batchNumber?: string;
  movementType: "IN_QR" | "IN_VOICE" | "IN_MANUAL" | "OUT_SALE" | "OUT_BILL" | "ADJUSTMENT";
  quantityChange: number;
  reason: string;
  createdAt: string;
}

export interface BillLineItem {
  id: string;
  rawName: string;
  matchedProductId: string | null;
  matchedProductName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  confidence: "high" | "medium" | "low";
}

export interface UploadedBill {
  id: string;
  fileName: string;
  fileHash: string;
  billDate: string;
  totalAmount: number;
  status: "pending" | "confirmed" | "rejected";
  items: BillLineItem[];
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  discountAmount: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  billId?: string;
  saleDate: string;
  totalAmount: number;
  totalDiscount: number;
  paymentMethod: "Cash" | "UPI" | "Card";
  source: "manual" | "bill_scan";
  items: SaleItem[];
}

export interface DiscountRecommendation {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  batchId: string;
  batchNumber: string;
  availableQuantity: number;
  expiryDate: string;
  daysRemaining: number;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  avgDailySales: number;
  suggestedDiscountPercent: number;
  suggestedSellingPrice: number;
  reason: string;
  estimatedRevenue: number;
  potentialLossAvoided: number;
  status: "pending" | "applied" | "dismissed";
  belowCostWarning: boolean;
}

export interface CampaignProductItem {
  productId: string;
  productName: string;
  batchId: string;
  originalPrice: number;
  discountPercent: number;
  offerPrice: number;
}

export interface Campaign {
  id: string;
  title: string;
  festival: string;
  message: string;
  startDate: string;
  endDate: string;
  backgroundUrl?: string;
  products: CampaignProductItem[];
  status: "draft" | "active" | "shared";
  createdAt: string;
}

export interface SocialIntegrationStatus {
  platform: "whatsapp" | "instagram" | "facebook";
  connected: boolean;
  accountName: string | null;
  configuredInEnv: boolean;
  note: string;
}

export interface RetailDatabase {
  shop: ShopProfile;
  suppliers: Supplier[];
  products: Product[];
  batches: InventoryBatch[];
  movements: StockMovement[];
  bills: UploadedBill[];
  sales: Sale[];
  campaigns: Campaign[];
}
