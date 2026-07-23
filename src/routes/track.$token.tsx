import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getTracking } from "@/lib/tracking.functions";
import { STATUS_LABEL, STATUS_COLOR, formatBRL, formatOSNumber, type OrderStatus } from "@/lib/orders";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/track/$token")({
  head: () => ({
    meta: [
      { title: "Acompanhar reparo — RepairAI" },
      { name: "description", content: "Acompanhe o andamento do seu reparo em tempo real." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackPage,
});

interface TrackData {
  number: number;
  status: OrderStatus;
  reported_issue: string;
  diagnosis: string | null;
  estimated_delivery: string | null;
  price_cents: number;
  warranty_days: number;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  customer: { name: string };
  device: { brand: string; model: string; color: string | null };
  events: Array<{ type: string; payload: Record<string, unknown>; created_at: string }>;
}

function TrackPage() {
  const { token } = Route.useParams();
  const fetchTracking = useServerFn(getTracking);
  const [data, setData] = useState<TrackData | null | "notfound">(null);

  useEffect(() => {
    fetchTracking({ data: { token } })
      .then((res) => setData((JSON.parse(res.json) as TrackData | null) ?? "notfound"))
      .catch(() => setData("notfound"));
  }, [token, fetchTracking]);

  if (data === null) return <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>;
  if (data === "notfound")
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="mb-2 text-xl font-bold">OS não encontrada</h1>
        <p className="text-sm text-muted-foreground">Confira o link recebido.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-5 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Acompanhamento de reparo</h1>
            <p className="text-xs text-muted-foreground">RepairAI</p>
          </div>
        </header>

        <section className="mb-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground">Ordem de Serviço</p>
              <p className="text-2xl font-bold">{formatOSNumber(data.number)}</p>
            </div>
            <Badge variant="outline" className={STATUS_COLOR[data.status]}>{STATUS_LABEL[data.status]}</Badge>
          </div>
          <p className="mt-3 text-sm">Olá, <strong>{data.customer.name}</strong>! Aqui está o status do seu {data.device.brand} {data.device.model}.</p>
        </section>

        <section className="mb-4 rounded-2xl border border-border bg-card p-4 text-sm">
          <div className="grid grid-cols-2 gap-y-2">
            <span className="text-muted-foreground text-xs">Aparelho</span>
            <span className="text-right">{data.device.brand} {data.device.model}</span>
            <span className="text-muted-foreground text-xs">Defeito</span>
            <span className="text-right">{data.reported_issue}</span>
            {data.diagnosis && (<><span className="text-muted-foreground text-xs">Diagnóstico</span><span className="text-right">{data.diagnosis}</span></>)}
            {data.price_cents > 0 && (<><span className="text-muted-foreground text-xs">Valor</span><span className="text-right font-semibold">{formatBRL(data.price_cents)}</span></>)}
            {data.estimated_delivery && (<><span className="text-muted-foreground text-xs">Prazo</span><span className="text-right">{new Date(data.estimated_delivery).toLocaleDateString("pt-BR")}</span></>)}
            <span className="text-muted-foreground text-xs">Garantia</span>
            <span className="text-right">{data.warranty_days} dias</span>
          </div>
          {data.customer_notes && (
            <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs">
              <p className="font-semibold text-muted-foreground">Mensagem do técnico</p>
              <p className="mt-1">{data.customer_notes}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Histórico</h2>
          <ol className="space-y-3">
            {data.events.map((e, i) => (
              <li key={i} className="flex gap-3 border-l-2 border-primary/40 pl-3">
                <div>
                  <p className="text-xs font-medium">
                    {e.type === "created" && "OS aberta"}
                    {e.type === "status_change" && `${STATUS_LABEL[e.payload.from as OrderStatus] ?? ""} → ${STATUS_LABEL[e.payload.to as OrderStatus] ?? ""}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">Powered by RepairAI</p>
      </div>
    </div>
  );
}
