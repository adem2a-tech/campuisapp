import { useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import {
  Check,
  Download,
  FileText,
  Lock,
  Mail,
  MessageSquare,
  Plus,
  Printer,
  Send,
  Settings2,
  X,
} from "lucide-react";
import {
  INVOICE_TEMPLATES,
  addDaysIso,
  computeTotals,
  createFrenchInvoice,
  downloadFacturXXml,
  getFrenchInvoice,
  latePaymentMentions,
  loadFrenchInvoices,
  loadSellerProfile,
  moneyFr,
  operationCategoryLabel,
  saveSellerProfile,
  sellerIsReady,
  sirenFromSiret,
  updateFrenchInvoiceStatus,
  vatLabel,
  type FrenchInvoice,
  type InvoiceLayoutId,
  type InvoiceLine,
  type OperationCategory,
  type SellerProfile,
  type VatMode,
} from "@/lib/french-invoices";
import {
  getAppPin,
  hasAppPin,
  isBillingUnlocked,
  lockBilling,
  setAppPin,
  unlockBilling,
  verifyAppPin,
} from "@/lib/app-pin";
import {
  listUnbilledSessions,
  markSessionBilled,
  markSessionsBilled,
  serviceLabelFromSession,
  type BillableSession,
} from "@/lib/billing-from-sessions";
import { PinPad } from "@/components/pin-pad";
import { cn } from "@/lib/utils";

type ClientOpt = { id: number; firstName: string; lastName: string; email?: string; phone?: string };

type Props = {
  clients: ClientOpt[];
  /** Séances (API + local) — pour facturer comme Milo depuis le planning. */
  sessions?: BillableSession[];
  SectionHeading: (p: {
    eyebrow?: string;
    title: string;
    detail?: string;
    action?: ReactNode;
  }) => ReactNode;
  PrimaryButton: (p: ButtonHTMLAttributes<HTMLButtonElement>) => ReactNode;
  GhostButton: (p: ButtonHTMLAttributes<HTMLButtonElement>) => ReactNode;
  Metric: (p: {
    icon: typeof FileText;
    label: string;
    value: ReactNode;
    detail: string;
    tone: string;
  }) => ReactNode;
  Pill: (p: { children: ReactNode; tone?: "neutral" | "green" | "orange" | "red" }) => ReactNode;
  Toast: (p: { message: string; onClose: () => void }) => ReactNode;
  onSyncApi?: (payload: {
    clientId: number;
    serviceName: string;
    amount: number;
    issuedOn: string;
    status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  }) => void;
};

export function BillingHub({
  clients,
  sessions = [],
  SectionHeading,
  PrimaryButton,
  GhostButton,
  Metric,
  Pill,
  Toast,
  onSyncApi,
}: Props) {
  const [unlocked, setUnlocked] = useState(() => isBillingUnlocked());
  const [pinError, setPinError] = useState("");
  const [setupMode, setSetupMode] = useState(() => !hasAppPin());
  const [setupConfirm, setSetupConfirm] = useState<string | null>(null);

  const [seller, setSeller] = useState<SellerProfile>(() => loadSellerProfile());
  const [sellerDraft, setSellerDraft] = useState<SellerProfile>(() => loadSellerProfile());
  const [invoices, setInvoices] = useState<FrenchInvoice[]>(() => loadFrenchInvoices());
  const [tab, setTab] = useState<"afacturer" | "factures" | "creer" | "modeles" | "emetteur">("afacturer");
  const [toast, setToast] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<number[]>([]);
  const [billedTick, setBilledTick] = useState(0);

  const [clientId, setClientId] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPostal, setClientPostal] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientSiren, setClientSiren] = useState("");
  const [clientSiret, setClientSiret] = useState("");
  const [operationCategory, setOperationCategory] = useState<OperationCategory>(
    () => loadSellerProfile().defaultOperationCategory || "PS",
  );
  const [issuedOn, setIssuedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<InvoiceLine[]>(() => [
    {
      id: "l1",
      description: loadSellerProfile().defaultService || "Séance de thérapie par ventouses",
      quantity: 1,
      unitPriceHt: loadSellerProfile().defaultUnitPriceHt || 65,
    },
  ]);

  const previewInvoice = previewId ? getFrenchInvoice(previewId) : null;
  const totals = useMemo(() => computeTotals(lines, seller.vatMode), [lines, seller.vatMode]);
  const paid = invoices
    .filter((i) => i.status === "paid")
    .reduce((a, i) => a + computeTotals(i.lines, i.sellerSnapshot.vatMode).totalTtc, 0);
  const pending = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((a, i) => a + computeTotals(i.lines, i.sellerSnapshot.vatMode).totalTtc, 0);
  const issued = invoices
    .filter((i) => i.status !== "cancelled")
    .reduce((a, i) => a + computeTotals(i.lines, i.sellerSnapshot.vatMode).totalTtc, 0);

  const unbilled = useMemo(() => {
    void billedTick;
    return listUnbilledSessions(sessions);
  }, [sessions, billedTick]);

  function invoiceFromSession(session: BillableSession) {
    if (!sellerIsReady(seller)) {
      setToast("Complétez d’abord l’émetteur (SIRET, adresse…) dans l’onglet Émetteur.");
      setTab("emetteur");
      return;
    }
    const client = clients.find((c) => c.id === session.clientId);
    const issuedOn = session.occurredAt.slice(0, 10);
    const description = serviceLabelFromSession(session, seller.defaultService);
    const inv = createFrenchInvoice({
      client: {
        clientId: session.clientId,
        name: session.clientName || `${client?.firstName || ""} ${client?.lastName || ""}`.trim() || "Client",
        email: client?.email || "",
        phone: client?.phone || "",
        addressLine1: "",
        postalCode: "",
        city: "",
      },
      lines: [
        {
          id: `l-${session.id}`,
          description,
          quantity: 1,
          unitPriceHt: seller.defaultUnitPriceHt || 65,
        },
      ],
      issuedOn,
      serviceDate: issuedOn,
      notes: session.observations?.trim() || "",
      status: "sent",
      seller,
      operationCategory: "PS",
    });
    markSessionBilled(session.id, inv.id);
    setBilledTick((t) => t + 1);
    setInvoices(loadFrenchInvoices());
    setPreviewId(inv.id);
    setSendOpen(true);
    setTab("factures");
    setToast(`Facture ${inv.number} créée depuis la séance — style Milo (1 clic)`);
    if (onSyncApi) {
      onSyncApi({
        clientId: session.clientId,
        serviceName: description,
        amount: computeTotals(inv.lines, seller.vatMode).totalTtc,
        issuedOn,
        status: "sent",
      });
    }
  }

  function invoiceSelectedSessions() {
    if (!sellerIsReady(seller)) {
      setToast("Complétez d’abord l’émetteur (SIRET…) dans Émetteur.");
      setTab("emetteur");
      return;
    }
    const picked = unbilled.filter((s) => selectedSessionIds.includes(s.id));
    if (picked.length === 0) {
      setToast("Sélectionnez au moins une séance.");
      return;
    }
    // Group by client like Milo multi-patient (one invoice per client)
    const byClient = new Map<number, BillableSession[]>();
    for (const s of picked) {
      const list = byClient.get(s.clientId) || [];
      list.push(s);
      byClient.set(s.clientId, list);
    }
    let lastId: string | null = null;
    let count = 0;
    for (const [clientId, group] of byClient) {
      const client = clients.find((c) => c.id === clientId);
      const name = group[0]!.clientName || `${client?.firstName || ""} ${client?.lastName || ""}`.trim();
      const issuedOn = new Date().toISOString().slice(0, 10);
      const lines = group.map((s) => ({
        id: `l-${s.id}`,
        description: serviceLabelFromSession(s, seller.defaultService),
        quantity: 1,
        unitPriceHt: seller.defaultUnitPriceHt || 65,
      }));
      const inv = createFrenchInvoice({
        client: {
          clientId,
          name: name || "Client",
          email: client?.email || "",
          phone: client?.phone || "",
          addressLine1: "",
          postalCode: "",
          city: "",
        },
        lines,
        issuedOn,
        serviceDate: group[0]!.occurredAt.slice(0, 10),
        status: "sent",
        seller,
        operationCategory: "PS",
      });
      markSessionsBilled(
        group.map((s) => s.id),
        inv.id,
      );
      lastId = inv.id;
      count += 1;
      if (onSyncApi) {
        onSyncApi({
          clientId,
          serviceName: lines.map((l) => l.description).join(", "),
          amount: computeTotals(lines, seller.vatMode).totalTtc,
          issuedOn,
          status: "sent",
        });
      }
    }
    setBilledTick((t) => t + 1);
    setSelectedSessionIds([]);
    setInvoices(loadFrenchInvoices());
    if (lastId) {
      setPreviewId(lastId);
      setSendOpen(true);
    }
    setTab("factures");
    setToast(
      count === 1
        ? "Facture groupée créée"
        : `${count} factures créées (1 par client) — facturation multi-patient`,
    );
  }

  function toggleSession(id: number) {
    setSelectedSessionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handlePin(pin: string) {
    if (setupMode) {
      if (!setupConfirm) {
        setSetupConfirm(pin);
        setPinError("");
        return;
      }
      if (pin !== setupConfirm) {
        setPinError("Les codes ne correspondent pas. Recommencez.");
        setSetupConfirm(null);
        return;
      }
      setAppPin(pin);
      unlockBilling();
      setUnlocked(true);
      setSetupMode(false);
      setSetupConfirm(null);
      setToast("Code enregistré — Facturation déverrouillée");
      return;
    }
    if (verifyAppPin(pin)) {
      unlockBilling();
      setUnlocked(true);
      setPinError("");
    } else {
      setPinError("Code incorrect");
    }
  }

  function persistSeller(next: SellerProfile) {
    setSeller(next);
    setSellerDraft(next);
    saveSellerProfile(next);
  }

  function saveEmetteur() {
    persistSeller(sellerDraft);
    setToast("Informations émetteur enregistrées");
  }

  function selectTemplate(id: InvoiceLayoutId) {
    const next = { ...seller, activeTemplateId: id };
    persistSeller(next);
    setToast(`Modèle « ${INVOICE_TEMPLATES.find((t) => t.id === id)?.name} » actif pour toutes les prochaines factures`);
  }

  function onPickClient(id: string) {
    setClientId(id);
    const c = clients.find((x) => String(x.id) === id);
    if (c) {
      setClientName(`${c.firstName} ${c.lastName}`);
      setClientEmail(c.email || "");
      setClientPhone(c.phone || "");
    }
  }

  function createInvoice() {
    if (!sellerIsReady(seller)) {
      setToast("Complétez d’abord l’émetteur (SIRET, adresse…) dans l’onglet Émetteur.");
      setTab("emetteur");
      return;
    }
    if (!clientName.trim()) {
      setToast("Indiquez le nom du client.");
      return;
    }
    if (!lines.length || lines.some((l) => !l.description.trim() || l.quantity <= 0)) {
      setToast("Vérifiez les lignes de prestation.");
      return;
    }

    const inv = createFrenchInvoice({
      client: {
        clientId: clientId ? Number(clientId) : undefined,
        name: clientName.trim(),
        email: clientEmail.trim(),
        phone: clientPhone.trim(),
        addressLine1: clientAddress.trim(),
        postalCode: clientPostal.trim(),
        city: clientCity.trim(),
        siren: clientSiren.trim() || (clientSiret ? sirenFromSiret(clientSiret) : undefined),
        siret: clientSiret.trim() || undefined,
      },
      lines,
      issuedOn,
      serviceDate,
      notes,
      status: "sent",
      seller,
      operationCategory,
      vatOnDebits: seller.vatOnDebits,
    });
    setInvoices(loadFrenchInvoices());
    setPreviewId(inv.id);
    setSendOpen(true);
    setTab("factures");
    setToast(`Facture électronique ${inv.number} générée — PDF + XML Factur-X disponibles`);

    if (onSyncApi && clientId) {
      onSyncApi({
        clientId: Number(clientId),
        serviceName: lines.map((l) => l.description).join(", "),
        amount: computeTotals(lines, seller.vatMode).totalTtc,
        issuedOn,
        status: "sent",
      });
    }
  }

  if (!unlocked) {
    return (
      <div className="animate-enter flex min-h-[60vh] items-center justify-center">
        {toast && <Toast message={toast} onClose={() => setToast("")} />}
        <div className="surface w-full max-w-md rounded-3xl p-8 shadow-lg">
          <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
            <Lock size={22} />
          </div>
          <PinPad
            title={setupMode ? (setupConfirm ? "Confirmez le code" : "Créer votre code") : "Facturation protégée"}
            subtitle={
              setupMode
                ? setupConfirm
                  ? "Saisissez une seconde fois le même code à 5 chiffres"
                  : "Choisissez le code PIN (5 chiffres) utilisé pour entrer dans CAMPUS"
                : "Entrez le même code à 5 chiffres que pour ouvrir l’application"
            }
            error={pinError}
            onComplete={handlePin}
          />
          {!setupMode && !getAppPin() ? (
            <button
              type="button"
              className="mt-6 w-full text-sm font-semibold text-primary"
              onClick={() => setSetupMode(true)}
            >
              Définir un code PIN
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (previewInvoice) {
    return (
      <div className="animate-enter">
        {toast && <Toast message={toast} onClose={() => setToast("")} />}
        {sendOpen ? (
          <SendInvoicePanel
            invoice={previewInvoice}
            onClose={() => setSendOpen(false)}
            onToast={setToast}
            PrimaryButton={PrimaryButton}
            GhostButton={GhostButton}
          />
        ) : null}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button type="button" className="text-sm font-medium text-slate-600 hover:text-slate-900" onClick={() => setPreviewId(null)}>
              ← Retour facturation
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewId(null)}
              className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              aria-label="Fermer"
              data-testid="button-close-invoice-preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="mb-4 flex flex-wrap gap-2 print:hidden">
            <GhostButton
              type="button"
              onClick={() => {
                updateFrenchInvoiceStatus(previewInvoice.id, "paid");
                setInvoices(loadFrenchInvoices());
                setToast("Marquée payée");
              }}
            >
              Marquer payée
            </GhostButton>            <GhostButton
              type="button"
              onClick={() => {
                downloadFacturXXml(previewInvoice);
                setToast("XML Factur-X (CII) téléchargé — à déposer sur votre plateforme agréée (PDP)");
              }}
              data-testid="button-download-facturx"
            >
              <Download size={16} /> XML Factur-X
            </GhostButton>
            <GhostButton type="button" onClick={() => setSendOpen(true)} data-testid="button-send-invoice">
              <Send size={16} /> Envoyer
            </GhostButton>
            <PrimaryButton type="button" onClick={() => window.print()} data-testid="button-print-invoice">
              <Printer size={16} /> Imprimer / PDF
            </PrimaryButton>
          </div>
        <InvoiceDocument invoice={previewInvoice} />
      </div>
    );
  }

  return (
    <div className="animate-enter">
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      <SectionHeading
        eyebrow="Facturation professionnelle"
        title="Facturation"
        detail="Séances à facturer, modèles durables, e-facture FR — e-mail et SMS."
        action={
          <div className="flex flex-wrap gap-2">
            <GhostButton
              type="button"
              onClick={() => {
                lockBilling();
                setUnlocked(false);
              }}
            >
              <Lock size={15} /> Verrouiller
            </GhostButton>
            <PrimaryButton
              type="button"
              onClick={() => setTab("creer")}
              data-testid="button-create-invoice"
            >
              <Plus size={17} /> Créer une facture
            </PrimaryButton>
          </div>
        }
      />

      <div className="mb-5 inline-flex flex-wrap gap-1 rounded-2xl glass-tab-bar p-1.5">
        {(
          [
            ["afacturer", "À facturer"],
            ["factures", "Mes factures"],
            ["creer", "Créer"],
            ["modeles", "Modèles"],
            ["emetteur", "Émetteur"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-xl px-3.5 py-2 text-sm font-semibold transition",
              tab === id ? "glass-tab-active" : "text-slate-600 hover:bg-white/60",
            )}
          >
            {label}
            {id === "afacturer" && unbilled.length > 0 ? (
              <span className="ml-1.5 inline-grid size-5 place-items-center rounded-full bg-white/25 text-[10px]">
                {unbilled.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Metric icon={FileText} label="Séances à facturer" value={unbilled.length} detail="Comme Milo : depuis les séances" tone="teal" />
        <Metric icon={Download} label="CA facturé" value={moneyFr(issued)} detail="Émis (hors annulées)" tone="sand" />
        <Metric icon={Check} label="Encaissé" value={moneyFr(paid)} detail="Statut payée" tone="lilac" />
        <Metric icon={Settings2} label="En attente" value={moneyFr(pending)} detail="Émises non payées" tone="teal" />
      </div>

      {!sellerIsReady(seller) && (
        <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Avant d’émettre une facture utilisable, renseignez votre identité professionnelle dans l’onglet{" "}
          <button type="button" className="font-semibold underline" onClick={() => setTab("emetteur")}>
            Émetteur
          </button>
          .
        </div>
      )}

      {tab === "afacturer" && (
        <div className="space-y-5">
          <div className="surface overflow-hidden rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
              <div>
                <p className="text-sm font-semibold">Séances à facturer</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sélectionnez des séances documentées, puis facturez en un clic. Sinon créez une facture dans l’onglet Créer.
                </p>
              </div>
              <PrimaryButton
                type="button"
                disabled={selectedSessionIds.length === 0}
                onClick={invoiceSelectedSessions}
                data-testid="button-bulk-invoice"
              >
                <Send size={16} /> Tout facturer ({selectedSessionIds.length})
              </PrimaryButton>
            </div>
            <div className="divide-y divide-border/60">
              {unbilled.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Aucune séance documentée en attente —{" "}
                  <button type="button" className="font-semibold text-primary underline" onClick={() => setTab("creer")}>
                    créer une facture
                  </button>
                  .
                </div>
              ) : (
                unbilled.map((s) => {
                  const zones = (s.zones || []).map((z) => z.label).filter(Boolean).join(" · ");
                  const selected = selectedSessionIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center gap-3 px-5 py-4 sm:flex-nowrap"
                      data-testid={`row-unbilled-${s.id}`}
                    >
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={selected}
                        onChange={() => toggleSession(s.id)}
                        aria-label={`Sélectionner séance ${s.id}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{s.clientName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(s.occurredAt.slice(0, 10))} · {s.durationMinutes} min
                          {zones ? ` · ${zones}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">{serviceLabelFromSession(s, seller.defaultService)}</p>
                      </div>
                      <strong className="font-mono text-sm">{moneyFr(seller.defaultUnitPriceHt || 65)}</strong>
                      <GhostButton type="button" onClick={() => invoiceFromSession(s)} data-testid={`button-invoice-session-${s.id}`}>
                        Facturer
                      </GhostButton>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "factures" && (
        <div className="surface overflow-hidden rounded-2xl">
          <div className="border-b border-border/70 px-5 py-4">
            <p className="text-sm font-semibold">Factures récentes</p>
            <p className="mt-1 text-xs text-muted-foreground">Ouvrez une facture pour l’imprimer ou l’envoyer par e-mail / SMS.</p>
          </div>
          <div className="divide-y divide-border/60">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Aucune facture — créez-en une depuis l’onglet Créer.</div>
            ) : (
              invoices.map((i) => {
                const t = computeTotals(i.lines, i.sellerSnapshot.vatMode);
                return (
                  <button
                    key={i.id}
                    type="button"
                    className="grid w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-muted/30 sm:grid-cols-[1fr_1.2fr_.7fr_.6fr]"
                    onClick={() => setPreviewId(i.id)}
                    data-testid={`row-invoice-${i.id}`}
                  >
                    <div>
                      <p className="font-mono text-xs">{i.number}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(i.issuedOn)}</p>
                    </div>
                    <span className="text-sm">
                      {i.client.name}
                      <span className="block text-xs text-muted-foreground">{i.lines[0]?.description}</span>
                    </span>
                    <strong className="font-mono text-sm">{moneyFr(t.totalTtc)}</strong>
                    <Pill tone={i.status === "paid" ? "green" : i.status === "overdue" ? "red" : "orange"}>
                      {statusLabel(i.status)}
                    </Pill>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {tab === "creer" && (
        <div className="surface space-y-5 rounded-2xl p-5 md:p-6">
          <p className="text-sm text-slate-600">
            Modèle actif : <strong>{INVOICE_TEMPLATES.find((t) => t.id === seller.activeTemplateId)?.name}</strong>. Après génération, envoi par e-mail et SMS du client.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-xs font-medium text-slate-500">
              Client enregistré (optionnel)
              <select
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={clientId}
                onChange={(e) => onPickClient(e.target.value)}
                data-testid="select-invoice-client"
              >
                <option value="">— Saisie libre —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Nom du client *
              <input className={inputCls} value={clientName} onChange={(e) => setClientName(e.target.value)} required data-testid="input-invoice-client-name" />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              E-mail client
              <input className={inputCls} type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@exemple.fr" data-testid="input-invoice-client-email" />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Téléphone client
              <input className={inputCls} value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="06 00 00 00 00" data-testid="input-invoice-client-phone" />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Adresse client
              <input className={inputCls} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Code postal
              <input className={inputCls} value={clientPostal} onChange={(e) => setClientPostal(e.target.value)} />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Ville
              <input className={inputCls} value={clientCity} onChange={(e) => setClientCity(e.target.value)} />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              SIREN client (B2B / e-facture)
              <input
                className={inputCls}
                value={clientSiren}
                onChange={(e) => setClientSiren(e.target.value)}
                placeholder="9 chiffres — obligatoire si client assujetti"
                data-testid="input-invoice-client-siren"
              />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              SIRET client (optionnel)
              <input
                className={inputCls}
                value={clientSiret}
                onChange={(e) => {
                  setClientSiret(e.target.value);
                  if (!clientSiren.trim() && e.target.value.replace(/\D/g, "").length >= 9) {
                    setClientSiren(sirenFromSiret(e.target.value));
                  }
                }}
                placeholder="14 chiffres"
              />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Catégorie d’opération *
              <select
                className={inputCls}
                value={operationCategory}
                onChange={(e) => setOperationCategory(e.target.value as OperationCategory)}
                data-testid="select-operation-category"
              >
                <option value="PS">Prestation de services (PS)</option>
                <option value="LB">Livraison de biens (LB)</option>
                <option value="LBPS">Mixte biens / services (LBPS)</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Date d’émission
              <input type="date" className={inputCls} value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} data-testid="input-invoice-date" />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Date de prestation
              <input type="date" className={inputCls} value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
            </label>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-slate-500">Lignes</p>
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={line.id} className="grid gap-2 rounded-xl border border-border/70 bg-white/80 p-3 md:grid-cols-[1.6fr_.5fr_.7fr_auto]">
                  <input
                    className={inputCls}
                    value={line.description}
                    onChange={(e) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, description: e.target.value } : l)))}
                    placeholder="Désignation"
                    data-testid={idx === 0 ? "input-invoice-service" : undefined}
                  />
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={line.quantity}
                    onChange={(e) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, quantity: Number(e.target.value) || 1 } : l)))}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={inputCls}
                    value={line.unitPriceHt}
                    onChange={(e) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, unitPriceHt: Number(e.target.value) || 0 } : l)))}
                    data-testid={idx === 0 ? "input-invoice-amount" : undefined}
                  />
                  <button
                    type="button"
                    className="text-xs text-rose-600"
                    onClick={() => setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)))}
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-2 text-sm font-semibold text-primary"
              onClick={() =>
                setLines((prev) => [
                  ...prev,
                  { id: `l-${Date.now()}`, description: seller.defaultService, quantity: 1, unitPriceHt: seller.defaultUnitPriceHt },
                ])
              }
            >
              + Ajouter une ligne
            </button>
          </div>

          <label className="block text-xs font-medium text-slate-500">
            Notes (optionnel)
            <textarea className={cn(inputCls, "min-h-[72px]")} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <div className="text-sm">
              <p>
                Total HT : <strong>{moneyFr(totals.totalHt)}</strong>
              </p>
              <p className="text-xs text-slate-500">{vatLabel(seller.vatMode)}</p>
              <p>
                Total TTC : <strong>{moneyFr(totals.totalTtc)}</strong>
              </p>
              <p className="text-xs text-slate-500">Échéance : {formatDate(addDaysIso(issuedOn, seller.paymentDelayDays))}</p>
            </div>
            <PrimaryButton type="button" onClick={createInvoice} data-testid="button-save-invoice">
              <Send size={16} /> Générer & envoyer
            </PrimaryButton>
          </div>
        </div>
      )}

      {tab === "modeles" && (
        <div className="grid gap-5 md:grid-cols-2">
          {INVOICE_TEMPLATES.map((t) => {
            const active = seller.activeTemplateId === t.id;
            return (
              <div
                key={t.id}
                className={cn(
                  "overflow-hidden rounded-2xl border transition",
                  active ? "border-primary ring-2 ring-primary/25" : "border-border bg-white/80",
                )}
              >
                <button
                  type="button"
                  onClick={() => selectTemplate(t.id)}
                  className="w-full p-5 text-left"
                  data-testid={`button-invoice-template-${t.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{t.description}</p>
                    </div>
                    {active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
                        <Check size={12} /> Actif
                      </span>
                    ) : null}
                  </div>
                </button>
                <div className="border-t border-border/60 bg-slate-50/80 px-4 pb-4 pt-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Exemple du modèle</p>
                  <TemplateMiniPreview templateId={t.id} accent={t.accent} name={t.name} />
                </div>
              </div>
            );
          })}
          <p className="md:col-span-2 text-sm text-slate-600">
            Le modèle choisi est mémorisé à vie (localement) jusqu’à ce que vous en changiez un autre ici.
          </p>
        </div>
      )}

      {tab === "emetteur" && (
        <div className="surface space-y-4 rounded-2xl p-5 md:p-6">
          <p className="text-sm text-slate-600">
            Ces informations apparaissent sur chaque facture électronique. Obligatoires en France (SIRET, adresse, régime TVA).
            Pour le B2B e-invoicing, le SIREN client et la catégorie PS/LB sont aussi requis.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Raison sociale / nom légal *">
              <input className={inputCls} value={sellerDraft.legalName} onChange={(e) => setSellerDraft({ ...sellerDraft, legalName: e.target.value })} />
            </Field>
            <Field label="Nom commercial">
              <input className={inputCls} value={sellerDraft.tradeName} onChange={(e) => setSellerDraft({ ...sellerDraft, tradeName: e.target.value })} />
            </Field>
            <Field label="Adresse *">
              <input className={inputCls} value={sellerDraft.addressLine1} onChange={(e) => setSellerDraft({ ...sellerDraft, addressLine1: e.target.value })} />
            </Field>
            <Field label="Complément">
              <input className={inputCls} value={sellerDraft.addressLine2} onChange={(e) => setSellerDraft({ ...sellerDraft, addressLine2: e.target.value })} />
            </Field>
            <Field label="Code postal *">
              <input className={inputCls} value={sellerDraft.postalCode} onChange={(e) => setSellerDraft({ ...sellerDraft, postalCode: e.target.value })} />
            </Field>
            <Field label="Ville *">
              <input className={inputCls} value={sellerDraft.city} onChange={(e) => setSellerDraft({ ...sellerDraft, city: e.target.value })} />
            </Field>
            <Field label="E-mail">
              <input className={inputCls} value={sellerDraft.email} onChange={(e) => setSellerDraft({ ...sellerDraft, email: e.target.value })} />
            </Field>
            <Field label="Téléphone">
              <input className={inputCls} value={sellerDraft.phone} onChange={(e) => setSellerDraft({ ...sellerDraft, phone: e.target.value })} />
            </Field>
            <Field label="SIRET *">
              <input
                className={inputCls}
                value={sellerDraft.siret}
                onChange={(e) => {
                  const siret = e.target.value;
                  setSellerDraft({
                    ...sellerDraft,
                    siret,
                    siren: sellerDraft.siren || sirenFromSiret(siret),
                  });
                }}
                placeholder="14 chiffres"
              />
            </Field>
            <Field label="SIREN">
              <input className={inputCls} value={sellerDraft.siren} onChange={(e) => setSellerDraft({ ...sellerDraft, siren: e.target.value })} />
            </Field>
            <Field label="N° TVA intracommunautaire">
              <input className={inputCls} value={sellerDraft.tvaIntracom} onChange={(e) => setSellerDraft({ ...sellerDraft, tvaIntracom: e.target.value })} placeholder="FR…" />
            </Field>
            <Field label="Forme juridique">
              <input className={inputCls} value={sellerDraft.legalForm} onChange={(e) => setSellerDraft({ ...sellerDraft, legalForm: e.target.value })} />
            </Field>
            <Field label="Capital social (si société)">
              <input className={inputCls} value={sellerDraft.capital} onChange={(e) => setSellerDraft({ ...sellerDraft, capital: e.target.value })} />
            </Field>
            <Field label="RCS (ville)">
              <input className={inputCls} value={sellerDraft.rcsCity} onChange={(e) => setSellerDraft({ ...sellerDraft, rcsCity: e.target.value })} />
            </Field>
            <Field label="Code APE / NAF">
              <input className={inputCls} value={sellerDraft.apeCode} onChange={(e) => setSellerDraft({ ...sellerDraft, apeCode: e.target.value })} />
            </Field>
            <Field label="Régime TVA">
              <select
                className={inputCls}
                value={sellerDraft.vatMode}
                onChange={(e) => setSellerDraft({ ...sellerDraft, vatMode: e.target.value as VatMode })}
              >
                <option value="franchise_293b">Franchise en base (art. 293 B CGI)</option>
                <option value="tva_20">Assujetti TVA 20 %</option>
                <option value="tva_10">Assujetti TVA 10 %</option>
                <option value="tva_5_5">Assujetti TVA 5,5 %</option>
              </select>
            </Field>
            <Field label="Catégorie d’opération par défaut">
              <select
                className={inputCls}
                value={sellerDraft.defaultOperationCategory || "PS"}
                onChange={(e) =>
                  setSellerDraft({ ...sellerDraft, defaultOperationCategory: e.target.value as OperationCategory })
                }
              >
                <option value="PS">Prestation de services (PS)</option>
                <option value="LB">Livraison de biens (LB)</option>
                <option value="LBPS">Mixte (LBPS)</option>
              </select>
            </Field>
            <Field label="Option TVA sur les débits">
              <select
                className={inputCls}
                value={sellerDraft.vatOnDebits ? "1" : "0"}
                onChange={(e) => setSellerDraft({ ...sellerDraft, vatOnDebits: e.target.value === "1" })}
              >
                <option value="0">Non (TVA sur les encaissements)</option>
                <option value="1">Oui — mention « TVA d’après les débits »</option>
              </select>
            </Field>
            <Field label="IBAN">
              <input className={inputCls} value={sellerDraft.iban} onChange={(e) => setSellerDraft({ ...sellerDraft, iban: e.target.value })} />
            </Field>
            <Field label="BIC">
              <input className={inputCls} value={sellerDraft.bic} onChange={(e) => setSellerDraft({ ...sellerDraft, bic: e.target.value })} />
            </Field>
            <Field label="Délai de paiement (jours)">
              <input
                type="number"
                min={0}
                className={inputCls}
                value={sellerDraft.paymentDelayDays}
                onChange={(e) => setSellerDraft({ ...sellerDraft, paymentDelayDays: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Prestation par défaut">
              <input className={inputCls} value={sellerDraft.defaultService} onChange={(e) => setSellerDraft({ ...sellerDraft, defaultService: e.target.value })} />
            </Field>
            <Field label="Prix HT par défaut (€)">
              <input
                type="number"
                step="0.01"
                className={inputCls}
                value={sellerDraft.defaultUnitPriceHt}
                onChange={(e) => setSellerDraft({ ...sellerDraft, defaultUnitPriceHt: Number(e.target.value) || 0 })}
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            <p className="text-xs text-slate-500 max-w-xl">
              Vérifiez SIRET et régime TVA auprès de votre expert-comptable. CAMPUS structure la facture ; l’exactitude des données reste votre responsabilité.
            </p>
            <PrimaryButton type="button" onClick={saveEmetteur} data-testid="button-save-seller">
              <Check size={16} /> Enregistrer l’émetteur
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

function SendInvoicePanel({
  invoice,
  onClose,
  onToast,
  PrimaryButton,
  GhostButton,
}: {
  invoice: FrenchInvoice;
  onClose: () => void;
  onToast: (m: string) => void;
  PrimaryButton: (p: ButtonHTMLAttributes<HTMLButtonElement>) => ReactNode;
  GhostButton: (p: ButtonHTMLAttributes<HTMLButtonElement>) => ReactNode;
}) {
  const [email, setEmail] = useState(invoice.client.email || "");
  const [phone, setPhone] = useState(invoice.client.phone || "");
  const t = computeTotals(invoice.lines, invoice.sellerSnapshot.vatMode);
  const body = buildInvoiceMessage(invoice, t.totalTtc);
  const subject = `Facture ${invoice.number} — ${invoice.sellerSnapshot.tradeName || invoice.sellerSnapshot.legalName}`;

  function sendEmail() {
    if (!email.trim()) {
      onToast("Indiquez l’e-mail du client");
      return;
    }
    window.location.href = `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    onToast("Client e-mail ouvert — envoyez le message");
  }

  function sendSms() {
    const digits = phone.replace(/[^\d+]/g, "");
    if (!digits) {
      onToast("Indiquez le numéro de téléphone du client");
      return;
    }
    window.location.href = `sms:${digits}?&body=${encodeURIComponent(body)}`;
    onToast("Application SMS ouverte — envoyez le message");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center print:hidden" role="dialog">
      <div className="surface w-full max-w-md rounded-2xl p-5 shadow-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary">Envoyer la facture</p>
        <h3 className="mt-1 text-xl font-semibold">{invoice.number}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {invoice.client.name} · {moneyFr(t.totalTtc)}
        </p>
        <label className="mt-4 block text-xs font-medium text-slate-500">
          E-mail
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-send-email" />
        </label>
        <label className="mt-3 block text-xs font-medium text-slate-500">
          Téléphone (SMS)
          <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-send-phone" />
        </label>
        <div className="mt-5 flex flex-col gap-2">
          <PrimaryButton type="button" onClick={sendEmail} data-testid="button-send-email">
            <Mail size={16} /> Envoyer par e-mail
          </PrimaryButton>
          <PrimaryButton type="button" className="bg-emerald-700 hover:bg-emerald-800" onClick={sendSms} data-testid="button-send-sms">
            <MessageSquare size={16} /> Envoyer par SMS
          </PrimaryButton>
          <GhostButton type="button" onClick={onClose}>
            Fermer
          </GhostButton>
        </div>
      </div>
    </div>
  );
}

function TemplateMiniPreview({ templateId, accent, name }: { templateId: InvoiceLayoutId; accent: string; name: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-3 text-[10px] leading-relaxed text-slate-700 shadow-sm",
        templateId === "moderne" && "rounded-none border-l-4",
        templateId === "minimal" && "border-slate-300",
        templateId === "cabinet" && "bg-[#fffdf8]",
      )}
      style={templateId === "moderne" ? { borderLeftColor: accent } : { borderColor: `${accent}44` }}
    >
      <div className="flex justify-between gap-2 border-b pb-2" style={{ borderColor: `${accent}33` }}>
        <div>
          <p className="font-bold" style={{ color: accent }}>
            {name.split(" ")[0]} Cabinet
          </p>
          <p className="text-slate-400">12 rue Exemple · 75000 Paris</p>
          <p className="text-slate-400">SIRET 123 456 789 00012</p>
        </div>
        <div className="text-right">
          <p className="font-mono font-bold" style={{ color: accent }}>
            FAC-2026-00001
          </p>
          <p className="text-slate-400">12 sept. 2026</p>
        </div>
      </div>
      <p className="mt-2 font-semibold">Client : Marie Dupont</p>
      <div className="mt-2 flex justify-between border-t border-dashed pt-2" style={{ borderColor: `${accent}33` }}>
        <span>Séance ventouses × 1</span>
        <strong>65,00 €</strong>
      </div>
      <p className="mt-2 text-[9px] text-slate-400">TVA non applicable, art. 293 B du CGI · Pénalités retard L441-10</p>
    </div>
  );
}

function InvoiceDocument({ invoice }: { invoice: FrenchInvoice }) {
  const s = invoice.sellerSnapshot;
  const t = computeTotals(invoice.lines, s.vatMode);
  const tpl = INVOICE_TEMPLATES.find((x) => x.id === invoice.templateId) ?? INVOICE_TEMPLATES[0]!;
  const accent = tpl.accent;
  const sellerSiren = s.siren || (s.siret ? sirenFromSiret(s.siret) : "");
  const opCat = invoice.operationCategory || "PS";
  const vatOnDebits = invoice.vatOnDebits ?? s.vatOnDebits ?? false;

  return (
    <article
      className={cn(
        "invoice-print mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-lg md:p-10",
        invoice.templateId === "minimal" && "border-slate-200",
        invoice.templateId === "moderne" && "border-cyan-200",
        invoice.templateId === "cabinet" && "border-amber-200",
      )}
      data-testid="invoice-document"
    >
      <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-6" style={{ borderColor: `${accent}33` }}>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.18em]" style={{ color: accent }}>
            Facture électronique
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{s.tradeName || s.legalName}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {s.legalName}
            <br />
            {s.addressLine1}
            {s.addressLine2 ? (
              <>
                <br />
                {s.addressLine2}
              </>
            ) : null}
            <br />
            {s.postalCode} {s.city}
            <br />
            {s.country}
            {s.email ? (
              <>
                <br />
                {s.email}
              </>
            ) : null}
            {s.phone ? (
              <>
                <br />
                {s.phone}
              </>
            ) : null}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-bold" style={{ color: accent }}>
            {invoice.number}
          </p>
          <p className="mt-2 text-sm text-slate-600">Émise le {formatDate(invoice.issuedOn)}</p>
          <p className="text-sm text-slate-600">Prestation du {formatDate(invoice.serviceDate)}</p>
          <p className="text-sm text-slate-600">Échéance {formatDate(invoice.dueOn)}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">{operationCategoryLabel(opCat)}</p>
          {vatOnDebits ? <p className="text-xs text-slate-500">Option TVA d’après les débits</p> : null}
        </div>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Client / destinataire</p>
          <p className="mt-2 font-semibold text-slate-900">{invoice.client.name}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {invoice.client.addressLine1 || "—"}
            <br />
            {[invoice.client.postalCode, invoice.client.city].filter(Boolean).join(" ") || ""}
            {invoice.client.siren ? (
              <>
                <br />
                SIREN : {invoice.client.siren}
              </>
            ) : null}
            {invoice.client.siret ? (
              <>
                <br />
                SIRET : {invoice.client.siret}
              </>
            ) : null}
            {invoice.client.tvaIntracom ? (
              <>
                <br />
                TVA : {invoice.client.tvaIntracom}
              </>
            ) : null}
            {invoice.client.email ? (
              <>
                <br />
                {invoice.client.email}
              </>
            ) : null}
            {invoice.client.phone ? (
              <>
                <br />
                {invoice.client.phone}
              </>
            ) : null}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Identification émetteur</p>
          <p className="mt-2">SIRET : {s.siret || "—"}</p>
          <p>SIREN : {sellerSiren || "—"}</p>
          {s.tvaIntracom ? <p>TVA intracom. : {s.tvaIntracom}</p> : null}
          {s.legalForm ? (
            <p>
              {s.legalForm}
              {s.capital ? ` — capital ${s.capital}` : ""}
            </p>
          ) : null}
          {s.rcsCity ? <p>RCS {s.rcsCity}</p> : null}
          {s.apeCode ? <p>APE/NAF : {s.apeCode}</p> : null}
        </div>
      </div>

      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b text-[11px] uppercase tracking-[.08em] text-slate-500" style={{ borderColor: `${accent}44` }}>
            <th className="py-2 font-semibold">Désignation</th>
            <th className="py-2 font-semibold">Qté</th>
            <th className="py-2 font-semibold">P.U. HT</th>
            <th className="py-2 text-right font-semibold">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((l) => (
            <tr key={l.id} className="border-b border-slate-100">
              <td className="py-3 pr-2">{l.description}</td>
              <td className="py-3">{l.quantity}</td>
              <td className="py-3">{moneyFr(l.unitPriceHt)}</td>
              <td className="py-3 text-right font-medium">{moneyFr(l.quantity * l.unitPriceHt)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Total HT</span>
            <strong>{moneyFr(t.totalHt)}</strong>
          </div>
          <div className="flex justify-between">
            <span>TVA {t.rate > 0 ? `(${(t.rate * 100).toFixed(t.rate === 0.055 ? 1 : 0)} %)` : ""}</span>
            <strong>{moneyFr(t.totalTva)}</strong>
          </div>
          <div className="flex justify-between border-t pt-2 text-base" style={{ borderColor: accent }}>
            <span className="font-semibold">Total TTC</span>
            <strong style={{ color: accent }}>{moneyFr(t.totalTtc)}</strong>
          </div>
          <p className="pt-1 text-xs text-slate-500">{vatLabel(s.vatMode)}</p>
        </div>
      </div>

      {(s.iban || s.bic) && (
        <div className="mt-6 rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
          <p className="font-semibold">Règlement</p>
          {s.iban ? <p className="mt-1">IBAN : {s.iban}</p> : null}
          {s.bic ? <p>BIC : {s.bic}</p> : null}
        </div>
      )}

      {invoice.notes ? <p className="mt-4 text-sm text-slate-600">Note : {invoice.notes}</p> : null}

      <footer className="mt-8 space-y-2 border-t border-slate-200 pt-4 text-[11px] leading-5 text-slate-500">
        <p>
          Facture électronique française — format lisible PDF · données structurées disponibles en XML Factur-X (CII).
          Transmission via plateforme agréée (PDP) requise pour l’e-invoicing B2B.
        </p>
        {latePaymentMentions(s.paymentDelayDays).map((m) => (
          <p key={m}>{m}</p>
        ))}
        <p>Document généré via CAMPUS — conservez cette facture conformément à vos obligations comptables (10 ans).</p>
      </footer>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-print, .invoice-print * { visibility: visible !important; }
          .invoice-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </article>
  );
}

function buildInvoiceMessage(invoice: FrenchInvoice, totalTtc: number) {
  const s = invoice.sellerSnapshot;
  return [
    `Bonjour ${invoice.client.name},`,
    "",
    `Veuillez trouver votre facture ${invoice.number}.`,
    `Émetteur : ${s.tradeName || s.legalName}`,
    `SIRET : ${s.siret}`,
    `Date : ${formatDate(invoice.issuedOn)}`,
    `Montant TTC : ${moneyFr(totalTtc)}`,
    `Échéance : ${formatDate(invoice.dueOn)}`,
    "",
    ...invoice.lines.map((l) => `• ${l.description} × ${l.quantity} — ${moneyFr(l.quantity * l.unitPriceHt)} HT`),
    "",
    vatLabel(s.vatMode),
    s.iban ? `IBAN : ${s.iban}` : "",
    "",
    "Merci de votre confiance.",
    s.tradeName || s.legalName,
  ]
    .filter(Boolean)
    .join("\n");
}

const inputCls =
  "mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-500">
      <span>{label}</span>
      {children}
    </label>
  );
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso + "T12:00:00"));
  } catch {
    return iso;
  }
}

function statusLabel(s: FrenchInvoice["status"]) {
  if (s === "paid") return "Payée";
  if (s === "overdue") return "En retard";
  if (s === "sent") return "Émise";
  if (s === "cancelled") return "Annulée";
  return "Brouillon";
}
