import fs from "fs";
import path from "path";
import { RetailDatabase, SocialIntegrationStatus } from "@/types/retail";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "retailiq-db.json");

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addDaysTimestamp(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function createSeedDatabase(): RetailDatabase {
  return {
    shop: {
      id: "shop_default",
      name: "Annapurna Kirana & General Store",
      ownerName: "Rajesh Sharma",
      businessType: "Grocery & General Store",
      phone: "+91 98765 43210",
      address: "14, Market Road, Indiranagar, Bengaluru 560038",
      gstNumber: "29AABCU9603R1ZM",
      currency: "INR",
    },
    suppliers: [
      {
        id: "sup_1",
        name: "Sri Lakshmi FMCG Distributors",
        contactPerson: "Venkatesh Rao",
        phone: "+91 98450 11223",
        email: "orders@srilakshmidist.in",
        address: "APMC Yard, Yeshwanthpur, Bengaluru",
        categories: ["Biscuits & Snacks", "Beverages", "Staples"],
        notes: "Delivers every Tuesday and Friday morning.",
        createdAt: addDaysTimestamp(-45),
      },
      {
        id: "sup_2",
        name: "Nandini Dairy & Fresh Supplies",
        contactPerson: "Manjunath K",
        phone: "+91 99001 44556",
        email: "supply@nandinifresh.in",
        address: "Dairy Circle, Bengaluru",
        categories: ["Dairy & Bakery"],
        notes: "Daily morning delivery at 6:30 AM.",
        createdAt: addDaysTimestamp(-30),
      },
      {
        id: "sup_3",
        name: "Hindustan Care Wholesale",
        contactPerson: "Anita Desai",
        phone: "+91 97412 88990",
        email: "anita@hcwholesale.in",
        address: "Chickpet Main Road, Bengaluru",
        categories: ["Personal Care", "Household"],
        notes: "Net 15 days credit terms.",
        createdAt: addDaysTimestamp(-20),
      },
    ],
    products: [
      {
        id: "prod_1",
        name: "Good Day Butter Biscuits",
        brand: "Britannia",
        category: "Biscuits & Snacks",
        unit: "packets",
        lowStockThreshold: 12,
        imageUrl: "",
        barcode: "8901063012349",
        isArchived: false,
        createdAt: addDaysTimestamp(-25),
        updatedAt: addDaysTimestamp(-1),
      },
      {
        id: "prod_2",
        name: "Toned Fresh Milk 500ml",
        brand: "Nandini",
        category: "Dairy & Bakery",
        unit: "packets",
        lowStockThreshold: 15,
        imageUrl: "",
        barcode: "8901425001122",
        isArchived: false,
        createdAt: addDaysTimestamp(-20),
        updatedAt: addDaysTimestamp(0),
      },
      {
        id: "prod_3",
        name: "Aashirvaad Whole Wheat Atta 5kg",
        brand: "ITC",
        category: "Staples",
        unit: "bags",
        lowStockThreshold: 8,
        imageUrl: "",
        barcode: "8901725113452",
        isArchived: false,
        createdAt: addDaysTimestamp(-30),
        updatedAt: addDaysTimestamp(-2),
      },
      {
        id: "prod_4",
        name: "Dove Cream Beauty Bathing Bar",
        brand: "HUL",
        category: "Personal Care",
        unit: "pieces",
        lowStockThreshold: 10,
        imageUrl: "",
        barcode: "8901030712345",
        isArchived: false,
        createdAt: addDaysTimestamp(-18),
        updatedAt: addDaysTimestamp(-3),
      },
      {
        id: "prod_5",
        name: "Amul Gold Pasteurised Butter 100g",
        brand: "Amul",
        category: "Dairy & Bakery",
        unit: "packs",
        lowStockThreshold: 10,
        imageUrl: "",
        barcode: "8901262010016",
        isArchived: false,
        createdAt: addDaysTimestamp(-15),
        updatedAt: addDaysTimestamp(-1),
      },
      {
        id: "prod_6",
        name: "Tata Tea Gold 250g",
        brand: "Tata Consumer",
        category: "Beverages",
        unit: "packs",
        lowStockThreshold: 8,
        imageUrl: "",
        barcode: "8901052002344",
        isArchived: false,
        createdAt: addDaysTimestamp(-22),
        updatedAt: addDaysTimestamp(-4),
      },
      {
        id: "prod_7",
        name: "Whole Wheat Sandwich Bread",
        brand: "Modern",
        category: "Dairy & Bakery",
        unit: "loaves",
        lowStockThreshold: 6,
        imageUrl: "",
        barcode: "8901491100231",
        isArchived: false,
        createdAt: addDaysTimestamp(-10),
        updatedAt: addDaysTimestamp(0),
      },
    ],
    batches: [
      {
        id: "batch_1a",
        productId: "prod_1",
        batchNumber: "GD-2026-A",
        supplierId: "sup_1",
        quantity: 20,
        initialQuantity: 30,
        purchasePrice: 8,
        sellingPrice: 10,
        mrp: 10,
        discountPercent: 0,
        manufacturingDate: addDaysIso(-85),
        expiryDate: addDaysIso(2),
        qrCodePayload: JSON.stringify({
          type: "RETAIL_IQ_BATCH",
          batchId: "batch_1a",
          productId: "prod_1",
          batchNumber: "GD-2026-A",
        }),
        createdAt: addDaysTimestamp(-25),
      },
      {
        id: "batch_1b",
        productId: "prod_1",
        batchNumber: "GD-2026-B",
        supplierId: "sup_1",
        quantity: 30,
        initialQuantity: 30,
        purchasePrice: 8,
        sellingPrice: 10,
        mrp: 10,
        discountPercent: 0,
        manufacturingDate: addDaysIso(-10),
        expiryDate: addDaysIso(75),
        qrCodePayload: JSON.stringify({
          type: "RETAIL_IQ_BATCH",
          batchId: "batch_1b",
          productId: "prod_1",
          batchNumber: "GD-2026-B",
        }),
        createdAt: addDaysTimestamp(-5),
      },
      {
        id: "batch_2a",
        productId: "prod_2",
        batchNumber: "ND-MLK-01",
        supplierId: "sup_2",
        quantity: 24,
        initialQuantity: 40,
        purchasePrice: 21,
        sellingPrice: 24,
        mrp: 24,
        discountPercent: 0,
        manufacturingDate: addDaysIso(-1),
        expiryDate: addDaysIso(2),
        qrCodePayload: JSON.stringify({
          type: "RETAIL_IQ_BATCH",
          batchId: "batch_2a",
          productId: "prod_2",
          batchNumber: "ND-MLK-01",
        }),
        createdAt: addDaysTimestamp(-1),
      },
      {
        id: "batch_3a",
        productId: "prod_3",
        batchNumber: "ASH-5K-09",
        supplierId: "sup_1",
        quantity: 14,
        initialQuantity: 20,
        purchasePrice: 245,
        sellingPrice: 285,
        mrp: 295,
        discountPercent: 3.39,
        manufacturingDate: addDaysIso(-35),
        expiryDate: addDaysIso(120),
        qrCodePayload: JSON.stringify({
          type: "RETAIL_IQ_BATCH",
          batchId: "batch_3a",
          productId: "prod_3",
          batchNumber: "ASH-5K-09",
        }),
        createdAt: addDaysTimestamp(-20),
      },
      {
        id: "batch_4a",
        productId: "prod_4",
        batchNumber: "DOV-100-X",
        supplierId: "sup_3",
        quantity: 7,
        initialQuantity: 24,
        purchasePrice: 44,
        sellingPrice: 55,
        mrp: 55,
        discountPercent: 0,
        manufacturingDate: addDaysIso(-120),
        expiryDate: addDaysIso(210),
        qrCodePayload: JSON.stringify({
          type: "RETAIL_IQ_BATCH",
          batchId: "batch_4a",
          productId: "prod_4",
          batchNumber: "DOV-100-X",
        }),
        createdAt: addDaysTimestamp(-18),
      },
      {
        id: "batch_5a",
        productId: "prod_5",
        batchNumber: "AML-BT-14",
        supplierId: "sup_2",
        quantity: 16,
        initialQuantity: 25,
        purchasePrice: 48,
        sellingPrice: 56,
        mrp: 58,
        discountPercent: 0,
        manufacturingDate: addDaysIso(-50),
        expiryDate: addDaysIso(6),
        qrCodePayload: JSON.stringify({
          type: "RETAIL_IQ_BATCH",
          batchId: "batch_5a",
          productId: "prod_5",
          batchNumber: "AML-BT-14",
        }),
        createdAt: addDaysTimestamp(-15),
      },
      {
        id: "batch_6a",
        productId: "prod_6",
        batchNumber: "TTG-250-B",
        supplierId: "sup_1",
        quantity: 18,
        initialQuantity: 20,
        purchasePrice: 118,
        sellingPrice: 142,
        mrp: 145,
        discountPercent: 0,
        manufacturingDate: addDaysIso(-60),
        expiryDate: addDaysIso(14),
        qrCodePayload: JSON.stringify({
          type: "RETAIL_IQ_BATCH",
          batchId: "batch_6a",
          productId: "prod_6",
          batchNumber: "TTG-250-B",
        }),
        createdAt: addDaysTimestamp(-12),
      },
      {
        id: "batch_7a",
        productId: "prod_7",
        batchNumber: "MOD-BRD-OLD",
        supplierId: "sup_2",
        quantity: 4,
        initialQuantity: 10,
        purchasePrice: 34,
        sellingPrice: 42,
        mrp: 45,
        discountPercent: 0,
        manufacturingDate: addDaysIso(-6),
        expiryDate: addDaysIso(-1),
        qrCodePayload: JSON.stringify({
          type: "RETAIL_IQ_BATCH",
          batchId: "batch_7a",
          productId: "prod_7",
          batchNumber: "MOD-BRD-OLD",
        }),
        createdAt: addDaysTimestamp(-6),
      },
      {
        id: "batch_7b",
        productId: "prod_7",
        batchNumber: "MOD-BRD-NEW",
        supplierId: "sup_2",
        quantity: 10,
        initialQuantity: 10,
        purchasePrice: 34,
        sellingPrice: 45,
        mrp: 45,
        discountPercent: 0,
        manufacturingDate: addDaysIso(0),
        expiryDate: addDaysIso(4),
        qrCodePayload: JSON.stringify({
          type: "RETAIL_IQ_BATCH",
          batchId: "batch_7b",
          productId: "prod_7",
          batchNumber: "MOD-BRD-NEW",
        }),
        createdAt: addDaysTimestamp(0),
      },
    ],
    movements: [
      {
        id: "mov_1",
        productId: "prod_7",
        productName: "Whole Wheat Sandwich Bread",
        batchId: "batch_7b",
        batchNumber: "MOD-BRD-NEW",
        movementType: "IN_QR",
        quantityChange: 10,
        reason: "Morning dairy delivery scanned",
        createdAt: addDaysTimestamp(0),
      },
      {
        id: "mov_2",
        productId: "prod_2",
        productName: "Toned Fresh Milk 500ml",
        batchId: "batch_2a",
        batchNumber: "ND-MLK-01",
        movementType: "OUT_SALE",
        quantityChange: -8,
        reason: "Morning counter sales",
        createdAt: addDaysTimestamp(0),
      },
      {
        id: "mov_3",
        productId: "prod_1",
        productName: "Good Day Butter Biscuits",
        batchId: "batch_1b",
        batchNumber: "GD-2026-B",
        movementType: "IN_MANUAL",
        quantityChange: 30,
        reason: "Restocked from Sri Lakshmi FMCG",
        createdAt: addDaysTimestamp(-5),
      },
    ],
    bills: [],
    sales: [
      {
        id: "sale_1",
        saleDate: addDaysTimestamp(0),
        totalAmount: 477,
        totalDiscount: 10,
        paymentMethod: "UPI",
        source: "manual",
        items: [
          {
            id: "si_1",
            productId: "prod_2",
            productName: "Toned Fresh Milk 500ml",
            batchId: "batch_2a",
            batchNumber: "ND-MLK-01",
            quantity: 8,
            unitPrice: 24,
            purchasePrice: 21,
            discountAmount: 0,
            lineTotal: 192,
          },
          {
            id: "si_2",
            productId: "prod_3",
            productName: "Aashirvaad Whole Wheat Atta 5kg",
            batchId: "batch_3a",
            batchNumber: "ASH-5K-09",
            quantity: 1,
            unitPrice: 285,
            purchasePrice: 245,
            discountAmount: 10,
            lineTotal: 285,
          },
        ],
      },
      {
        id: "sale_2",
        saleDate: addDaysTimestamp(-1),
        totalAmount: 550,
        totalDiscount: 0,
        paymentMethod: "Cash",
        source: "manual",
        items: [
          {
            id: "si_3",
            productId: "prod_4",
            productName: "Dove Cream Beauty Bathing Bar",
            batchId: "batch_4a",
            batchNumber: "DOV-100-X",
            quantity: 6,
            unitPrice: 55,
            purchasePrice: 44,
            discountAmount: 0,
            lineTotal: 330,
          },
          {
            id: "si_4",
            productId: "prod_5",
            productName: "Amul Gold Pasteurised Butter 100g",
            batchId: "batch_5a",
            batchNumber: "AML-BT-14",
            quantity: 4,
            unitPrice: 55,
            purchasePrice: 48,
            discountAmount: 0,
            lineTotal: 220,
          },
        ],
      },
      {
        id: "sale_3",
        saleDate: addDaysTimestamp(-2),
        totalAmount: 855,
        totalDiscount: 30,
        paymentMethod: "UPI",
        source: "bill_scan",
        items: [
          {
            id: "si_5",
            productId: "prod_3",
            productName: "Aashirvaad Whole Wheat Atta 5kg",
            batchId: "batch_3a",
            batchNumber: "ASH-5K-09",
            quantity: 3,
            unitPrice: 285,
            purchasePrice: 245,
            discountAmount: 30,
            lineTotal: 855,
          },
        ],
      },
      {
        id: "sale_4",
        saleDate: addDaysTimestamp(-3),
        totalAmount: 384,
        totalDiscount: 6,
        paymentMethod: "Cash",
        source: "manual",
        items: [
          {
            id: "si_6",
            productId: "prod_1",
            productName: "Good Day Butter Biscuits",
            batchId: "batch_1a",
            batchNumber: "GD-2026-A",
            quantity: 10,
            unitPrice: 10,
            purchasePrice: 8,
            discountAmount: 0,
            lineTotal: 100,
          },
          {
            id: "si_7",
            productId: "prod_6",
            productName: "Tata Tea Gold 250g",
            batchId: "batch_6a",
            batchNumber: "TTG-250-B",
            quantity: 2,
            unitPrice: 142,
            purchasePrice: 118,
            discountAmount: 6,
            lineTotal: 284,
          },
        ],
      },
    ],
    campaigns: [
      {
        id: "camp_1",
        title: "Diwali Family Pantry Saver",
        festival: "Diwali",
        message: "Celebrate Diwali with fresh pantry essentials at special neighbourhood prices!",
        startDate: addDaysIso(0),
        endDate: addDaysIso(7),
        products: [
          {
            productId: "prod_3",
            productName: "Aashirvaad Whole Wheat Atta 5kg",
            batchId: "batch_3a",
            originalPrice: 295,
            discountPercent: 10,
            offerPrice: 265.5,
          },
          {
            productId: "prod_6",
            productName: "Tata Tea Gold 250g",
            batchId: "batch_6a",
            originalPrice: 145,
            discountPercent: 12,
            offerPrice: 127.6,
          },
        ],
        status: "active",
        createdAt: addDaysTimestamp(-2),
      },
    ],
  };
}

export function readDatabase(): RetailDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), "utf-8");
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw) as RetailDatabase;
  } catch {
    const seed = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), "utf-8");
    return seed;
  }
}

export function writeDatabase(db: RetailDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tempFile, DB_FILE);
}

export function resetDatabase(): RetailDatabase {
  const seed = createSeedDatabase();
  writeDatabase(seed);
  return seed;
}

export function getEnvironmentStatus() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const whatsappConfigured = Boolean(
    process.env.WHATSAPP_BUSINESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
  const instagramConfigured = Boolean(
    process.env.INSTAGRAM_ACCESS_TOKEN &&
      process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  );

  const socialIntegrations: SocialIntegrationStatus[] = [
    {
      platform: "whatsapp",
      connected: whatsappConfigured,
      accountName: whatsappConfigured ? "WhatsApp Business Cloud API" : null,
      configuredInEnv: whatsappConfigured,
      note: whatsappConfigured
        ? "Connected via WhatsApp Business Cloud API."
        : "Not connected to WhatsApp Business API. Use one-tap WhatsApp share link or poster download.",
    },
    {
      platform: "instagram",
      connected: instagramConfigured,
      accountName: instagramConfigured ? "Instagram Professional Account" : null,
      configuredInEnv: instagramConfigured,
      note: instagramConfigured
        ? "Connected via Instagram Graph API."
        : "Instagram Graph API credentials not configured. Download poster to share directly from your phone.",
    },
    {
      platform: "facebook",
      connected: false,
      accountName: null,
      configuredInEnv: false,
      note: "Use native share or download poster image for Facebook Page posting.",
    },
  ];

  return {
    supabaseConfigured,
    geminiConfigured,
    socialIntegrations,
  };
}
