# Digital Business Card (PWA) — Emma Wilson Template

A modern, mobile-first **digital business card** designed to convert visitors into real inquiries. It includes one-tap contact actions, an **Add to Contacts (vCard .vcf)** button, a QR code modal, and **PWA installability** (add to home screen like an app).

---

## What this is (for freelancing)

This project is well-suited to sell as a freelancing service because it delivers what customers actually care about:

- **Fast customer reach**: WhatsApp, email, website, maps, and social links are one tap away.
- **Professional presentation**: clean UI/UX, consistent layout, strong responsive rules.
- **Business-ready extras**: QR modal + **Add to Contacts** via `.vcf`.
- **App-like convenience**: installable PWA, works offline once opened.

---

## Key Features

- **Mobile-first responsive design** (including small phones ≤ 425px)
- **WhatsApp primary action** + **Add to Contacts** button (vCard)
- **Copy to clipboard** for email (with accessibility announcements)
- **QR Code modal** with download action
- **PWA support**: manifest + service worker caching
- **Accessibility improvements**: keyboard support, focus management, `aria-live` status
- **Security hardening** for external links: `rel="noopener noreferrer"`

---

## Tech Stack

- **HTML5** (semantic structure)
- **CSS3** (design tokens + multi-breakpoint responsive system)
- **Vanilla JavaScript** (modular handlers)
- **PWA**: `manifest.webmanifest`, `sw.js`
- **vCard/VCF**: `assets/emma-wilson.vcf`
- **Vercel headers**: `vercel.json` (serves `.vcf` with appropriate content type)

---

## Project Structure

```
.
├─ index.html
├─ styles/
│  └─ main.css
├─ scripts/
│  ├─ copyToClipboard.js
│  ├─ qrCodeHandler.js
│  ├─ vCardHandler.js
│  └─ pwa.js
├─ assets/
│  ├─ owner.png
│  ├─ background.png
│  ├─ MYQR.png
│  ├─ emma-wilson.vcf
│  ├─ favicon*.svg
│  ├─ pwa-192.svg
│  └─ pwa-512.svg
├─ manifest.webmanifest
├─ sw.js
└─ vercel.json
```

---

## How to Run Locally

Because this is a static site, you can:

- **Option A**: Open `index.html` directly in your browser.
- **Option B (recommended)**: Use a simple local server (any static server works).

---

## Deploy to Vercel (Recommended)

1. Push the project to GitHub.
2. In Vercel, **Import Project** → select the repo.
3. Framework preset: **Other** (static).
4. Deploy.

Notes:
- `vercel.json` includes headers to help mobile devices treat `.vcf` as a vCard contact file.
- The PWA requires HTTPS in production (Vercel provides that automatically).

---

## How “Add to Contacts” Works (vCard)

The **Add to Contacts** button opens `assets/emma-wilson.vcf`.

- On most smartphones, opening a `.vcf` shows a native **Add to Contacts** flow (or a contact preview with an “Add” action).
- On desktop, it typically downloads the file for manual import.

---

## Customize for a Real Client (Checklist)

Update these items:

- **Identity**
  - `index.html`: name, title, bio
  - `assets/owner.png`: profile image
- **Contact links**
  - WhatsApp link: `https://wa.me/<number>`
  - Website, email link, maps address, social URLs
- **vCard data**
  - `assets/emma-wilson.vcf`: edit name, phone, email, address, URL
- **QR code image**
  - Replace `assets/MYQR.png` with the client’s QR
- **Brand colors**
  - `styles/main.css`: CSS variables in `:root`

---

## PWA Install (Add to Home Screen)

- **Android (Chrome)**: typically shows “Install app” or “Add to Home screen”.
- **iOS (Safari)**: Share → “Add to Home Screen”.

---

## 300-character GitHub Description (ready to paste)

Modern mobile-first digital business card (PWA): one-tap WhatsApp/email/website/maps/social links, QR modal with download, and “Add to Contacts” via vCard (.vcf). Fast, responsive (≤425px), accessible, and deploy-ready for Vercel.


