/**
 * Every row a query matches, not just the first page.
 *
 * PostgREST caps a bare `.select()` at 1000 rows by default. That cap is
 * silent — no error, no truncation flag, just fewer rows than actually
 * exist — which is exactly wrong for anything computing a total. The admin
 * orders and billing pages built "revenue all time" and similar figures on
 * unbounded `.select("amount_pkr, status")` calls; past 1000 orders they
 * would have quietly under-reported revenue with nothing to show it.
 *
 * `page` takes the range for one page and returns that page's rows. A
 * Supabase query builder is consumed by awaiting it once, so the caller
 * rebuilds the query (same filters, new `.range()`) on every call rather
 * than one query object being reused.
 *
 * Usage:
 *   const rows = await fetchAll((from, to) =>
 *     supabase.from("orders").select("amount_pkr, status").range(from, to)
 *   );
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000
): Promise<T[]> {
  const rows: T[] = [];
  let start = 0;

  for (;;) {
    const { data, error } = await page(start, start + pageSize - 1);
    if (error) throw new Error(error.message);

    const batch = data ?? [];
    rows.push(...batch);

    if (batch.length < pageSize) break;
    start += pageSize;
  }

  return rows;
}
