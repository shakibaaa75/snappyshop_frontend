"use client";
import { useEffect, useState } from "react";
import { supportApi, type SupportTicket } from "@/lib/api/support";
export default function SupportAdminPage() {
  const [contacts, setContacts] = useState<
    Array<{
      _id: string;
      name: string;
      email: string;
      role: string;
      category: string;
      subcategory: string;
      subject: string;
      message: string;
      createdAt: string;
      status?: string;
      replies?: Array<{ message: string; sentAt: string }>;
    }>
  >([]);
  const [contactDrafts, setContactDrafts] = useState<Record<string, string>>(
    {},
  );
  const [tickets, setTickets] = useState<SupportTicket[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [selected, setSelected] = useState(""),
    [reply, setReply] = useState(""),
    [internal, setInternal] = useState(false),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("");
  async function refresh() {
    try {
      const x = await supportApi.all();
      setTickets(x.tickets);
      const c = await supportApi.contacts();
      setContacts(c.messages);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load support tickets",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function send(id: string) {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await supportApi.reply(id, reply, internal, true);
      setReply("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reply failed");
    } finally {
      setBusy(false);
    }
  }
  async function sendContact(id: string) {
    const message = (contactDrafts[id] || "").trim();
    if (!message) return;
    setBusy(true);
    try {
      await supportApi.contactReply(id, message);
      setContactDrafts((v) => ({ ...v, [id]: "" }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Email reply failed");
    } finally {
      setBusy(false);
    }
  }
  async function update(
    id: string,
    body: { status?: string; priority?: string; assignedTo?: string },
  ) {
    setBusy(true);
    try {
      await supportApi.update(id, body);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }
  const visible = tickets.filter((t) =>
    `${t.number} ${t.email} ${t.subject} ${t.role}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );
  return (
    <main className="space-y-6 p-4 text-black sm:p-8">
      <div>
        <h1 className="text-2xl font-bold">Support tickets</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage seller tickets and separate buyer/guest contact messages.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {["Open", "In Progress", "Resolved"].map((status) => (
          <div key={status} className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">{status}</p>
            <strong className="text-2xl">
              {tickets.filter((t) => t.status === status).length}
            </strong>
          </div>
        ))}
      </div>
      <input
        aria-label="Search support tickets"
        placeholder="Search ticket ID, email, subject or role"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full rounded-lg border bg-white p-3"
      />
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {loading ? (
        <p>Loading tickets…</p>
      ) : visible.length === 0 ? (
        <p className="text-gray-500">No matching tickets.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => (
            <article key={t.id} className="rounded-xl border bg-white p-5">
              <button
                className="flex w-full items-start justify-between gap-4 text-left"
                onClick={() => setSelected(selected === t.id ? "" : t.id)}
              >
                <span>
                  <strong>{t.subject}</strong>
                  <span className="mt-1 block text-xs text-gray-500">
                    {t.number} · {t.email} · {t.role} · {t.category}
                  </span>
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                  {t.status}
                </span>
              </button>
              {selected === t.id && (
                <div className="mt-5 space-y-4 border-t pt-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-sm">
                      Status
                      <select
                        value={t.status}
                        disabled={busy}
                        onChange={(e) =>
                          update(t.id, { status: e.target.value })
                        }
                        className="mt-1 block w-full rounded-lg border p-2"
                      >
                        {[
                          "Open",
                          "In Progress",
                          "Waiting for User",
                          "Resolved",
                          "Closed",
                        ].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm">
                      Priority
                      <select
                        value={t.priority}
                        disabled={busy}
                        onChange={(e) =>
                          update(t.id, { priority: e.target.value })
                        }
                        className="mt-1 block w-full rounded-lg border p-2"
                      >
                        {["Low", "Normal", "High", "Urgent"].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm">
                      Assigned administrator
                      <input
                        defaultValue={t.assignedTo || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (t.assignedTo || ""))
                            void update(t.id, { assignedTo: e.target.value });
                        }}
                        className="mt-1 block w-full rounded-lg border p-2"
                      />
                    </label>
                  </div>
                  {t.messages.map((m, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-4 ${m.internal ? "bg-amber-50" : "bg-gray-50"}`}
                    >
                      <span className="text-xs font-semibold uppercase text-gray-500">
                        {m.author}
                        {m.internal ? " · Internal note" : ""}
                      </span>
                      <p className="mt-2 whitespace-pre-wrap text-sm">
                        {m.body}
                      </p>
                    </div>
                  ))}
                  <textarea
                    aria-label="Support response"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={4}
                    placeholder="Write a reply or internal note"
                    className="w-full rounded-lg border p-3"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={internal}
                      onChange={(e) => setInternal(e.target.checked)}
                    />{" "}
                    Private internal note
                  </label>
                  <button
                    disabled={busy || !reply.trim()}
                    onClick={() => send(t.id)}
                    className="rounded-lg bg-[#0C68F6] px-5 py-2 font-medium text-white disabled:opacity-50"
                  >
                    {busy
                      ? "Saving…"
                      : internal
                        ? "Save private note"
                        : "Send reply"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      <section className="space-y-3 border-t pt-8">
        <h2 className="text-xl font-bold">
          Buyer &amp; guest contact messages
        </h2>
        <p className="text-sm text-gray-500">
          These are one-way inquiries, not support tickets. Reply here to send
          an email directly to the buyer or guest.
        </p>
        {contacts.length === 0 ? (
          <p className="text-gray-500">No contact messages.</p>
        ) : (
          contacts.map((m) => (
            <article key={m._id} className="rounded-xl border bg-white p-5">
              <div className="font-semibold">{m.subject}</div>
              <div className="text-sm text-gray-500">
                {m.name} · {m.email} · {m.role} · {m.category}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
              <p className="mt-2 text-xs text-gray-500">{m.status || "New"}</p>
              {m.replies?.map((r, i) => (
                <div key={i} className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
                  <strong>Sent by email</strong>
                  <p className="whitespace-pre-wrap">{r.message}</p>
                </div>
              ))}
              <textarea
                aria-label={`Email reply to ${m.email}`}
                rows={3}
                value={contactDrafts[m._id] || ""}
                onChange={(e) =>
                  setContactDrafts((v) => ({ ...v, [m._id]: e.target.value }))
                }
                placeholder="Write an email reply"
                className="mt-3 w-full rounded-lg border p-3"
              />
              <button
                disabled={busy || !(contactDrafts[m._id] || "").trim()}
                onClick={() => void sendContact(m._id)}
                className="mt-2 rounded-lg bg-[#0C68F6] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send email reply"}
              </button>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
