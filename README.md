# THE BACKYARD — Vercel + Supabase

Free-tier friendly direct ordering system for THE BACKYARD.

## Stack
- GoDaddy: domain/DNS
- Vercel: website + serverless API
- Supabase: PostgreSQL order database
- Optional Meta WhatsApp Cloud API: admin order notifications

## Deploy
1. Create a Supabase project and open SQL Editor.
2. Run `supabase.sql`.
3. Create a private GitHub repository and upload this folder.
4. Import the repository into Vercel.
5. Add environment variables from `.env.example` in Vercel Project Settings → Environment Variables.
6. Deploy.
7. In Vercel, add your GoDaddy domain under Settings → Domains. Vercel will show the exact DNS records to add in GoDaddy.

## Environment variables
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (server-side only; never expose in browser code)
- ADMIN_KEY
- ADMIN_WHATSAPP=917397964842
- Optional: WHATSAPP_TOKEN
- Optional: WHATSAPP_PHONE_NUMBER_ID

## URLs
- Customer: `/`
- Tracking: `/track.html?id=TBxxxxxxxx`
- Admin: `/admin.html`

The admin page sends `x-admin-key` to the API. Use a long random ADMIN_KEY.

## Important
UPI QR is customer-selected payment, not automatic payment verification. Add Razorpay/Cashfree later if automatic payment confirmation is needed.
