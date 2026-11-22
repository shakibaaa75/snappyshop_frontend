// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useQuery } from "@tanstack/react-query";
// import { Loader2 } from "lucide-react";
// import { PlanCards } from "@/components/pricing/PlanCards";
// import { authApi } from "@/lib/api/auth";
// import { qk } from "@/lib/query/keys";
// import {
//   clearPlanIntent,
//   readPlanIntent,
//   savePlanIntent,
//   subscriptionUrl,
//   type PlanIntent,
// } from "@/lib/plan-intent";
// import type { BillingInterval, PlanId } from "@/lib/subscription";

// /**
//  * Shown right after a seller registers: go Free, or pick a pack. A paid pack
//  * is paid for on the Subscription page as soon as the store exists (the next
//  * step), with the plan already selected.
//  */
// export function PlanClient() {
//   const router = useRouter();
//   const [pending, setPending] = useState<PlanId | null>(null);
//   const [intent, setIntent] = useState<PlanIntent | null>(null);
//   const { data: me, isLoading } = useQuery({
//     queryKey: qk.auth.me,
//     queryFn: authApi.me,
//     retry: false,
//   });

//   useEffect(() => {
//     setIntent(readPlanIntent());
//   }, []);

//   useEffect(() => {
//     if (isLoading) return;
//     if (!me) router.replace("/login?next=/seller/plan");
//     else if (me.role !== "SELLER") router.replace("/account");
//     // A seller who already has a store buys plans from the dashboard.
//     else if (me.storeSlug)
//       router.replace(subscriptionUrl(me.storeSlug, readPlanIntent()));
//   }, [me, isLoading, router]);

//   if (isLoading || !me || me.role !== "SELLER" || me.storeSlug) {
//     return (
//       <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
//         <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {"Loading…"}
//       </div>
//     );
//   }

//   const choose = (plan: PlanId, interval: BillingInterval) => {
//     setPending(plan);
//     if (plan === "free") clearPlanIntent();
//     else savePlanIntent({ plan, interval });
//     router.push("/seller/setup");
//   };

//   return (
//     <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
//       <header className="mx-auto mb-10 max-w-2xl text-center">
//         <p className="text-xs font-semibold uppercase tracking-widest text-accent">
//           Almost there
//         </p>
//         <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
//           Choose your plan
//         </h1>
//         <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
//           Start free, or pick a pack for more products and features. You can change your plan any time.
//         </p>
//       </header>

//       <PlanCards
//         onChoose={choose}
//         pendingPlan={pending}
//         highlightPlan={intent?.plan ?? null}
//         defaultInterval={intent?.interval ?? "monthly"}
//         ctaFor={(p) =>
//           p.monthly > 0
//             ? `Continue with ${p.name}`
//             : "Continue with Free"
//         }
//       />

//       <p className="mx-auto mt-8 max-w-xl text-center text-xs text-muted-foreground">
//         If you pick a paid pack, you pay for it right after your store is created in the next step.
//       </p>
//     </div>
//   );
// }
