"use client";
import { useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { supportApi, type SupportTicket } from "@/lib/api/support";
import { Search, ArrowLeft, Send, LifeBuoy } from "lucide-react";

const buyer = [
  "Orders & Purchases",
  "Payments & Refunds",
  "Delivery Issues",
  "Seller Problems",
  "Fraud & Safety",
  "Account & Security",
  "Other Questions",
];
const seller = [
  "Store Setup & Management",
  "Products & Orders",
  "Billing & Subscriptions",
  "Domains & Storefront",
  "Delivery & Courier",
  "Technical Support",
  "Security & Reports",
  "Other Questions",
];
const general = [
  "Business Partnerships",
  "Media & Press",
  "Legal & Privacy",
  "General Questions",
];
const other = [
  "General Questions",
  "Features & Services",
  "Feedback & Suggestions",
  "Website Issues",
  "Policies & Guidelines",
  "Something Else",
];
const questions: Record<string, string[]> = {
  "Orders & Purchases": [
    "Order status",
    "Order cancellation",
    "Missing order",
    "Other order question",
  ],
  "Payments & Refunds": [
    "Payment failed",
    "Refund request",
    "Billing discrepancy",
    "Other payment question",
  ],
  "Delivery Issues": [
    "Late delivery",
    "Wrong address",
    "Missing package",
    "Courier issue",
  ],
  "Seller Problems": [
    "Seller not responding",
    "Wrong product",
    "Store complaint",
  ],
  "Fraud & Safety": [
    "Suspicious activity",
    "Report a seller",
    "Other safety concern",
  ],
  "Account & Security": [
    "Login issue",
    "Password reset",
    "Account access",
    "Security concern",
  ],
  "Other Questions": other,
  "Store Setup & Management": [
    "Creating a store",
    "Store settings",
    "Store customization",
  ],
  "Products & Orders": [
    "Adding products",
    "Managing variants",
    "Order management",
  ],
  "Billing & Subscriptions": [
    "Subscription plans",
    "Payment issue",
    "Invoice question",
  ],
  "Domains & Storefront": ["Custom domain", "DNS setup", "Storefront issue"],
  "Delivery & Courier": [
    "Delivery pricing",
    "Courier connection",
    "Shipment issue",
  ],
  "Technical Support": ["Website error", "Slow loading", "Integration issue"],
  "Security & Reports": [
    "Account security",
    "Suspicious orders",
    "Report abuse",
  ],
  "Business Partnerships": ["Partnership proposal", "Affiliate inquiry"],
  "Media & Press": ["Press inquiry", "Brand assets"],
  "Legal & Privacy": ["Privacy request", "Legal question"],
  "General Questions": [
    "About SnappyShop",
    "Features & Services",
    "Something Else",
  ],
};
const faqs = [
  {
    q: "Where can I find my orders?",
    a: "Sign in to your buyer account and open My Orders.",
    role: "BUYER",
  },
  {
    q: "How can I request a refund?",
    a: "Review the refund policy and contact support with your order number.",
    role: "BUYER",
  },
  {
    q: "How do I set up my store?",
    a: "Sign in as a seller and follow the store setup steps in your dashboard.",
    role: "SELLER",
  },
  {
    q: "How can I connect my custom domain?",
    a: "Open your seller domain settings and follow the DNS instructions shown there.",
    role: "SELLER",
  },
  {
    q: "How do I reset my password?",
    a: "Use the Forgot Password page to request a reset code.",
    role: "ALL",
  },
];
export default function HelpPage() {
  const [role, setRole] = useState("BUYER"),
    [logged, setLogged] = useState(false),
    [loadingUser, setLoadingUser] = useState(true),
    [name, setName] = useState(""),
    [email, setEmail] = useState("");
  const [category, setCategory] = useState(""),
    [subcategory, setSubcategory] = useState(""),
    [subject, setSubject] = useState(""),
    [message, setMessage] = useState(""),
    [orderId, setOrderId] = useState(""),
    [shopId, setShopId] = useState("");
  const [search, setSearch] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [tickets, setTickets] = useState<SupportTicket[]>([]),
    [active, setActive] = useState(""),
    [reply, setReply] = useState("");
  useEffect(() => {
    authApi
      .me()
      .then((u) => {
        setLogged(true);
        setRole(u.role);
        setName(u.name || "");
        setEmail(u.email);
        return u.role === "SELLER"
          ? supportApi.mine().then((x) => setTickets(x.tickets))
          : undefined;
      })
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, []);
  const categories =
    role === "SELLER" ? seller : role === "GENERAL" ? general : buyer;
  const filtered = useMemo(
    () =>
      faqs.filter(
        (f) =>
          (f.role === "ALL" || f.role === role) &&
          `${f.q} ${f.a}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [role, search],
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const isSeller = logged && role === "SELLER";
      const result = isSeller
        ? await supportApi.create({
            name,
            email,
            role,
            category,
            subcategory,
            subject,
            message,
            orderId,
            shopId,
          })
        : null;
      if (!isSeller)
        await supportApi.contact({
          name,
          email,
          category,
          subcategory,
          subject,
          message,
        });
      setSuccess(result?.ticket.number || "MESSAGE_SENT");
      setSubject("");
      setMessage("");
      if (logged && role === "SELLER") {
        const x = await supportApi.mine();
        setTickets(x.tickets);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send request");
    } finally {
      setBusy(false);
    }
  }
  async function sendReply(id: string) {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await supportApi.reply(id, reply);
      setReply("");
      const x = await supportApi.mine();
      setTickets(x.tickets);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to reply");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 text-black sm:px-8 sm:py-16">
      <div className="text-center">
        <span className="text-sm font-semibold text-[#0C68F6]">
          SNAPPYSHOP HELP CENTER
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
          How can we help you?
        </h1>
        <p className="mt-4 text-gray-600">
          Find answers, get support, and connect with the SnappyShop team.
        </p>
        <div className="relative mx-auto mt-8 max-w-2xl">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            aria-label="Search help articles"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search help articles and FAQs"
            className="w-full rounded-xl border border-gray-300 bg-white py-4 pl-12 pr-4 outline-none focus:border-[#0C68F6]"
          />
        </div>
      </div>
      {!loadingUser && !logged && (
        <div
          className="mt-10 flex flex-wrap justify-center gap-2"
          aria-label="Support audience"
        >
          {["BUYER", "SELLER", "GENERAL"].map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                setCategory("");
                setSubcategory("");
              }}
              className={`rounded-lg border px-5 py-2 text-sm font-medium ${role === r ? "border-[#0C68F6] bg-blue-50 text-[#0C68F6]" : "border-gray-200"}`}
            >
              {r === "GENERAL"
                ? "General Inquiry"
                : r === "BUYER"
                  ? "Buyer"
                  : "Seller"}
            </button>
          ))}
        </div>
      )}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Browse support topics</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setSubcategory("");
                setSuccess("");
              }}
              className={`flex items-center gap-4 rounded-xl border p-5 text-left transition hover:border-[#0C68F6] ${category === c ? "border-[#0C68F6] bg-blue-50" : "border-gray-200 bg-white"}`}
            >
              <span className="rounded-lg bg-gray-100 p-3 text-[#0C68F6]">
                <LifeBuoy size={22} />
              </span>
              <span>
                <strong className="block text-sm">{c}</strong>
                <span className="mt-1 block text-xs text-gray-500">
                  Get help with {c.toLowerCase()}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
      {category && (
        <section className="mt-12 rounded-2xl border border-gray-200 p-5 sm:p-8">
          <button
            onClick={() => {
              setCategory("");
              setSubcategory("");
            }}
            className="mb-4 flex items-center gap-2 text-sm text-gray-600"
          >
            <ArrowLeft size={16} /> All categories
          </button>
          <h2 className="text-2xl font-semibold">{category}</h2>
          <p className="mt-2 text-gray-500">
            Choose the topic that best describes your question.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(questions[category] || other).map((s) => (
              <button
                key={s}
                onClick={() => setSubcategory(s)}
                className={`rounded-lg border p-4 text-left text-sm ${subcategory === s ? "border-[#0C68F6] bg-blue-50 text-[#0C68F6]" : "border-gray-200"}`}
              >
                {s}
              </button>
            ))}
          </div>
          {subcategory && (
            <form
              onSubmit={submit}
              className="mt-8 grid gap-4 border-t border-gray-200 pt-8 sm:grid-cols-2"
            >
              <h3 className="text-xl font-semibold sm:col-span-2">
                Contact support
              </h3>
              <label className="text-sm font-medium">
                Full name
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-lg border p-3"
                />
              </label>
              <label className="text-sm font-medium">
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-lg border p-3"
                />
              </label>
              <label className="text-sm font-medium">
                Category
                <input
                  readOnly
                  value={category}
                  className="mt-2 w-full rounded-lg border bg-gray-50 p-3"
                />
              </label>
              <label className="text-sm font-medium">
                Subcategory
                <input
                  readOnly
                  value={subcategory}
                  className="mt-2 w-full rounded-lg border bg-gray-50 p-3"
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Subject
                <input
                  required
                  minLength={3}
                  maxLength={180}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-2 w-full rounded-lg border p-3"
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Detailed message
                <textarea
                  required
                  minLength={10}
                  maxLength={8000}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2 w-full rounded-lg border p-3"
                />
              </label>
              {/order|payment|delivery/i.test(category) && (
                <label className="text-sm font-medium">
                  Related order ID (optional)
                  <input
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="mt-2 w-full rounded-lg border p-3"
                  />
                </label>
              )}
              {/seller|store|domain/i.test(category) && (
                <label className="text-sm font-medium">
                  Shop ID or URL (optional)
                  <input
                    value={shopId}
                    onChange={(e) => setShopId(e.target.value)}
                    className="mt-2 w-full rounded-lg border p-3"
                  />
                </label>
              )}
              {error && (
                <p role="alert" className="text-sm text-red-600 sm:col-span-2">
                  {error}
                </p>
              )}
              <div className="sm:col-span-2">
                <button
                  disabled={busy}
                  className="flex items-center gap-2 rounded-lg bg-[#0C68F6] px-6 py-3 font-semibold text-white disabled:opacity-50"
                >
                  <Send size={17} />
                  {busy
                    ? "Submitting…"
                    : role === "SELLER" && logged
                      ? "Create support ticket"
                      : "Send contact message"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}
      {success && (
        <div
          role="status"
          className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5"
        >
          {success === "MESSAGE_SENT" ? (
            "Your contact message was sent successfully. Our team will review it."
          ) : (
            <>
              Your support ticket was created: <strong>{success}</strong>. You
              can continue the conversation below.
            </>
          )}
        </div>
      )}
      <section className="mt-14">
        <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mt-5 divide-y rounded-xl border">
          {filtered.length ? (
            filtered.map((f) => (
              <details key={f.q} className="p-5">
                <summary className="cursor-pointer font-medium">{f.q}</summary>
                <p className="mt-3 text-sm text-gray-600">{f.a}</p>
              </details>
            ))
          ) : (
            <p className="p-5 text-gray-500">
              No matching articles. You can still contact support above.
            </p>
          )}
        </div>
      </section>
      {logged && role === "SELLER" && (
        <section className="mt-14">
          <h2 className="text-2xl font-semibold">My Support Tickets</h2>
          <div className="mt-5 space-y-3">
            {tickets.length === 0 ? (
              <p className="text-gray-500">No support requests yet.</p>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="rounded-xl border p-5">
                  <button
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() => setActive(active === t.id ? "" : t.id)}
                  >
                    <span>
                      <strong>{t.subject}</strong>
                      <span className="mt-1 block text-xs text-gray-500">
                        {t.number} · {t.category}
                      </span>
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                      {t.status}
                    </span>
                  </button>
                  {active === t.id && (
                    <div className="mt-5 space-y-3 border-t pt-4">
                      {t.messages.map((m, i) => (
                        <div key={i} className="rounded-lg bg-gray-50 p-3">
                          <span className="text-xs font-semibold uppercase text-gray-500">
                            {m.author}
                          </span>
                          <p className="mt-1 whitespace-pre-wrap text-sm">
                            {m.body}
                          </p>
                        </div>
                      ))}
                      <textarea
                        aria-label="Reply to support"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border p-3"
                        placeholder="Write a reply…"
                      />
                      <button
                        disabled={busy || !reply.trim()}
                        onClick={() => sendReply(t.id)}
                        className="rounded-lg bg-[#0C68F6] px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                      >
                        Send reply
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}
      <p className="mt-12 text-sm text-gray-500">
        For fraud, scams, or platform abuse, contact support using the Fraud
        &amp; Safety category.
      </p>
    </main>
  );
}
