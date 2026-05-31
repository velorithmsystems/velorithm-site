# Deploy Velorithm Systems to Cloudflare Pages

Everything in this folder is deploy-ready. Upload the **whole folder** — including the
`functions/` directory, which powers the contact form.

```
velorithm-site/
├── index.html
├── logo.svg
├── og-image.png
└── functions/
    └── api/
        └── contact.js
```

(You can ignore `DEPLOY.md` itself — it won't affect the site.)

---

## 1. Create the Pages project

1. Sign in at https://dash.cloudflare.com
2. Sidebar: **Build → Compute** (this opens Workers & Pages)
3. Click **Create** → choose the **Pages** tab → **Upload assets**
4. Project name: `velorithm-systems` → **Create project**

## 2. Upload the files

1. Drag this entire `velorithm-site` folder onto the upload area (or zip it and upload the zip)
2. Confirm `index.html` is at the root and the `functions` folder is included
3. Click **Deploy site**
4. Open the preview URL (e.g. `velorithm-systems.pages.dev`) to check it looks right

## 3. Connect your domain

1. In the project: **Custom domains** tab → **Set up a custom domain**
2. Enter `velorithmsystems.com` → **Continue** → **Activate domain**
   (DNS is added automatically since the domain is already on Cloudflare)
3. Optional: repeat for `www.velorithmsystems.com`

## 4. Turn on HTTPS (usually automatic)

1. Domain → **SSL/TLS** → mode set to **Full**
2. **Edge Certificates** → **Always Use HTTPS** turned on

The site will be live at https://velorithmsystems.com within a couple of minutes.

---

## 5. Enable the contact form (Resend)

The form posts to `/api/contact`, which emails you via Resend. Until the variables below
are set, the form shows a polite "not configured yet" message instead of sending.

### a) Set up Resend (one-time)

1. Create a free account at https://resend.com
2. **Domains** → add `velorithmsystems.com` and add the DNS records Resend gives you
   (these live in your Cloudflare DNS — Resend verifies within a few minutes)
3. **API Keys** → create a key (it starts with `re_`) and copy it

### b) Add variables in Cloudflare

In your Pages project: **Settings → Variables and Secrets** → add these for **Production**:

| Name             | Value (example)                                      |
|------------------|------------------------------------------------------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxxxxxxxx`                             |
| `CONTACT_TO`     | `hello@velorithmsystems.com`                         |
| `CONTACT_FROM`   | `Velorithm Website <noreply@velorithmsystems.com>`   |

> `CONTACT_FROM` must use a domain you've verified in Resend.
> Mark `RESEND_API_KEY` as a **Secret** (encrypted) rather than plain text.

### c) Redeploy

Trigger a new deployment (or it picks the variables up on the next deploy). Then submit a
test message through the form to confirm it lands in your inbox.

---

## Future updates

1. **Build → Compute → `velorithm-systems`** project
2. **Create new deployment**
3. Upload the changed files — the new version goes live instantly, no downtime

---

## Quick reference — what each file does

- **index.html** — the entire single-page site (HTML, CSS, JS inline)
- **logo.svg** — the Velorithm wordmark + V monogram (scalable, for reuse)
- **og-image.png** — 1200×630 preview image shown when the link is shared on social
- **functions/api/contact.js** — Cloudflare Pages Function that emails form submissions via Resend
