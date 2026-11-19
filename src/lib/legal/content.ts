/**
 * ShopBD legal content (English).
 *
 * HOW TO EDIT
 *  - A body line starting with "- " is shown as a bullet.
 *  - Search for "[" to find placeholders you must fill (company name, address, email…).
 */

export type Section = { id: string; title: string; body: string[] };
export type LegalDoc = {
  slug: "terms" | "privacy" | "refund-policy" | "cookie-policy";
  title: string;
  intro: string;
  sections: Section[];
};

export const LEGAL_META = {
  effectiveDate: "[1 January 2027]",
  lastUpdated: "[1 January 2027]",
  company: "[Your Legal Company Name]",
  address: "[Full registered address, Bangladesh]",
  email: "[support@yourdomain.com]",
  phone: "[+880 1XXX-XXXXXX]",
  refundDaysBuyer: 7, // days after delivery to report a problem
  refundWorkingDays: "7–10", // working days to return money
};

/* ------------------------------------------------------------------ */
/* TERMS & CONDITIONS                                                  */
/* ------------------------------------------------------------------ */
export const terms: LegalDoc = {
  slug: "terms",
  title: "Terms & Conditions",
  intro: "Please read these Terms carefully. By visiting ShopBD, creating an account, placing an order, opening a store or buying a subscription, you agree to them.",
  sections: [
    {
      id: "about",
      title: "1. About ShopBD and acceptance",
      body: [
          "ShopBD (“we”, “us”, “the Platform”) is an online multi-vendor marketplace operated by [Your Legal Company Name], Bangladesh. We let independent sellers open online stores and let buyers purchase from them.",
          "By using the Platform you confirm that you have read, understood and accepted these Terms, our Privacy Policy, our Cookie Policy and our Return & Refund Policy. If you do not agree, please do not use the Platform.",
        ],
    },
    {
      id: "role",
      title: "2. Our role — we are a marketplace",
      body: [
          "Sellers are independent businesses. When you buy a product, the sale contract is between you and the Seller, not ShopBD. Sellers are responsible for their product descriptions, prices, stock, quality, packaging, delivery and after-sales service.",
          "ShopBD provides the technology, payment collection tools, courier tools and a problem-reporting system. We may step in to help resolve disputes, but we do not guarantee any Seller’s products or conduct.",
        ],
    },
    {
      id: "accounts",
      title: "3. Accounts",
      body: [
          "- You must be at least 18 years old (or have a parent/guardian’s permission) and legally able to enter a contract.",
          "- Give true, complete and current information. You may sign up with email or with Google / Apple sign-in.",
          "- Keep your password and verification codes secret. You are responsible for all activity on your account.",
          "- One person or business should keep one account. Tell us immediately if you think your account was misused.",
          "- We may ask Sellers to submit identity or business documents for verification, and may approve, reject or revoke verification at our discretion.",
        ],
    },
    {
      id: "buyers",
      title: "4. Buyers: orders and payments",
      body: [
          "- An order is confirmed only after the Seller accepts it. Prices and stock shown can change until then.",
          "- Payment methods may include bKash, Nagad, Rocket, cards (through our payment gateway partner) and Cash on Delivery (COD). A small COD handling fee may apply and is shown before you confirm.",
          "- Delivery time and delivery charge are shown at checkout and depend on the Seller and courier.",
          "- Please give a correct address and phone number. Repeated fake orders, refusing delivery without reason or abusing COD may lead to restrictions on your account.",
          "- Problems with an order are handled under our Return & Refund Policy.",
        ],
    },
    {
      id: "sellers",
      title: "5. Sellers: stores and listings",
      body: [
          "- You must be the lawful owner or authorised seller of everything you list, and must describe products honestly (price, size, colour, condition, origin).",
          "- You must ship orders on time, keep stock accurate, pack properly, and respond to buyers and to problem reports quickly.",
          "- You are responsible for your own taxes, trade licence, VAT and any permits your products need under Bangladesh law.",
          "- Your store address (URL) may be changed by you; we keep a history of address and shop-name changes for security and dispute purposes.",
          "- If you connect a courier account, you authorise us to use your credentials only to create and track shipments for your orders. Credentials are stored encrypted.",
          "- Plan limits (for example number of products, themes, analytics, custom domain, tracking pixels, auto-courier) depend on your plan. Features beyond your plan are locked.",
          "- We may feature, restrict, suspend or remove a store that breaks these Terms or harms buyers.",
        ],
    },
    {
      id: "subscriptions",
      title: "6. Seller subscriptions",
      body: [
          "ShopBD offers a Free plan and paid plans (currently Pro and Business). You can buy a paid plan for 1 month, 6 months (10% off) or 12 months (20% off). Your first paid purchase also gets an extra 5% off. Current prices, discounts and features are shown on the subscription page of your seller dashboard and may change for future purchases.",
          "Paid plans are billed by actual time used, calculated per minute. If you stop or cancel early, the unused minutes are returned to you. The full rules, formula and examples are in our Return & Refund Policy (Part B), which forms part of these Terms.",
          "Plans set by an admin as a free offer or trial give no access until you claim them, and have no cash value or refund.",
        ],
    },
    {
      id: "prohibited",
      title: "7. Prohibited conduct and items",
      body: [
          "You must not:",
          "- sell illegal, stolen, counterfeit or pirated goods, weapons, drugs, adult content or anything banned by Bangladesh law;",
          "- post false, misleading, abusive, hateful or defamatory content, or fake reviews;",
          "- hack, scrape, overload, reverse-engineer or bypass security or plan limits of the Platform;",
          "- use the Platform for fraud, money laundering, phishing or spam;",
          "- take buyers off the Platform to avoid payment rules, or misuse another person’s data.",
        ],
    },
    {
      id: "ip",
      title: "8. Content and intellectual property",
      body: [
          "The ShopBD name, logo, design and software belong to us. You may not copy or reuse them without written permission.",
          "You keep ownership of the content you upload (photos, descriptions, logos). You give us a non-exclusive, worldwide, royalty-free licence to host, display, resize and promote that content on and for the Platform. You promise you have the right to upload it.",
          "If you believe content on ShopBD infringes your rights, email us at [support@yourdomain.com] with proof and we will review it.",
        ],
    },
    {
      id: "enforcement",
      title: "9. Suspension, restriction and termination",
      body: [
          "We may warn, restrict, suspend or ban an account, hide a store and its products, or cancel orders if we reasonably believe these Terms were broken, the law was violated, fraud is suspected, or a buyer or the Platform may be harmed.",
          "A suspended or banned store is not shown publicly. You can stop using ShopBD at any time. Any amount due to you or by you at that time is settled under the Refund Policy and these Terms.",
          "Orders already paid by buyers will be fulfilled or refunded as required to protect buyers.",
        ],
    },
    {
      id: "liability",
      title: "10. Disclaimer and limit of liability",
      body: [
          "The Platform is provided “as is” and “as available”. We work hard for reliable service but do not promise it will always be uninterrupted or error-free.",
          "To the fullest extent allowed by law, ShopBD is not liable for Seller conduct, product quality, courier delays, payment-provider outages, or indirect or consequential loss (such as lost profit or lost data). Our total liability to you for any claim is limited to the amount you paid to ShopBD in the 3 months before the claim.",
          "Nothing in these Terms removes any right you have under the Consumer Rights Protection Act 2009 or other mandatory laws of Bangladesh.",
        ],
    },
    {
      id: "indemnity",
      title: "11. Your responsibility (indemnity)",
      body: [
          "If your content, products or conduct breaks the law or these Terms and this causes a claim, loss or cost to ShopBD, you agree to compensate us for it, including reasonable legal fees.",
        ],
    },
    {
      id: "privacy-link",
      title: "12. Privacy",
      body: ["How we collect and use personal data is explained in our Privacy Policy, which is part of these Terms."],
    },
    {
      id: "changes",
      title: "13. Changes to these Terms",
      body: [
          "We may update these Terms. For important changes we will notify you by email, dashboard notice or a banner before they take effect. If you keep using the Platform after the effective date you accept the update. A paid-plan Seller who does not accept a change may cancel and receive an unused-time refund under the Refund Policy.",
        ],
    },
    {
      id: "law",
      title: "14. Governing law and disputes",
      body: [
          "These Terms are governed by the laws of the People’s Republic of Bangladesh.",
          "Please contact us first at [support@yourdomain.com]; we will try in good faith to resolve any complaint within 15 days. If it is not resolved, the courts of Dhaka, Bangladesh have jurisdiction, unless mandatory law gives you another forum.",
        ],
    },
    {
      id: "language",
      title: "15. General terms and contact",
      body: [
          "If any part is found invalid, the rest stays in force. Not enforcing a right now does not waive it later. You may not transfer your account or rights to anyone else without our consent.",
          "Contact: [Your Legal Company Name], [Full registered address, Bangladesh] · [support@yourdomain.com] · [+880 1XXX-XXXXXX]",
        ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* PRIVACY POLICY                                                      */
/* ------------------------------------------------------------------ */
export const privacy: LegalDoc = {
  slug: "privacy",
  title: "Privacy Policy",
  intro: "Your privacy matters to us. This policy explains what personal data ShopBD collects, why, who sees it, and the choices you have. We never sell your personal data.",
  sections: [
    {
      id: "collect",
      title: "1. Information we collect",
      body: [
          "- Account data: name, email, phone, password (stored only as a secure hash), profile picture, and your Google / Apple sign-in identifier if you use it.",
          "- Order data: delivery name, address, phone, items ordered, order notes, payment method and status, and problem reports you send.",
          "- Seller data: shop name, store address, logo and images, products, categories, store design settings, courier connections, subscription and payment history, and identity/business documents submitted for verification.",
          "- Payment data: we do not see or store your full card number, PIN or mobile-wallet password. Payments are handled by our payment gateway and mobile-wallet partners, who give us a transaction ID and status.",
          "- Technical data: IP address, device and browser type, pages viewed, and approximate location, used for security, fraud prevention and analytics.",
          "- Cookies and tracking data: described in section 5 and in our Cookie Policy.",
          "- Messages: emails and support messages you send us.",
        ],
    },
    {
      id: "use",
      title: "2. How we use your information",
      body: [
          "- To create and secure your account, verify your email and sign you in.",
          "- To process orders, payments, deliveries, returns, refunds and subscriptions, including per-minute subscription calculations.",
          "- To show stores and products, run the marketplace, and provide seller tools such as analytics and courier booking.",
          "- To send service messages (OTP codes, order updates, receipts, notices about these policies). Marketing emails only if you subscribe, and you can unsubscribe at any time.",
          "- To prevent fraud, fake orders and abuse, to moderate content, and to review reports.",
          "- To improve the Platform, fix bugs and measure performance.",
          "- To follow the law and answer lawful requests from authorities.",
        ],
    },
    {
      id: "basis",
      title: "3. Why we are allowed to use it",
      body: [
          "We use your data to perform our contract with you (orders, accounts, subscriptions), with your consent (ad tracking cookies, marketing emails), to meet legal duties, and for our legitimate interests in security, fraud prevention and improving the service. You can withdraw consent at any time.",
        ],
    },
    {
      id: "share",
      title: "4. Who we share it with",
      body: [
          "We share only what is needed, with:",
          "- Sellers: your name, phone, delivery address and order details so they can fulfil your order. Sellers must use this only for that order.",
          "- Couriers and delivery partners: to collect and deliver your parcel and show tracking.",
          "- Payment gateway and mobile-wallet partners (for example SSLCommerz, bKash, Nagad, Rocket and card networks): to take payments and refunds.",
          "- Service providers: cloud hosting and file storage (such as Cloudflare R2), email delivery, and database providers, under confidentiality terms.",
          "- Sign-in providers: Google and Apple, if you choose those options.",
          "- Advertising platforms (Meta, TikTok) only for stores whose Seller has enabled a pixel and only if you click Accept on the consent banner.",
          "- Authorities and professional advisers, when the law requires or to protect rights, safety or against fraud.",
          "- A buyer of our business, if we merge or are acquired, with the same level of protection.",
          "We do not sell your personal data.",
        ],
    },
    {
      id: "cookies",
      title: "5. Cookies and tracking",
      body: [
          "- Essential cookies keep you signed in, protect forms (security tokens) and remember your cart. These cannot be switched off.",
          "- Advertising / tracking cookies and a device ID (for example Meta Pixel or TikTok Pixel on a seller’s store) are used only if you click Accept on the banner. If you click Decline, we still count visits in a way that does not track you.",
          "- You can change your choice anytime from “Privacy choices” at the bottom of a store page, and you can clear cookies in your browser.",
          "Full details, with the list of cookies we use, are in our Cookie Policy.",
        ],
    },
    {
      id: "retention",
      title: "6. How long we keep data",
      body: [
          "We keep data only as long as needed for the purposes above. Account data is kept while your account is active. Order, payment and invoice records are kept for the period required by Bangladesh tax and accounting law (generally at least 6 years). Security and fraud logs are kept for a limited period. When data is no longer needed it is deleted or made anonymous.",
        ],
    },
    {
      id: "security",
      title: "7. Security",
      body: [
          "We use HTTPS encryption, hashed passwords, encrypted storage of sensitive credentials (such as courier keys), access controls, rate limiting, CSRF protection and activity logs. No system is 100% secure; if a breach affects you we will notify you and the authorities as required by law.",
        ],
    },
    {
      id: "rights",
      title: "8. Your rights and choices",
      body: [
          "You may ask us to: see the data we hold about you; correct it; delete your account and data (except what we must keep by law or for unresolved disputes and fraud prevention); restrict or object to certain uses; and withdraw consent (marketing, tracking). Email [support@yourdomain.com]. We may need to verify your identity first and will reply within a reasonable time.",
        ],
    },
    {
      id: "children",
      title: "9. Children",
      body: ["ShopBD is not for children under 18 without a parent or guardian. We do not knowingly collect data from children. If you believe a child gave us data, contact us and we will delete it."],
    },
    {
      id: "transfer",
      title: "10. Data stored outside Bangladesh",
      body: ["Some providers (for example cloud storage or email services) may process data on servers outside Bangladesh. We choose providers with appropriate safeguards and use data only as described here."],
    },
    {
      id: "links",
      title: "11. Seller stores and third-party links",
      body: ["Each Seller is responsible for how they use buyer data they receive for orders and for any pixels or tools they turn on in their store. Links to other websites are not covered by this policy."],
    },
    {
      id: "changes",
      title: "12. Changes and contact",
      body: [
          "We may update this policy and will show the new date at the top; for important changes we will notify you.",
          "Privacy questions: [Your Legal Company Name], [Full registered address, Bangladesh] · [support@yourdomain.com] · [+880 1XXX-XXXXXX]",
        ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* RETURN & REFUND POLICY  (Part A: product orders, Part B: subscriptions) */
/* ------------------------------------------------------------------ */
export const refund: LegalDoc = {
  slug: "refund-policy",
  title: "Return & Refund Policy",
  intro: "This policy has two parts: Part A for products you buy from Sellers, and Part B for Seller subscriptions, where you pay only for the minutes you actually use.",
  sections: [
    {
      id: "a-window",
      title: "PART A · A1. Report a problem with an order",
      body: [
          "Open My Account → Orders → the order → “Report a problem” within 7 days of delivery (or within 7 days after the expected delivery date if it never arrived). You can choose: not received, wrong item, damaged, missing item, refund request, or other. Add a clear description and, if possible, photos or a short video of the parcel opening.",
        ],
    },
    {
      id: "a-eligible",
      title: "A2. When you can return or get a refund",
      body: [
          "- The item never arrived or the order was cancelled after you paid.",
          "- You received the wrong item, a damaged or defective item, or items are missing.",
          "- The product is clearly different from its description.",
          "- The item must be unused, in original packaging, with tags and accessories, for change-of-mind returns where the Seller allows them.",
        ],
    },
    {
      id: "a-not",
      title: "A3. What cannot be returned",
      body: [
          "- Perishable goods such as food, flowers or items with a short shelf life, unless damaged or wrong.",
          "- Underwear, cosmetics, personal-care and hygiene items once opened or used.",
          "- Custom-made or personalised products, unless defective or wrong.",
          "- Digital goods, gift cards and vouchers once delivered or redeemed.",
          "- Items damaged by misuse, or returned after the report window without the Seller’s agreement.",
          "Sellers may offer a longer or wider return policy on their store page. If a Seller’s policy is better than this one, theirs applies.",
        ],
    },
    {
      id: "a-process",
      title: "A4. How it is handled",
      body: [
          "1) You report the problem. 2) The Seller and ShopBD review it (usually within 3 working days) and may ask for more proof. 3) If approved, the Seller or courier collects the item (if a return is needed) or we resolve it with a replacement or refund. 4) Your report is marked resolved, rejected or withdrawn, and you are told by notification.",
          "If the Seller does not respond or you disagree with the result, ShopBD may review the case and make a fair final decision for the order.",
        ],
    },
    {
      id: "a-money",
      title: "A5. How and when you get your money",
      body: [
          "- Refunds go back to the method you paid with (bKash, Nagad, Rocket, card), or by mobile wallet / bank transfer for Cash on Delivery orders.",
          "- Time: usually 7–10 working days after approval. Banks, card networks and wallets may need extra time.",
          "- The product price is refunded in full when the Seller is at fault. Delivery charge is refunded when the item never arrived or the Seller is at fault. COD handling fees and return shipping may not be refundable if the return is for change of mind.",
        ],
    },
    {
      id: "b-how",
      title: "PART B · B1. Subscriptions: you pay only for the minutes you use",
      body: [
          "When you buy a paid plan (Pro or Business) you pay in advance for the period you choose (1, 6 or 12 months) so the plan can start immediately. But your real charge is based on the exact time the paid plan was active on your account, counted in minutes. Any minutes you did not use are refunded to you.",
          "Example: if you use the plan for 1 minute, you are charged for 1 minute only, and the rest of what you paid is returned.",
          "Plan periods and discounts:",
          "- 1 month: list price.",
          "- 6 months: 10% off the list price.",
          "- 12 months: 20% off the list price.",
          "- First purchase: an extra 5% off your first paid purchase, on any period. It is added to the period discount (for example, a first 12-month purchase is 25% off).",
          "The exact price, discount and total are shown before you pay and on your receipt. Prices are rounded to the nearest taka.",
        ],
    },
    {
      id: "b-formula",
      title: "B2. How the per-minute charge is calculated",
      body: [
          "- Usage starts at the minute the payment is confirmed and the plan is activated, and stops at the minute you cancel or switch plan, or the plan ends.",
          "- Per-minute rate = the amount you actually paid (after discounts) ÷ the total minutes in the period you bought.",
          "- Charge = minutes used × per-minute rate. A started minute counts as one full minute. The result is rounded to 2 decimal places (poisha) once on the total, not on every minute.",
          "- Refund = amount paid − charge for minutes used (never less than zero, and the charge never exceeds what you paid).",
          "- Discounts are already inside the amount you paid, so you are charged for the minutes you used at that discounted rate. Discounts are not taken back when you cancel early.",
          "Example (1-month Pro ৳299, a 30-day period = 43,200 minutes): used 3 days = 4,320 minutes → charge ৳29.90 → refund ৳269.10.",
          "Example (12-month Business ৳4,790 after 20% off, a 365-day period = 525,600 minutes): used 30 days = 43,200 minutes → charge ৳393.70 → refund ৳4,396.30.",
          "Any VAT or tax charged follows the same proportion.",
        ],
    },
    {
      id: "b-cancel",
      title: "B3. Cancelling, downgrading and upgrading",
      body: [
          "- Cancel anytime from Seller Dashboard → Subscription. No cancellation fee, no minimum period, no questions asked. Your paid features stop at that minute and your store moves to the Free plan (up to 20 products; premium themes, analytics, custom domain, tracking pixels and auto-courier are locked). Your data is not deleted.",
          "- Upgrade: the time used on the old plan is charged by the minute and the unused balance is credited against the new plan.",
          "- Downgrade to a cheaper paid plan or Free: same rule — you pay for minutes used, and the unused balance is refunded.",
          "- If your plan expires without renewal, you simply move to Free; nothing more is charged.",
        ],
    },
    {
      id: "b-money",
      title: "B4. How and when subscription refunds are paid",
      body: [
          "- The refund is calculated automatically at the minute you cancel and shown in your payment history.",
          "- It is returned to the original payment method (bKash, Nagad, card) within 7–10 working days after cancellation. Payment partners may take extra time.",
          "- Bank / gateway fees charged to us by the payment provider on your original payment [are / are not] deducted from the refund. (Edit this line to match your decision.)",
          "- Plans given free by an admin (offer, trial, promotion) have no cash value and no refund. If you paid and an admin later extended or changed your plan, only the amount you actually paid is refundable.",
        ],
    },
    {
      id: "b-failed",
      title: "B5. Failed, double or wrong charges",
      body: [
          "If a payment fails or is cancelled, the plan is not activated and you are not charged. If money was deducted but the plan did not start, or you were charged twice, email [support@yourdomain.com] with your transaction ID. We will verify with the payment provider and return the full amount for the duplicate or failed payment.",
          "Fraud, unauthorised use of your account to pay, or a service fault that stops the paid features from working are refunded for the affected time.",
        ],
    },
    {
      id: "contact",
      title: "How to contact us about a refund",
      body: [
          "Email [support@yourdomain.com] or call [+880 1XXX-XXXXXX] with your order number or transaction ID. If you are not satisfied with our answer you may also contact the consumer protection authorities of Bangladesh. This policy forms part of the Terms & Conditions; the English version controls if the languages differ.",
        ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* COOKIE POLICY                                                       */
/* ------------------------------------------------------------------ */
export const cookiePolicy: LegalDoc = {
  slug: "cookie-policy",
  title: "Cookie Policy",
  intro: "This policy explains what cookies and similar technologies ShopBD uses, why, and how you can control them. It should be read with our Privacy Policy.",
  sections: [
    {
      id: "what",
      title: "1. What are cookies?",
      body: [
          "Cookies are small text files saved on your phone or computer by a website. We also use similar tools such as local storage and session storage in your browser. In this policy, “cookies” means all of these. They help a site remember you, keep you signed in and work properly.",
        ],
    },
    {
      id: "essential",
      title: "2. Essential cookies (always on)",
      body: [
          "These are needed for the Platform to work and for security. They cannot be switched off in our tools, and they do not need your consent.",
          "- session_token — keeps you signed in. Secure, HttpOnly (scripts cannot read it) and short-lived.",
          "- refresh_token — safely renews your sign-in without asking for your password again. HttpOnly and used only on our sign-in routes.",
          "- oauth_state_google / oauth_state_apple — protects “Sign in with Google / Apple” from forgery. Lasts about 10 minutes and is deleted after use.",
          "- admin_gate — used only by ShopBD administrators after extra verification.",
          "- Cart, last checkout and onboarding data (stored in your browser) — remember your cart, your latest order result and your store set-up progress so you do not lose them.",
        ],
    },
    {
      id: "functional",
      title: "3. Preference cookies",
      body: [
          "These remember choices that make the Platform easier to use. They are stored only in your browser.",
          "- Wishlist, “following” a store and recently viewed products for each store.",
          "- Your preferred courier (for sellers) and your cookie / privacy choice for each store.",
          "- Display settings such as light or dark mode.",
        ],
    },
    {
      id: "analytics",
      title: "4. Analytics cookies",
      body: [
          "We and sellers count visits, product views and where visitors came from, so sellers can see how their store performs and we can fix problems.",
          "- sbd_src (session storage) — remembers how you reached the site (for example a link, search or social post) for this visit only. It is cleared when you close the tab.",
          "- sbd_vid — a random visitor ID that helps count unique visitors. It is used only if you click Accept on the consent banner. If you click Decline, visits are still counted but not linked to you or your device.",
          "- sbd_purchased — stops the same order being counted twice during a visit.",
        ],
    },
    {
      id: "advertising",
      title: "5. Advertising and tracking cookies (only with your consent)",
      body: [
          "A seller may switch on an advertising pixel in their own store, such as Meta (Facebook / Instagram) Pixel or TikTok Pixel. These tools can set their own cookies and tell the advertising company about the pages you view and things you add to the cart or buy, so the seller can measure and show relevant ads.",
          "- They load only on a store where the seller has enabled them, and only after you click Accept.",
          "- If you click Decline (or do nothing), they do not load.",
          "- The advertising company becomes responsible for its own cookies and data. Read their policies at facebook.com and tiktok.com.",
        ],
    },
    {
      id: "third",
      title: "6. Third-party services",
      body: [
          "When you pay or sign in, you may be sent to our partners (for example the payment gateway, bKash, Nagad, Google or Apple). They may set their own cookies on their pages under their own policies. We do not control those cookies.",
        ],
    },
    {
      id: "choices",
      title: "7. Your choices",
      body: [
          "- Popup: when you first visit ShopBD, a notice at the bottom of the page lets you Accept or Reject optional cookies (analytics, advertising). Rejecting keeps only the essential cookies. We ask again after 12 months.",
          "- Seller stores: each store shows its own Accept / Decline notice for the ad tools that seller uses.",
          "- Change your mind: click “Cookie settings” in the footer of ShopBD, or “Privacy choices” at the bottom of a store page, at any time. Withdrawing consent is as easy as giving it.",
          "- Browser privacy signal: if your browser sends Global Privacy Control or Do Not Track, we treat optional cookies as rejected, even if you press Accept.",
          "- Browser settings: you can block or delete cookies and clear site data in your browser. If you block essential cookies, sign-in, cart and checkout may not work.",
          "- Mobile apps and ad settings: you can also limit ad personalisation in your Google, Meta and TikTok account settings.",
        ],
    },
    {
      id: "duration",
      title: "8. How long they last",
      body: [
          "Session cookies and session storage are deleted when you sign out or close the browser or tab. Sign-in cookies expire on their own after a limited time. Browser-stored items such as your cart, wishlist and consent choice stay until you clear them or we replace them. We do not keep tracking cookies longer than needed for the purposes above.",
        ],
    },
    {
      id: "changes",
      title: "9. Changes and contact",
      body: [
          "We may update this Cookie Policy when we add or remove tools; the date at the top will change. If you have questions, contact [Your Legal Company Name], [Full registered address, Bangladesh] · [support@yourdomain.com].",
        ],
    },
  ],
};

export const LEGAL_DOCS = { terms, privacy, "refund-policy": refund, "cookie-policy": cookiePolicy } as const;