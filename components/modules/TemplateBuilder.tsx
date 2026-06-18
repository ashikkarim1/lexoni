"use client";
/**
 * TemplateBuilder
 *
 * Three-column workspace (collapses on mobile):
 *   ┌────────────┬──────────────────────────┬────────────┐
 *   │ Templates  │  Draft (autopopulated)   │  Clients   │  desktop
 *   └────────────┴──────────────────────────┴────────────┘
 *
 *   Mobile: stacked tabs - Templates · Draft · Clients.
 *
 * Interaction:
 *   - Desktop: drag a client from the right rail onto the draft to autopopulate.
 *   - Mobile (or anywhere): tap a client → "Attach" → same autopopulate.
 *
 * Native HTML5 drag-and-drop is enough - no extra dependency.
 * Touch fallback via the tap-to-attach button on every client tile.
 */
import { useMemo, useState } from "react";
import {
  GripVertical, Sparkles, Send, ChevronLeft, ChevronRight, Building2, User,
  FileText, Check,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type TplOption = { id: string; title: string; kind: string; jurisdiction: string };
type Client = {
  id: string; legalName: string; jurisdiction: string; licenseNo: string;
  signatory: string; signatoryEmail: string; address: string;
};

const TEMPLATES: TplOption[] = [
  { id: "tf1", title: "Levant - Standard NDA",            kind: "NDA",        jurisdiction: "UAE" },
  { id: "tf2", title: "Levant - Employment Agreement",    kind: "Employment", jurisdiction: "DIFC" },
  { id: "tf3", title: "Levant - Shareholders' Agreement", kind: "SHA",        jurisdiction: "ADGM" },
  { id: "tf4", title: "Levant - Service Agreement",       kind: "Service",    jurisdiction: "GLOBAL" },
  { id: "tf6", title: "Levant - KSA Employment (Arabic)", kind: "Employment", jurisdiction: "KSA" },
];

const CLIENTS: Client[] = [
  { id: "c1", legalName: "Alistair Holdings Ltd",  jurisdiction: "ADGM",  licenseNo: "ADGM-78321", signatory: "Khaled Al-Mutairi", signatoryEmail: "khaled@alistair.ae",  address: "Al Maryah Island, Abu Dhabi" },
  { id: "c2", legalName: "Nour Capital Partners",   jurisdiction: "DIFC",  licenseNo: "DIFC-13442", signatory: "Tariq Bin Sulayem",  signatoryEmail: "tariq@nourcap.ae",     address: "DIFC Gate Village, Dubai" },
  { id: "c3", legalName: "Falcon Trade DMCC",       jurisdiction: "DMCC",  licenseNo: "DMCC-90112", signatory: "Lina Haddad",         signatoryEmail: "lina@falcontrade.ae",  address: "JLT Cluster N, Dubai" },
  { id: "c4", legalName: "Riyadh Industries Co.",   jurisdiction: "MISA",  licenseNo: "MISA-44211", signatory: "Yasmin Al-Otaibi",    signatoryEmail: "yasmin@riyadhind.sa",  address: "King Fahd Rd, Riyadh" },
  { id: "c5", legalName: "Delta Pay FZE",           jurisdiction: "IFZA",  licenseNo: "IFZA-22033", signatory: "Omar Khalifa",        signatoryEmail: "omar@delta-pay.ae",    address: "Dubai Silicon Oasis" },
  { id: "c6", legalName: "Hashimi Properties",       jurisdiction: "DED",  licenseNo: "DED-55102",  signatory: "Reem Al-Hashimi",     signatoryEmail: "reem@hashimi.ae",      address: "Sheikh Zayed Rd, Dubai" },
];

type Variables = {
  clientName: string; clientAddress: string; jurisdiction: string; licenseNo: string;
  signatory: string; signatoryEmail: string;
  counterpartyName: string; counterpartyAddress: string;
  effectiveDate: string; term: string; governingLaw: string; disputeForum: string;
};
const emptyVars: Variables = {
  clientName: "", clientAddress: "", jurisdiction: "", licenseNo: "",
  signatory: "", signatoryEmail: "",
  counterpartyName: "", counterpartyAddress: "",
  effectiveDate: "2026-06-20", term: "5 years", governingLaw: "ADGM", disputeForum: "ADGM Courts",
};

type Tab = "templates" | "draft" | "clients";

export function TemplateBuilder() {
  const [tplId,  setTplId]  = useState<string>(TEMPLATES[0].id);
  const [vars,   setVars]   = useState<Variables>(emptyVars);
  const [filled, setFilled] = useState<boolean>(false);
  const [tab,    setTab]    = useState<Tab>("draft");
  const [filter, setFilter] = useState<string>("");

  const tpl = useMemo(() => TEMPLATES.find((t) => t.id === tplId)!, [tplId]);
  const visibleClients = CLIENTS.filter((c) =>
    !filter || c.legalName.toLowerCase().includes(filter.toLowerCase()) || c.jurisdiction.toLowerCase().includes(filter.toLowerCase())
  );

  const attachClient = (c: Client) => {
    setVars((v) => ({
      ...v,
      clientName:    c.legalName,
      clientAddress: c.address,
      jurisdiction:  c.jurisdiction,
      licenseNo:     c.licenseNo,
      signatory:     c.signatory,
      signatoryEmail:c.signatoryEmail,
      governingLaw:  c.jurisdiction,
      disputeForum:  `${c.jurisdiction} Courts`,
    }));
    setFilled(true);
    setTab("draft");
  };

  return (
    <div className="card overflow-hidden">
      {/* Mobile tab bar */}
      <div className="lg:hidden grid grid-cols-3 border-b border-line text-xs">
        {(["templates", "draft", "clients"] as Tab[]).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn("py-3 font-medium capitalize", tab === k ? "bg-canvas text-ink border-b-2 border-royal" : "text-muted")}>
            {k}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* LEFT - template picker */}
        <aside className={cn("lg:col-span-3 border-e border-line bg-canvas", tab !== "templates" && "hidden lg:block")}>
          <div className="p-4 border-b border-line">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">1 · Template</div>
          </div>
          <div className="p-2 space-y-1 max-h-[600px] overflow-y-auto">
            {TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => { setTplId(t.id); setTab("draft"); }}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition",
                  t.id === tplId ? "border-royal bg-white shadow-sm" : "border-transparent hover:bg-white"
                )}>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-royal" />
                  <span className="font-medium text-sm truncate">{t.title}</span>
                </div>
                <div className="text-[11px] text-muted mt-1">{t.kind} · {t.jurisdiction}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER - draft canvas */}
        <section
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData("text/lexoni-client");
            const client = CLIENTS.find((c) => c.id === id);
            if (client) attachClient(client);
          }}
          className={cn(
            "lg:col-span-6 p-5 lg:p-7 relative",
            tab !== "draft" && "hidden lg:block",
            !filled && "outline-2 outline-dashed outline-line"
          )}
        >
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">2 · Draft</div>
              <div className="h2 mt-1">{tpl.title}</div>
              <div className="text-xs text-muted">{tpl.kind} · {tpl.jurisdiction}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setVars(emptyVars); setFilled(false); }} className="btn-ghost text-xs border border-line">Clear</button>
              <button disabled={!filled} className="btn-primary text-xs disabled:opacity-50"><Send className="h-4 w-4" /> Send for signature</button>
            </div>
          </div>

          {!filled && (
            <div className="absolute inset-x-4 sm:inset-x-7 top-32 bottom-7 rounded-xl border-2 border-dashed border-royal/40 bg-royal/5 flex items-center justify-center pointer-events-none">
              <div className="text-center px-4">
                <Sparkles className="h-6 w-6 text-royal mx-auto" />
                <div className="font-semibold mt-2">Drop a client here</div>
                <div className="text-xs text-muted mt-1">
                  <span className="hidden lg:inline">Drag from the right rail</span>
                  <span className="lg:hidden">Or tap a client in the Clients tab → Attach</span>
                </div>
              </div>
            </div>
          )}

          {filled && (
            <div className="space-y-6">
              <Block title="Auto-populated from client" tone="auto" rows={[
                ["Client legal name",    vars.clientName],
                ["Client address",       vars.clientAddress],
                ["Jurisdiction",         vars.jurisdiction],
                ["License no.",          vars.licenseNo],
                ["Authorised signatory", `${vars.signatory} · ${vars.signatoryEmail}`],
              ]} />
              <Block title="Editable variables (review)" tone="edit" rows={[
                ["Counterparty name",    vars.counterpartyName, (v) => setVars({ ...vars, counterpartyName: v }), "e.g. Acme Robotics LLC"],
                ["Counterparty address", vars.counterpartyAddress, (v) => setVars({ ...vars, counterpartyAddress: v }), "Counterparty registered address"],
                ["Effective date",       vars.effectiveDate, (v) => setVars({ ...vars, effectiveDate: v })],
                ["Term",                 vars.term, (v) => setVars({ ...vars, term: v })],
                ["Governing law",        vars.governingLaw, (v) => setVars({ ...vars, governingLaw: v })],
                ["Dispute forum",        vars.disputeForum, (v) => setVars({ ...vars, disputeForum: v })],
              ]} />
              <div className="card p-4 bg-canvas border-dashed">
                <div className="text-xs text-muted mb-2">Preview (first paragraph)</div>
                <p className="text-sm leading-relaxed">
                  This <span className="font-semibold">{tpl.kind}</span> is entered into on <span className="font-semibold">{vars.effectiveDate}</span> between <span className="font-semibold">{vars.clientName}</span>, a company registered in <span className="font-semibold">{vars.jurisdiction}</span> under licence <span className="font-mono text-xs">{vars.licenseNo}</span>, having its registered office at {vars.clientAddress} (the "Client"), and <span className="font-semibold">{vars.counterpartyName || "[counterparty]"}</span> (the "Counterparty"). The Client is represented by <span className="font-semibold">{vars.signatory}</span>. This agreement is governed by the laws of <span className="font-semibold">{vars.governingLaw}</span>; disputes shall be referred to <span className="font-semibold">{vars.disputeForum}</span>…
                </p>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT - clients rail */}
        <aside className={cn("lg:col-span-3 border-s border-line bg-canvas", tab !== "clients" && "hidden lg:block")}>
          <div className="p-4 border-b border-line">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">3 · Clients</div>
            <input
              type="text"
              placeholder="Search clients…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full mt-2 h-9 text-sm rounded-lg border border-line bg-white px-3 focus:outline-none focus:ring-2 focus:ring-royal/30"
            />
            <p className="text-[11px] text-muted mt-2 hidden lg:block">Drag onto the draft, or tap <span className="font-medium">Attach</span>.</p>
          </div>
          <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
            {visibleClients.map((c) => (
              <div
                key={c.id}
                draggable
                onDragStart={(e) => { e.dataTransfer.setData("text/lexoni-client", c.id); e.dataTransfer.effectAllowed = "copy"; }}
                className="card p-3 bg-white hover:border-royal transition cursor-grab active:cursor-grabbing select-none"
              >
                <div className="flex items-start gap-2">
                  <GripVertical className="h-4 w-4 text-muted mt-0.5 shrink-0 hidden lg:block" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-royal" /><span className="font-medium text-sm truncate">{c.legalName}</span></div>
                    <div className="text-[11px] text-muted mt-0.5">{c.jurisdiction} · {c.licenseNo}</div>
                    <div className="flex items-center gap-1 text-[11px] text-muted mt-0.5"><User className="h-3 w-3" /><span className="truncate">{c.signatory}</span></div>
                  </div>
                </div>
                <button onClick={() => attachClient(c)}
                  className="mt-3 w-full text-xs btn-primary justify-center py-1.5">
                  <Check className="h-3.5 w-3.5" /> Attach
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Block({ title, tone, rows }: {
  title: string;
  tone: "auto" | "edit";
  rows: Array<[string, string] | [string, string, (v: string) => void, string?]>;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b border-line bg-canvas">
        {tone === "auto" ? <Sparkles className="h-3.5 w-3.5 text-royal" /> : <ChevronRight className="h-3.5 w-3.5 text-muted" />}
        {title}
      </div>
      <ul className="divide-y divide-line">
        {rows.map(([label, value, onChange, placeholder]) => (
          <li key={label} className="px-4 py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <span className="text-xs text-muted">{label}</span>
            {onChange ? (
              <input
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="sm:col-span-2 h-9 text-sm rounded-lg border border-line bg-white px-3 focus:outline-none focus:ring-2 focus:ring-royal/30"
              />
            ) : (
              <span className="sm:col-span-2 text-sm font-medium">{value || <span className="text-muted italic">-</span>}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
