import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, BookOpen } from "lucide-react";
import {
  formationPdfHref,
  loadFormationProgress,
  saveFormationProgress,
  type FormationChapter,
  type FormationDocument,
} from "@/lib/formation-resources";
import { cn } from "@/lib/utils";

type Props = {
  document: FormationDocument;
  initialChapterId?: string;
  onClose?: () => void;
};

export function PdfDocumentViewer({ document, initialChapterId, onClose }: Props) {
  const saved = useMemo(() => loadFormationProgress(document.id), [document.id]);
  const startChapter = document.chapters.find((c) => c.id === initialChapterId);
  const [page, setPage] = useState(() => {
    if (startChapter) return startChapter.page;
    if (saved?.page) return Math.min(saved.page, document.pageCount);
    return 1;
  });
  const [activeChapterId, setActiveChapterId] = useState<string | undefined>(
    startChapter?.id ?? saved?.chapterId ?? document.chapters[0]?.id,
  );

  const viewerSrc = useMemo(() => {
    // Affiche le PDF original à la page demandée (lecteur navigateur).
    const base = formationPdfHref(document);
    return `${base}#page=${page}`;
  }, [document, page]);

  useEffect(() => {
    saveFormationProgress(document.id, {
      page,
      chapterId: activeChapterId,
      updatedAt: new Date().toISOString(),
    });
  }, [document.id, page, activeChapterId]);

  function goChapter(chapter: FormationChapter) {
    setActiveChapterId(chapter.id);
    setPage(chapter.page);
  }

  function goPage(next: number) {
    const p = Math.max(1, Math.min(document.pageCount, next));
    setPage(p);
    const match = document.chapters.find((c) => {
      const end = c.endPage ?? c.page;
      return p >= c.page && p <= end;
    });
    if (match) setActiveChapterId(match.id);
  }

  return (
    <div className="surface overflow-hidden rounded-2xl border border-border/80" data-testid="pdf-document-viewer">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{document.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            Page {page} / {document.pageCount}
            {saved && saved.page !== page ? ` · reprise enregistrée p.${saved.page}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
            onClick={() => goPage(page - 1)}
            disabled={page <= 1}
            aria-label="Page précédente"
            data-testid="button-pdf-prev"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
            onClick={() => goPage(page + 1)}
            disabled={page >= document.pageCount}
            aria-label="Page suivante"
            data-testid="button-pdf-next"
          >
            <ChevronRight size={18} />
          </button>
          <a
            href={formationPdfHref(document)}
            download
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted"
            data-testid="link-pdf-download"
          >
            <Download size={14} /> PDF
          </a>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Fermer
            </button>
          )}
        </div>
      </div>

      <div className={cn("grid", document.chapters.length > 0 && "lg:grid-cols-[240px_1fr]")}>
        {document.chapters.length > 0 && (
          <aside className="max-h-[min(70vh,720px)] overflow-y-auto border-b border-border/70 bg-muted/30 p-3 lg:border-b-0 lg:border-r">
            <p className="mb-2 flex items-center gap-1.5 px-2 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">
              <BookOpen size={12} /> Sommaire
            </p>
            <nav className="space-y-0.5">
              {document.chapters.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => goChapter(ch)}
                  className={cn(
                    "w-full rounded-lg px-2.5 py-2 text-left text-[12px] leading-snug transition-colors",
                    activeChapterId === ch.id
                      ? "bg-secondary text-primary font-semibold"
                      : "text-foreground/80 hover:bg-background",
                  )}
                  data-testid={`button-chapter-${ch.id}`}
                >
                  <span className="block">{ch.title}</span>
                  <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                    p. {ch.page}
                    {ch.endPage && ch.endPage !== ch.page ? `–${ch.endPage}` : ""}
                  </span>
                </button>
              ))}
            </nav>
          </aside>
        )}

        <div className="bg-[#e8ecf1]">
          <iframe
            key={document.id}
            title={document.title}
            src={viewerSrc}
            className="h-[min(70vh,720px)] w-full border-0 bg-white"
            data-testid="iframe-pdf-viewer"
          />
          <p className="px-4 py-2 text-center text-[11px] text-muted-foreground">
            Contenu original du PDF — non modifié. Utilisez les flèches ou le sommaire pour naviguer.
          </p>
        </div>
      </div>
    </div>
  );
}
