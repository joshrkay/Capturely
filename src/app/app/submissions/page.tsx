import { prisma } from "@/lib/db";
import { withAccountContext } from "@/lib/account";
import { redirect } from "next/navigation";

interface SubmissionsPageProps {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}

const PAGE_SIZE = 25;

export default async function SubmissionsPage({ searchParams }: SubmissionsPageProps) {
  let ctx;
  try {
    ctx = await withAccountContext();
  } catch {
    redirect("/sign-in");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const statusFilter = params.status;
  const search = params.search?.trim();

  const where: Record<string, unknown> = { accountId: ctx.accountId };
  if (statusFilter && ["new", "read", "archived"].includes(statusFilter)) {
    // Map back to enum value
    const statusMap: Record<string, string> = { new: "new_submission", read: "read", archived: "archived" };
    where.status = statusMap[statusFilter] ?? statusFilter;
  }
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      select: {
        id: true,
        submissionId: true,
        email: true,
        phone: true,
        name: true,
        campaignId: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.submission.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statusLabel = (s: string) => {
    if (s === "new_submission") return "new";
    return s;
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Submissions</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {total} total submission{total !== 1 ? "s" : ""}
      </p>

      {/* Filters */}
      <form className="mt-4 flex gap-3" method="GET">
        <input
          type="text"
          name="search"
          placeholder="Search by email or name..."
          defaultValue={search ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <select
          name="status"
          defaultValue={statusFilter ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="archived">Archived</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No submissions yet.
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr key={sub.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">{sub.email ?? "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{sub.name ?? "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{sub.phone ?? "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        sub.status === "new_submission"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : sub.status === "read"
                            ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            : "bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500"
                      }`}
                    >
                      {statusLabel(sub.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-2">
          {page > 1 && (
            <a
              href={`/app/submissions?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}${search ? `&search=${search}` : ""}`}
              className="rounded-md border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700 dark:text-zinc-300"
            >
              Previous
            </a>
          )}
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/app/submissions?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}${search ? `&search=${search}` : ""}`}
              className="rounded-md border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700 dark:text-zinc-300"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}
