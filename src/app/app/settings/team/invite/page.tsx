"use client";

import { FormEvent, useState } from "react";

type InviteRole = "admin" | "member";
type SubmitState = "idle" | "submitting" | "success" | "error";

export default function InviteTeamMemberPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("member");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Failed to create invite");
      }

      setStatus("success");
      setEmail("");
      setRole("member");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to create invite");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Invite Team Member</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Send an invitation link to add a teammate to this workspace.
        </p>
      </div>

      <form
        className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <div>
          <label htmlFor="invite-email" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Email
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder="teammate@company.com"
          />
        </div>

        <div>
          <label htmlFor="invite-role" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Role
          </label>
          <select
            id="invite-role"
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value as InviteRole)}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {status === "submitting" ? "Sending Invite..." : "Send Invite"}
        </button>

        {status === "success" && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Invite created successfully.
          </p>
        )}
        {status === "error" && errorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        )}
      </form>
    </div>
  );
}
