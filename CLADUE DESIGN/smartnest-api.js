// SmartNest data layer — THE ONLY FILE TO SWAP when wiring the real Spring Boot API.
// Every function below is async and returns the same shape the real endpoint returns.
// Replace each body with the fetch() shown in its comment; no UI file changes needed.

const LATENCY = 650;
const wait = (ms = LATENCY) => new Promise(r => setTimeout(r, ms));
const clone = v => JSON.parse(JSON.stringify(v));

// ---------------------------------------------------------------- mock state

let NOTIFICATIONS = [
  { id: 13, userId: 11, message: "A new promotion went live in an area you follow.", entityTitle: "Lakeside Studio — First Home Deal", relatedEntityType: "PROMOTION", relatedEntityId: 3, sentDate: iso(-22 * 60 * 1000), isRead: false, event: "APPROVED" },
  { id: 12, userId: 11, message: "A promotion you viewed is ending soon — 4 days left.", entityTitle: "Harbour View 2BR — Monsoon Offer", relatedEntityType: "PROMOTION", relatedEntityId: 1, sentDate: iso(-3 * 60 * 60 * 1000), isRead: false, event: "SUBMITTED" },
  { id: 11, userId: 11, message: "A new promotion went live in an area you follow.", entityTitle: "Battaramulla Court — Corner Unit", relatedEntityType: "PROMOTION", relatedEntityId: 6, sentDate: iso(-29 * 60 * 60 * 1000), isRead: true, event: "APPROVED" },
  { id: 10, userId: 11, message: "A promotion you saved was withdrawn by the seller.", entityTitle: "Wellawatte Sea Breeze 1BR", relatedEntityType: "PROMOTION", relatedEntityId: 9, sentDate: iso(-5 * 24 * 60 * 60 * 1000), isRead: true, event: "REJECTED" },
  { id: 9, userId: 4, message: "Your promotion was approved and is now publicly visible.", entityTitle: "Mount Lavinia Beachfront 2BR", relatedEntityType: "PROMOTION", relatedEntityId: 7, sentDate: iso(-8 * 60 * 1000), isRead: false, event: "APPROVED" },
  { id: 8, userId: 4, message: "Your promotion was rejected and returned for changes.", entityTitle: "Wellawatte Sea Breeze 1BR", relatedEntityType: "PROMOTION", relatedEntityId: 9, sentDate: iso(-95 * 60 * 1000), isRead: false, event: "REJECTED", reason: "Discount exceeds the 30% cap for studio units. Reduce to 25% and resubmit with the revised price sheet." },
  { id: 7, userId: 2, message: "A new promotion was submitted for your review.", entityTitle: "Kotte Village Duplex", relatedEntityType: "PROMOTION", relatedEntityId: 8, sentDate: iso(-5 * 60 * 60 * 1000), isRead: false, event: "SUBMITTED" },
  { id: 6, userId: 4, message: "Your promotion was approved and is now publicly visible.", entityTitle: "Lakeside Studio — First Home Deal", relatedEntityType: "PROMOTION", relatedEntityId: 3, sentDate: iso(-26 * 60 * 60 * 1000), isRead: true, event: "APPROVED" },
  { id: 5, userId: 2, message: "A new promotion was submitted for your review.", entityTitle: "Battaramulla Court — Corner Unit", relatedEntityType: "PROMOTION", relatedEntityId: 6, sentDate: iso(-2 * 24 * 60 * 60 * 1000), isRead: true, event: "SUBMITTED" },
  { id: 4, userId: 4, message: "Your promotion was approved and is now publicly visible.", entityTitle: "Harbour View 2BR — Monsoon Offer", relatedEntityType: "PROMOTION", relatedEntityId: 1, sentDate: iso(-4 * 24 * 60 * 60 * 1000), isRead: true, event: "APPROVED" },
];

const PROMOTIONS = [
  { id: 1, title: "Harbour View 2BR — Monsoon Offer", location: "Colombo 03, Marine Drive", beds: "2 bed · 2 bath", size: "1,180 sqft", discount: 15, price: 42500000, ends: "Ends in 9 days", status: "APPROVED", featured: true, owner: "N. Fernando (Sales)" },
  { id: 2, title: "Cinnamon Residencies Penthouse", location: "Colombo 07, Gregory's Road", beds: "4 bed · 3 bath", size: "2,640 sqft", discount: 8, price: 96000000, ends: "Ends in 21 days", status: "APPROVED", featured: true, owner: "D. Perera (Ops)" },
  { id: 3, title: "Lakeside Studio — First Home Deal", location: "Rajagiriya, Diyawanna", beds: "1 bed · 1 bath", size: "520 sqft", discount: 20, price: 14800000, ends: "Ends in 4 days", status: "APPROVED", featured: false, owner: "N. Fernando (Sales)" },
  { id: 4, title: "Nawala Garden Apartments 3BR", location: "Nawala, Koswatte Road", beds: "3 bed · 2 bath", size: "1,540 sqft", discount: 12, price: 33900000, ends: "Ends in 14 days", status: "APPROVED", featured: false, owner: "S. Jayasuriya (Sales)" },
  { id: 5, title: "Dehiwala Skyline — Early Bird", location: "Dehiwala, Galle Road", beds: "2 bed · 1 bath", size: "940 sqft", discount: 10, price: 21200000, ends: "Ends in 30 days", status: "APPROVED", featured: false, owner: "D. Perera (Ops)" },
  { id: 6, title: "Battaramulla Court — Corner Unit", location: "Battaramulla, Pelawatte", beds: "3 bed · 3 bath", size: "1,720 sqft", discount: 18, price: 38400000, ends: "Ends in 6 days", status: "APPROVED", featured: false, owner: "S. Jayasuriya (Sales)" },
  { id: 7, title: "Mount Lavinia Beachfront 2BR", location: "Mount Lavinia, Hotel Road", beds: "2 bed · 2 bath", size: "1,210 sqft", discount: 25, price: 29750000, ends: "Awaiting review", status: "PENDING", featured: false, owner: "N. Fernando (Sales)" },
  { id: 8, title: "Kotte Village Duplex", location: "Kotte, Pitakotte", beds: "3 bed · 2 bath", size: "1,600 sqft", discount: 30, price: 27500000, ends: "Awaiting review", status: "PENDING", featured: false, owner: "S. Jayasuriya (Sales)" },
  { id: 9, title: "Wellawatte Sea Breeze 1BR", location: "Colombo 06, Wellawatte", beds: "1 bed · 1 bath", size: "610 sqft", discount: 35, price: 16900000, ends: "Returned with notes", status: "REJECTED", featured: false, owner: "N. Fernando (Sales)" },
];

const USERS = {
  CUSTOMER: { id: 11, name: "Amaya Silva", role: "CUSTOMER" },
  SALES_STAFF: { id: 4, name: "Nuwan Fernando", role: "SALES_STAFF", staffLabel: "N. Fernando (Sales)" },
  CRO: { id: 6, name: "Tharindu Rathnayake", role: "CRO" },
  OPERATIONS_MANAGER: { id: 2, name: "Dilani Perera", role: "OPERATIONS_MANAGER", staffLabel: "D. Perera (Ops)" },
  ADMIN: { id: 1, name: "Admin User", role: "ADMIN" },
  MARKETING_EXECUTIVE: { id: 8, name: "Ishara Gunasekara", role: "MARKETING_EXECUTIVE" },
};

function iso(offsetMs) { return new Date(Date.now() + offsetMs).toISOString(); }
function mine(userId) {
  return NOTIFICATIONS.filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate));
}

// ------------------------------------------------------------------ session

// Stub: in the real app this comes from the decoded JWT / GET /api/auth/me.
export function currentUser(role) {
  return role && role !== "VISITOR" ? USERS[role] || USERS.CUSTOMER : null;
}

// ------------------------------------------------------------- notifications

// GET /api/notifications  → Notification[] (own, newest first)
export async function getNotifications(userId) {
  await wait();
  return clone(mine(userId));
}

// GET /api/notifications/unread-count → { count }
export async function getUnreadCount(userId) {
  await wait(220);
  return { count: mine(userId).filter(n => !n.isRead).length };
}

// PUT /api/notifications/{id}/read
export async function markRead(id) {
  await wait(260);
  const n = NOTIFICATIONS.find(x => x.id === id);
  if (!n) throw new Error("Notification not found");
  n.isRead = true;
  return clone(n);
}

// PUT /api/notifications/read-all
export async function markAllRead(userId) {
  await wait(320);
  mine(userId).forEach(n => { n.isRead = true; });
  return { updated: true };
}

// ---------------------------------------------------------------- promotions

// GET /api/promotions → Promotion[]
export async function getPromotions() {
  await wait();
  return clone(PROMOTIONS);
}

// Derived counters for the staff Home page (real app: GET /api/promotions + count,
// or a dedicated summary endpoint if one is added later).
export async function getPromotionStats(user) {
  await wait(480);
  const label = user.staffLabel;
  const own = PROMOTIONS.filter(p => p.owner === label);
  if (user.role === "SALES_STAFF") {
    return [
      { label: "My promotions", value: own.length },
      { label: "Pending mine", value: own.filter(p => p.status === "PENDING").length },
      { label: "Approved mine", value: own.filter(p => p.status === "APPROVED").length },
      { label: "Rejected mine", value: own.filter(p => p.status === "REJECTED").length },
    ];
  }
  const stats = [
    { label: "Pending review", value: PROMOTIONS.filter(p => p.status === "PENDING").length },
    { label: "Approved this month", value: 5 },
    { label: "Active promotions", value: PROMOTIONS.filter(p => p.status === "APPROVED").length },
  ];
  if (user.role === "ADMIN") stats.push({ label: "Users", value: 24 });
  return stats;
}

// Relative timestamp for notification rows.
export function relativeTime(isoDate) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return m + "m ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : d + "d ago";
}

// relatedEntityType → icon key + route. Adding APARTMENT / INQUIRY / APPOINTMENT /
// RESERVATION later is one entry each; the UI needs no change.
export const ENTITY_MAP = {
  PROMOTION: { route: id => "Promotions.dc.html#promotion-" + id, noun: "Promotion" },
};
