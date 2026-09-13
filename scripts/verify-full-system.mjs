#!/usr/bin/env node

/**
 * Full-System & End-to-End Holistic Verification Suite
 * 
 * Tests all 24 public Storefront and Admin routes, API health,
 * and key user journey interactions.
 */

const API_BASE = 'http://localhost:4000';
const STOREFRONT_BASE = 'http://localhost:3000';
const ADMIN_BASE = 'http://localhost:3001';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  gold: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

let passed = 0;
let total = 0;

async function checkUrl(name, url, expectedContent) {
  total++;
  process.stdout.write(`  [..] ${name}: ${url}`);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'System-Audit/1.0' } });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    if (expectedContent) {
      const text = await res.text();
      if (!text.includes(expectedContent)) {
        throw new Error(`Missing expected content fragment: "${expectedContent}"`);
      }
    }
    passed++;
    process.stdout.write(`\r${COLORS.green}  [✔] ${name}${COLORS.reset} — ${COLORS.cyan}HTTP 200 OK${COLORS.reset}\n`);
  } catch (err) {
    process.stdout.write(`\r${COLORS.red}  [✖] ${name}${COLORS.reset} — Error: ${err.message}\n`);
  }
}

async function runFullSystemAudit() {
  console.log(`\n${COLORS.gold}${COLORS.bright}═══════════════════════════════════════════════════════════════════════════════`);
  console.log(`  ★  NATIONAL FURNITURE & INTERIORS — FULL APPLICATION SYSTEM AUDIT`);
  console.log(`═══════════════════════════════════════════════════════════════════════════════${COLORS.reset}\n`);

  console.log(`${COLORS.gold}▶ SECTION 1: Backend API Engine Health & Endpoints (Port 4000)${COLORS.reset}`);
  await checkUrl('API Health Check', `${API_BASE}/health`, 'ok');
  await checkUrl('API Catalog Products', `${API_BASE}/api/v1/products?limit=5`);
  await checkUrl('API Categories', `${API_BASE}/api/v1/categories`);
  await checkUrl('API Collections', `${API_BASE}/api/v1/collections`);
  await checkUrl('API CMS Blogs', `${API_BASE}/api/v1/cms/blogs`);
  await checkUrl('API CMS Banners', `${API_BASE}/api/v1/cms/banners`);

  console.log(`\n${COLORS.gold}▶ SECTION 2: Storefront Pages & Customer Journeys (Port 3000)${COLORS.reset}`);
  await checkUrl('Storefront Homepage', `${STOREFRONT_BASE}/`);
  await checkUrl('Storefront Catalog', `${STOREFRONT_BASE}/catalog`);
  await checkUrl('Storefront Categories Hub', `${STOREFRONT_BASE}/categories`);
  await checkUrl('Storefront Curated Collections', `${STOREFRONT_BASE}/collections`);
  await checkUrl('Storefront Design Services & Portfolio', `${STOREFRONT_BASE}/design-services`);
  await checkUrl('Storefront Architectural Journal (/blogs)', `${STOREFRONT_BASE}/blogs`, 'The Architectural Journal');
  await checkUrl('Storefront Article Reader (/blogs/[slug])', `${STOREFRONT_BASE}/blogs/harmonizing-reclaimed-burma-teak-in-sadashivanagar-penthouse`);
  await checkUrl('Storefront Our Heritage & Story', `${STOREFRONT_BASE}/our-story`);
  await checkUrl('Storefront Contact & Experience Studio', `${STOREFRONT_BASE}/contact`);
  await checkUrl('Storefront Shopping Cart', `${STOREFRONT_BASE}/cart`);
  await checkUrl('Storefront Patron Wishlist', `${STOREFRONT_BASE}/wishlist`);

  console.log(`\n${COLORS.gold}▶ SECTION 3: Admin Operations Portal Hubs (Port 3001)${COLORS.reset}`);
  await checkUrl('Admin Dashboard Hub', `${ADMIN_BASE}/dashboard`);
  await checkUrl('Admin Business Analytics Hub', `${ADMIN_BASE}/analytics`);
  await checkUrl('Admin CRM & Sales Kanban', `${ADMIN_BASE}/crm`);
  await checkUrl('Admin Turnkey Design Projects', `${ADMIN_BASE}/design-projects`);
  await checkUrl('Admin Catalog & Inventory', `${ADMIN_BASE}/catalog`);
  await checkUrl('Admin Orders Fulfillment', `${ADMIN_BASE}/orders`);
  await checkUrl('Admin Payments & Reconciliations', `${ADMIN_BASE}/payments`);
  await checkUrl('Admin Patron Reviews Moderation', `${ADMIN_BASE}/reviews`);
  await checkUrl('Admin Omnichannel Notifications', `${ADMIN_BASE}/notifications`);
  await checkUrl('Admin CMS Blogs & Editorial Journal', `${ADMIN_BASE}/cms/blogs`);
  await checkUrl('Admin CMS Banners', `${ADMIN_BASE}/cms/banners`);
  await checkUrl('Admin Users & Team Directory', `${ADMIN_BASE}/users`);
  await checkUrl('Admin Roles & RBAC Matrix', `${ADMIN_BASE}/roles`);
  await checkUrl('Admin Enterprise Audit Logs', `${ADMIN_BASE}/audit-logs`);

  console.log(`\n${COLORS.gold}═══════════════════════════════════════════════════════════════════════════════${COLORS.reset}`);
  if (passed === total) {
    console.log(`${COLORS.green}${COLORS.bright}  ★ ALL ${total}/${total} SYSTEM AUDIT CHECKS PASSED WITH 100% OPERATIONAL EXCELLENCE! ★${COLORS.reset}`);
  } else {
    console.log(`${COLORS.red}${COLORS.bright}  ⚠ ${passed}/${total} CHECKS PASSED — ${total - passed} FAILED${COLORS.reset}`);
  }
  console.log(`${COLORS.gold}═══════════════════════════════════════════════════════════════════════════════${COLORS.reset}\n`);

  process.exit(passed === total ? 0 : 1);
}

runFullSystemAudit().catch((err) => {
  console.error('\nFatal system audit error:', err);
  process.exit(1);
});
