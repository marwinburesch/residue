export type FieldKind =
  | "name"
  | "postcode"
  | "purchaseItem"
  | "loyaltyId";

export type FieldDef = {
  kind: FieldKind;
  label: string;
  weight: number;
  samples: readonly string[];
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
  ],
};

export const channels: Record<ChannelId, ChannelDef> = { receipts };
