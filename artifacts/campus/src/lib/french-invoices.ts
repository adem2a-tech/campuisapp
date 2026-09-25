/**
 * Facturation électronique française — mentions CGI / Code de commerce
 * + données e-invoicing 2026 (catégorie PS, SIREN client, option TVA débits)
 * + export XML Factur-X / CII (profil BASIC simplifié) prêt pour une PDP.
 */

export type InvoiceLayoutId = "classique" | "moderne" | "cabinet" | "minimal";

export type VatMode = "franchise_293b" | "tva_20" | "tva_10" | "tva_5_5";

/** Catégorie d’opération — mention e-facture FR (LB / PS / LBPS). */
export type OperationCategory = "PS" | "LB" | "LBPS";

export type InvoiceTemplate = {
  id: InvoiceLayoutId;
  name: string;
  description: string;
  accent: string;
  previewLabel: string;
};

export type SellerProfile = {
  legalName: string;
  tradeName: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  siret: string;
  siren: string;
  tvaIntracom: string;
  legalForm: string;
  capital: string;
  rcsCity: string;
  apeCode: string;
  vatMode: VatMode;
  /** Option TVA sur les débits (mention e-facture). */
  vatOnDebits: boolean;
  iban: string;
  bic: string;
  paymentDelayDays: number;
  defaultService: string;
  defaultUnitPriceHt: number;
  activeTemplateId: InvoiceLayoutId;
  /** Catégorie par défaut des prestations (cabinet = PS). */
  defaultOperationCategory: OperationCategory;
};

export type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  unitPriceHt: number;
};

export type FrenchInvoice = {
  id: string;
  number: string;
  sequence: number;
  createdAt: string;
  issuedOn: string;
  serviceDate: string;
  dueOn: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  templateId: InvoiceLayoutId;
  sellerSnapshot: SellerProfile;
  /** Mentions e-invoicing FR. */
  operationCategory: OperationCategory;
  vatOnDebits: boolean;
  client: {
    clientId?: number;
    name: string;
    email: string;
    phone?: string;
    addressLine1: string;
    postalCode: string;
    city: string;
    /** SIREN client (B2B) — obligatoire pour e-facture adressée à une entreprise. */
    siren?: string;
    siret?: string;
    tvaIntracom?: string;
  };
  lines: InvoiceLine[];
  notes: string;
  /** Lien éventuel avec l’API CAMPUS */
  apiSynced?: boolean;
};

export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  {
    id: "classique",
    name: "Classique France",
    description: "Mise en page sobre, mentions légales bien visibles — idéal cabinet.",
    accent: "#1a332c",
    previewLabel: "Sérieux · lisible",
  },
  {
    id: "moderne",
    name: "Moderne",
    description: "En-tête net, tableaux clairs, bon pour envoi numérique.",
    accent: "#0e7490",
    previewLabel: "Numérique · clair",
  },
  {
    id: "cabinet",
    name: "Cabinet bien-être",
    description: "Ton chaleureux, adapté aux professions manuelles / ventouses.",
    accent: "#8a6b12",
    previewLabel: "Chaleureux · pro",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Épuré, focus montants et conformité.",
    accent: "#334155",
    previewLabel: "Épuré · rapide",
  },
];

const SELLER_KEY = "campus-invoice-seller-v1";
const INVOICES_KEY = "campus-french-invoices-v1";
const SEQ_KEY = "campus-invoice-sequence-v1";

export function digitsOnly(value: string) {
  return (value || "").replace(/\D/g, "");
}

/** SIREN = 9 premiers chiffres du SIRET. */
export function sirenFromSiret(siret: string) {
  const d = digitsOnly(siret);
  return d.length >= 9 ? d.slice(0, 9) : d;
}

export function defaultSellerProfile(partial?: Partial<SellerProfile>): SellerProfile {
  const base: SellerProfile = {
    legalName: "",
    tradeName: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    city: "",
    country: "France",
    email: "",
    phone: "",
    siret: "",
    siren: "",
    tvaIntracom: "",
    legalForm: "Entrepreneur individuel",
    capital: "",
    rcsCity: "",
    apeCode: "",
    vatMode: "franchise_293b",
    vatOnDebits: false,
    iban: "",
    bic: "",
    paymentDelayDays: 30,
    defaultService: "Séance de thérapie par ventouses",
    defaultUnitPriceHt: 65,
    activeTemplateId: "classique",
    defaultOperationCategory: "PS",
    ...partial,
  };
  if (!base.siren && base.siret) base.siren = sirenFromSiret(base.siret);
  return base;
}

export function loadSellerProfile(): SellerProfile {
  try {
    const raw = localStorage.getItem(SELLER_KEY);
    if (!raw) return defaultSellerProfile();
    return { ...defaultSellerProfile(), ...JSON.parse(raw) };
  } catch {
    return defaultSellerProfile();
  }
}

export function saveSellerProfile(profile: SellerProfile) {
  localStorage.setItem(SELLER_KEY, JSON.stringify(profile));
}

export function loadFrenchInvoices(): FrenchInvoice[] {
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((inv: FrenchInvoice) => ({
      ...inv,
      operationCategory: inv.operationCategory || "PS",
      vatOnDebits: inv.vatOnDebits ?? inv.sellerSnapshot?.vatOnDebits ?? false,
      sellerSnapshot: {
        ...defaultSellerProfile(),
        ...(inv.sellerSnapshot || {}),
      },
      client: {
        ...inv.client,
        siren: inv.client?.siren,
        siret: inv.client?.siret,
      },
    }));
  } catch {
    return [];
  }
}

function saveFrenchInvoices(list: FrenchInvoice[]) {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(list));
}

export function getNextInvoiceSequence(year = new Date().getFullYear()): number {
  try {
    const raw = localStorage.getItem(SEQ_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    const current = Number(map[String(year)] || 0);
    const next = current + 1;
    map[String(year)] = next;
    localStorage.setItem(SEQ_KEY, JSON.stringify(map));
    return next;
  } catch {
    return Date.now() % 100000;
  }
}

export function formatInvoiceNumber(sequence: number, year = new Date().getFullYear()) {
  return `FAC-${year}-${String(sequence).padStart(5, "0")}`;
}

export function vatRateFor(mode: VatMode): number {
  if (mode === "tva_20") return 0.2;
  if (mode === "tva_10") return 0.1;
  if (mode === "tva_5_5") return 0.055;
  return 0;
}

export function vatLabel(mode: VatMode): string {
  if (mode === "franchise_293b") return "TVA non applicable, art. 293 B du CGI";
  if (mode === "tva_20") return "TVA 20 %";
  if (mode === "tva_10") return "TVA 10 %";
  return "TVA 5,5 %";
}

export function computeTotals(lines: InvoiceLine[], vatMode: VatMode) {
  const totalHt = lines.reduce((sum, l) => sum + l.quantity * l.unitPriceHt, 0);
  const rate = vatRateFor(vatMode);
  const totalTva = Math.round(totalHt * rate * 100) / 100;
  const totalTtc = Math.round((totalHt + totalTva) * 100) / 100;
  return {
    totalHt: Math.round(totalHt * 100) / 100,
    totalTva,
    totalTtc,
    rate,
  };
}

export function addDaysIso(isoDate: string, days: number) {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createFrenchInvoice(input: {
  client: FrenchInvoice["client"];
  lines: InvoiceLine[];
  issuedOn?: string;
  serviceDate?: string;
  notes?: string;
  status?: FrenchInvoice["status"];
  seller?: SellerProfile;
  operationCategory?: OperationCategory;
  vatOnDebits?: boolean;
}): FrenchInvoice {
  const seller = input.seller ?? loadSellerProfile();
  const issuedOn = input.issuedOn ?? new Date().toISOString().slice(0, 10);
  const year = Number(issuedOn.slice(0, 4));
  const sequence = getNextInvoiceSequence(year);
  const siren =
    seller.siren || (seller.siret ? sirenFromSiret(seller.siret) : "");
  const invoice: FrenchInvoice = {
    id: `inv-${Date.now()}`,
    number: formatInvoiceNumber(sequence, year),
    sequence,
    createdAt: new Date().toISOString(),
    issuedOn,
    serviceDate: input.serviceDate ?? issuedOn,
    dueOn: addDaysIso(issuedOn, seller.paymentDelayDays || 30),
    status: input.status ?? "sent",
    templateId: seller.activeTemplateId,
    sellerSnapshot: { ...seller, siren },
    operationCategory: input.operationCategory ?? seller.defaultOperationCategory ?? "PS",
    vatOnDebits: input.vatOnDebits ?? seller.vatOnDebits ?? false,
    client: {
      ...input.client,
      siren: digitsOnly(input.client.siren || "") || undefined,
      siret: digitsOnly(input.client.siret || "") || undefined,
    },
    lines: input.lines,
    notes: input.notes ?? "",
  };
  const list = loadFrenchInvoices();
  saveFrenchInvoices([invoice, ...list]);
  return invoice;
}

export function updateFrenchInvoiceStatus(id: string, status: FrenchInvoice["status"]) {
  const list = loadFrenchInvoices().map((inv) => (inv.id === id ? { ...inv, status } : inv));
  saveFrenchInvoices(list);
  return list.find((i) => i.id === id) ?? null;
}

export function getFrenchInvoice(id: string) {
  return loadFrenchInvoices().find((i) => i.id === id) ?? null;
}

export function sellerIsReady(s: SellerProfile) {
  return Boolean(s.legalName.trim() && s.addressLine1.trim() && s.postalCode.trim() && s.city.trim() && s.siret.trim());
}

/** Mentions légales de bas de page (retard de paiement — Code commerce). */
export function latePaymentMentions(paymentDelayDays: number) {
  return [
    `Conditions de règlement : paiement à ${paymentDelayDays} jours.`,
    "En cas de retard de paiement, une pénalité égale à trois fois le taux d’intérêt légal sera due, ainsi qu’une indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 et D441-5 du Code de commerce).",
    "Pas d’escompte pour paiement anticipé.",
  ];
}

export function moneyFr(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export function operationCategoryLabel(cat: OperationCategory) {
  if (cat === "LB") return "Livraison de biens (LB)";
  if (cat === "LBPS") return "Opération mixte biens / services (LBPS)";
  return "Prestation de services (PS)";
}

function xmlEscape(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function amount2(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/**
 * Export XML Cross Industry Invoice (CII) — base Factur-X / e-facture FR.
 * À transmettre via une plateforme agréée (PDP) pour conformité e-invoicing.
 */
export function buildFacturXXml(invoice: FrenchInvoice): string {
  const s = invoice.sellerSnapshot;
  const t = computeTotals(invoice.lines, s.vatMode);
  const sellerSiren = digitsOnly(s.siren) || sirenFromSiret(s.siret);
  const clientSiren = digitsOnly(invoice.client.siren || "");
  const ratePct = (vatRateFor(s.vatMode) * 100).toFixed(2);
  const taxCategory = s.vatMode === "franchise_293b" ? "E" : "S";
  const exemption =
    s.vatMode === "franchise_293b"
      ? `<ram:ExemptionReason>TVA non applicable, art. 293 B du CGI</ram:ExemptionReason>`
      : "";

  const lineXml = invoice.lines
    .map((l, i) => {
      const lineHt = l.quantity * l.unitPriceHt;
      return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${i + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${xmlEscape(l.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${amount2(l.unitPriceHt)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${l.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${taxCategory}</ram:CategoryCode>
          <ram:RateApplicablePercent>${ratePct}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${amount2(lineHt)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${xmlEscape(invoice.number)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${invoice.issuedOn.replace(/-/g, "")}</udt:DateTimeString>
    </ram:IssueDateTime>
    <ram:IncludedNote>
      <ram:Content>Catégorie d'opération : ${invoice.operationCategory} — ${xmlEscape(operationCategoryLabel(invoice.operationCategory))}</ram:Content>
    </ram:IncludedNote>
    ${
      invoice.vatOnDebits
        ? `<ram:IncludedNote><ram:Content>Option pour le paiement de la TVA d'après les débits</ram:Content></ram:IncludedNote>`
        : ""
    }
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    ${lineXml}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${xmlEscape(s.tradeName || s.legalName)}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${xmlEscape(sellerSiren)}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${xmlEscape(s.postalCode)}</ram:PostcodeCode>
          <ram:LineOne>${xmlEscape(s.addressLine1)}</ram:LineOne>
          ${s.addressLine2 ? `<ram:LineTwo>${xmlEscape(s.addressLine2)}</ram:LineTwo>` : ""}
          <ram:CityName>${xmlEscape(s.city)}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        ${
          s.tvaIntracom
            ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${xmlEscape(s.tvaIntracom)}</ram:ID></ram:SpecifiedTaxRegistration>`
            : ""
        }
        ${
          s.siret
            ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="0009">${xmlEscape(digitsOnly(s.siret))}</ram:ID></ram:SpecifiedTaxRegistration>`
            : ""
        }
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${xmlEscape(invoice.client.name)}</ram:Name>
        ${
          clientSiren
            ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${xmlEscape(clientSiren)}</ram:ID></ram:SpecifiedLegalOrganization>`
            : ""
        }
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${xmlEscape(invoice.client.postalCode)}</ram:PostcodeCode>
          <ram:LineOne>${xmlEscape(invoice.client.addressLine1)}</ram:LineOne>
          <ram:CityName>${xmlEscape(invoice.client.city)}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        ${
          invoice.client.tvaIntracom
            ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${xmlEscape(invoice.client.tvaIntracom)}</ram:ID></ram:SpecifiedTaxRegistration>`
            : ""
        }
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${invoice.serviceDate.replace(/-/g, "")}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:PaymentReference>${xmlEscape(invoice.number)}</ram:PaymentReference>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      ${
        s.iban
          ? `<ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${xmlEscape(digitsOnly(s.iban) ? s.iban.replace(/\s/g, "") : s.iban)}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
        ${s.bic ? `<ram:PayeeSpecifiedCreditorFinancialInstitution><ram:BICID>${xmlEscape(s.bic)}</ram:BICID></ram:PayeeSpecifiedCreditorFinancialInstitution>` : ""}
      </ram:SpecifiedTradeSettlementPaymentMeans>`
          : ""
      }
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${amount2(t.totalTva)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${amount2(t.totalHt)}</ram:BasisAmount>
        <ram:CategoryCode>${taxCategory}</ram:CategoryCode>
        ${exemption}
        <ram:RateApplicablePercent>${ratePct}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradePaymentTerms>
        <ram:Description>${xmlEscape(`Paiement à ${s.paymentDelayDays} jours`)}</ram:Description>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${invoice.dueOn.replace(/-/g, "")}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${amount2(t.totalHt)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${amount2(t.totalHt)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${amount2(t.totalTva)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${amount2(t.totalTtc)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${amount2(t.totalTtc)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}

export function downloadFacturXXml(invoice: FrenchInvoice) {
  const xml = buildFacturXXml(invoice);
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoice.number}-factur-x.xml`;
  a.click();
  URL.revokeObjectURL(url);
}
