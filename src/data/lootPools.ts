export type FieldKind =
  | "name"
  | "email"
  | "postcode"
  | "purchaseItem"
  | "loyaltyId"
  | "paymentLast4"
  | "storeLocation"
  | "totalAmount";

export type FieldDef = {
  kind: FieldKind;
  label: string;
  weight: number;
  samples: readonly string[];
  allowMultiple?: boolean;
  requiresPerson?: boolean;
};

export type ChannelId = "receipts";

export type ChannelDef = {
  id: ChannelId;
  label: string;
  pool: readonly FieldDef[];
  fieldsPerContainer: readonly [min: number, max: number];
};

export const receipts: ChannelDef = {
  id: "receipts",
  label: "Discarded receipts",
  fieldsPerContainer: [2, 4],
  pool: [
    {
      kind: "name",
      label: "Customer name",
      weight: 3,
      samples: ["T. Marlow", "R. Osei", "K. Bender", "A. Yilmaz", "S. Devlin"],
    },
    {
      kind: "postcode",
      label: "Postcode",
      weight: 3,
      samples: ["E17 4QL", "N1 3BD", "SE15 2NU", "W12 8RP", "NW5 1TL"],
    },
    {
      kind: "purchaseItem",
      label: "Purchase item",
      weight: 4,
      allowMultiple: true,
      samples: [
        "Ibuprofen 200mg",
        "Semi-skimmed milk",
        "Printer paper A4",
        "Hair dye, ash brown",
        "Pregnancy test (single)",
        "Oat milk 1L",
      ],
    },
    {
      kind: "loyaltyId",
      label: "Loyalty ID",
      weight: 2,
      samples: ["LY-48823", "LY-10194", "LY-77312", "LY-22806"],
    },
    {
      kind: "email",
      label: "Email",
      weight: 2,
      requiresPerson: true,
      samples: [],
    },
    {
      kind: "paymentLast4",
      label: "Card last-4",
      weight: 3,
      samples: ["•••• 4417", "•••• 0921", "•••• 7765", "•••• 3308", "•••• 1192"],
    },
    {
      kind: "storeLocation",
      label: "Store branch",
      weight: 3,
      samples: [
        "Branch #214 — Hackney",
        "Branch #019 — Peckham",
        "Branch #087 — Camden",
        "Branch #132 — Shepherd's Bush",
      ],
    },
    {
      kind: "totalAmount",
      label: "Total",
      weight: 3,
      samples: ["£4.29", "£12.80", "£27.45", "£3.10", "£58.99", "£9.74"],
    },
  ],
};

export const channels: Record<ChannelId, ChannelDef> = { receipts };
