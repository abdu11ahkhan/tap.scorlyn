"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { deleteFaq, saveFaq } from "../actions";

type Faq = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
};

function Row({ item, onDone }: { item: Faq | null; onDone: () => void }) {
  const [question, setQuestion] = useState(item?.question ?? "");
  const [answer, setAnswer] = useState(item?.answer ?? "");
  const [order, setOrder] = useState(item?.sort_order ?? 0);
  const [published, setPublished] = useState(item?.published ?? true);

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <div className="app-panel app-panel-pad space-y-3">
      <input
        value={question}
        onChange={(e) => {
          setQuestion(e.target.value);
          setSaved(false);
        }}
        placeholder="Question"
        className="app-input font-medium"
      />
      <textarea
        value={answer}
        onChange={(e) => {
          setAnswer(e.target.value);
          setSaved(false);
        }}
        rows={3}
        placeholder="Answer"
        className="app-input"
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          title="Lower sorts first"
          className="app-input w-20"
        />
        <button
          type="button"
          onClick={() => setPublished((v) => !v)}
          className={`app-btn ${published ? "app-btn-primary" : "app-btn-ghost"}`}
        >
          {published ? "Published" : "Hidden"}
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const r = await saveFaq({
                id: item?.id,
                question,
                answer,
                sortOrder: order,
                published,
              });
              if (!r.ok) setError(r.error ?? "Failed.");
              else {
                setSaved(true);
                if (!item) {
                  setQuestion("");
                  setAnswer("");
                }
                onDone();
              }
            });
          }}
          className="app-btn app-btn-primary"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5" />
          ) : item ? null : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {item ? (saved ? "Saved" : "Save") : "Add"}
        </button>

        {item && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!window.confirm("Delete this FAQ?")) return;
              startTransition(async () => {
                const r = await deleteFaq(item.id);
                if (!r.ok) setError(r.error ?? "Failed.");
                else onDone();
              });
            }}
            className="app-btn app-btn-danger ml-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        )}

        {error && <span className="text-[13px] font-medium text-hotpink">{error}</span>}
      </div>
    </div>
  );
}

export default function FaqEditor({ items }: { items: Faq[] }) {
  const router = useRouter();
  const refresh = () => router.refresh();

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Row key={item.id} item={item} onDone={refresh} />
      ))}

      <div>
        <p className="app-h2 mb-2">Add a question</p>
        <Row item={null} onDone={refresh} />
      </div>
    </div>
  );
}
