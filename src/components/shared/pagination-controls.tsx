import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type PageItem = number | "start-ellipsis" | "end-ellipsis";

function range(start: number, end: number): number[] {
  return end < start
    ? []
    : Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function getPageItems(
  page: number,
  count: number,
  boundaryCount = 1,
  siblingCount = 0
): PageItem[] {
  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(
    Math.max(count - boundaryCount + 1, boundaryCount + 1),
    count
  );

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : count - 1
  );

  return [
    ...startPages,
    ...(siblingsStart > boundaryCount + 2
      ? (["start-ellipsis"] as const)
      : boundaryCount + 1 < count - boundaryCount
        ? [boundaryCount + 1]
        : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < count - boundaryCount - 1
      ? (["end-ellipsis"] as const)
      : count - boundaryCount > boundaryCount
        ? [count - boundaryCount]
        : []),
    ...endPages,
  ];
}

interface PaginationControlsProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  page,
  pageCount,
  onPageChange,
}: PaginationControlsProps) {
  if (pageCount <= 1) return null;

  const items = getPageItems(page, pageCount);

  function go(target: number) {
    return (event: React.MouseEvent) => {
      event.preventDefault();
      onPageChange(target);
    };
  }

  return (
    <Pagination className="justify-between">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={page === 1}
            className={
              page === 1 ? "pointer-events-none opacity-50" : undefined
            }
            onClick={go(Math.max(1, page - 1))}
          />
        </PaginationItem>
      </PaginationContent>
      <PaginationContent>
        {items.map((item) =>
          item === "start-ellipsis" || item === "end-ellipsis" ? (
            <PaginationItem key={item}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                href="#"
                isActive={item === page}
                onClick={go(item)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          )
        )}
      </PaginationContent>
      <PaginationContent>
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={page === pageCount}
            className={
              page === pageCount ? "pointer-events-none opacity-50" : undefined
            }
            onClick={go(Math.min(pageCount, page + 1))}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
