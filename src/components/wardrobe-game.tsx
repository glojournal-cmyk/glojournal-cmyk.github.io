import { useEffect, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { playWhoosh } from "@/lib/audio";
import {
  artForLook,
  DEFAULT_LOOK,
  DEFAULT_SCHOLAR_NAME,
  EXTRA_WARDROBE_LOOK_IDS,
  isExtraWardrobeLook,
  isPieceUnlocked,
  lookLabel,
  OUTFITS,
  PIECES,
  type ExtraId,
  type BottomId,
  type OuterId,
  type TopId,
} from "@/lib/content/outfits";
import { useScholar } from "@/lib/store";
import { cn } from "@/lib/utils";

const SLOTS = [
  { id: "top" as const, label: "Top" },
  { id: "bottom" as const, label: "Bottom" },
  { id: "outer" as const, label: "Jacket" },
  { id: "extra" as const, label: "Extra" },
];

export function WardrobeGame() {
  const look = useScholar((s) => s.look) ?? DEFAULT_LOOK;
  const setLook = useScholar((s) => s.setLook);
  const equipOutfit = useScholar((s) => s.equipOutfit);
  const equippedOutfit = useScholar((s) => s.equippedOutfit);
  const unlocked = useScholar((s) => s.unlockedOutfits);
  const name = useScholar((s) => s.displayName);
  const label = name.trim() || DEFAULT_SCHOLAR_NAME;
  const [slot, setSlot] = useState<(typeof SLOTS)[number]["id"]>("top");
  const [flash, setFlash] = useState(0);
  const extraLooks = OUTFITS.filter((item) => EXTRA_WARDROBE_LOOK_IDS.includes(item.id));
  const equippedExtra = isExtraWardrobeLook(equippedOutfit)
    ? extraLooks.find((item) => item.id === equippedOutfit)
    : undefined;
  const art = equippedExtra?.art ?? artForLook(look);
  const items = PIECES.filter((p) => p.slot === slot);

  useEffect(() => {
    setFlash((n) => n + 1);
  }, [art]);

  function pick(id: string, locked: boolean, need: string, itemName: string) {
    if (locked) {
      toast("Still in the laundry", { description: need });
      return;
    }
    const current = look[slot];
    if (current === id && !equippedExtra) return;
    if (equippedExtra) equipOutfit("day");
    if (slot === "top") setLook({ top: id as TopId });
    if (slot === "bottom") setLook({ bottom: id as BottomId });
    if (slot === "outer") setLook({ outer: id as OuterId });
    if (slot === "extra") setLook({ extra: id as ExtraId });
    playWhoosh();
    toast("Changed", { description: itemName });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="relative overflow-hidden rounded-2xl bg-sage/40 shadow-[var(--shadow-border)]">
        <img
          key={flash}
          src={art}
          alt={`${label} mix-and-match`}
          className="dress-pop scholar-idle mx-auto block max-h-[min(62vh,680px)] w-auto max-w-full object-contain outline-none"
        />
        {flash > 0 ? <Sparks tick={flash} /> : null}
        <div className="space-y-1 p-4">
          <p className="text-xs tracking-[0.2em] text-navy uppercase">Dress-up · Mix pieces</p>
          <p className="font-display text-3xl font-semibold">{label}</p>
          <p className="text-sm text-muted">{lookLabel(look)}</p>
        </div>
      </div>

      <div className="flex flex-col rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-navy uppercase">Closet</p>
            <h2 className="font-display text-2xl font-semibold">Mix and match</h2>
          </div>
          <Sparkles className="size-5 text-gold" />
        </div>
        <p className="mt-1 text-sm text-muted">Pick a slot, then tap a piece. Top, skirt, jacket and extras mix.</p>

        <div className="mt-5">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-navy uppercase">Full looks</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {extraLooks.map((item) => {
              const on = equippedOutfit === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    equipOutfit(item.id);
                    playWhoosh();
                    toast("Changed", { description: item.name });
                  }}
                  className={cn(
                    "relative overflow-hidden rounded-xl bg-paper text-left ring-1 ring-line transition-transform duration-150 active:scale-[0.97] hover:bg-sage",
                    on && "ring-2 ring-navy",
                  )}
                >
                  <img src={item.closet} alt="" className="aspect-square w-full object-cover outline-none" />
                  {on ? (
                    <span className="absolute top-2 left-2 rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold tracking-wide text-card uppercase">
                      On
                    </span>
                  ) : null}
                  <span className="block px-2.5 py-2">
                    <span className="block text-sm font-medium">{item.name}</span>
                    <span className="block text-[11px] leading-snug text-muted">Tap to wear</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-navy uppercase">Mix pieces</p>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SLOTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSlot(item.id)}
              className={cn("min-h-10 rounded-full px-3 text-xs font-medium", slot === item.id ? "bg-navy text-card" : "bg-sage text-ink")}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {items.map((item) => {
            const have = isPieceUnlocked(item, unlocked);
            const on = look[slot] === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => pick(item.id, !have, item.need, item.name)}
                className={cn(
                  "relative overflow-hidden rounded-xl text-left ring-1 ring-line transition-transform duration-150 active:scale-[0.97]",
                  on && "ring-2 ring-navy",
                  have ? "bg-paper hover:bg-sage" : "bg-paper/70",
                )}
              >
                <img src={item.closet} alt="" className={cn("aspect-square w-full object-cover outline-none", !have && "grayscale opacity-60")} />
                {!have ? (
                  <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-navy/80 text-card">
                    <Lock className="size-3.5" />
                  </span>
                ) : null}
                {on ? (
                  <span className="absolute top-2 left-2 rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold tracking-wide text-card uppercase">
                    On
                  </span>
                ) : null}
                <span className="block px-2.5 py-2">
                  <span className="block text-sm font-medium">{item.name}</span>
                  <span className="block text-[11px] leading-snug text-muted">{have ? item.need : item.need}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Sparks({ tick }: { tick: number }) {
  const dots = [
    { x: "18%", y: "22%", d: "0ms" },
    { x: "78%", y: "18%", d: "80ms" },
    { x: "12%", y: "58%", d: "120ms" },
    { x: "86%", y: "48%", d: "40ms" },
  ];
  return (
    <div key={tick} className="pointer-events-none absolute inset-0">
      {dots.map((dot) => (
        <span
          key={dot.x + dot.y}
          className="dress-spark absolute size-2 rounded-full bg-gold"
          style={{ left: dot.x, top: dot.y, animationDelay: dot.d }}
        />
      ))}
    </div>
  );
}
