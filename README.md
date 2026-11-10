# Fidelity Funeral Services

A digital home for families in Zimbabwe and the diaspora when they lose someone. It brings funeral planning, cover, burial arrangements, remembrance and aftercare into one place, so a grieving family has one place to go instead of many phone calls.

> This is a sample prototype. All plans, prices, policies, people and memorials in it are made up.

![New Landing page of Fidelity Funeral Services](https://github.com/rose-aiia/-fidelity-funeral-services-system/blob/main/frontend/docs/screenshots/cuirrenthomepage.png)

## Who it is for

- **Families who need help now**: someone has just passed away and they need to know what to do next.
- **People planning ahead**: comparing funeral plans for themselves or their family.
- **Policyholders**: checking their cover and asking for help, such as making a claim.
- **Relatives and friends**: remembering a loved one and leaving a tribute, wherever they live.
- **Funeral professionals**: managing the services they deliver for families.

## What families can do

### Get help straight away

The first thing on the page is a way to reach a funeral care adviser. Urgent arrangements, transport, repatriation questions and cemetery guidance all start from here.

### Choose a funeral plan

Compare three plans (**Essential**, **Comfort** and **Legacy**), see what each one covers, and request a quote that fits the family's size and wishes.

### Find a burial place

Search cemeteries by town or area, compare plot guidance and send an enquiry about a grave.

### Bring someone home

Repatriation support for families abroad: an overview of the journey, transport and the documents needed to arrange a funeral across borders.

### Remember a loved one

Create an online memorial with their life story and photographs. Keep it private until it is ready, then publish and share the link. Visitors can leave flowers, light a candle and write a tribute, and the family reads every tribute before it is shown.

### Arrange everything else

A marketplace of trusted partners for what a funeral needs: headstones and plaques, wreaths, marquee and seating hire, programmes and stationery, and memorial video tributes.

### Stay supported afterwards

Aftercare does not stop at the funeral. Families get guidance on next steps, estate help and ideas for remembrance, including AI-assisted suggestions.

## Your account

Customers sign in with their mobile number and a one-time code, with no password to remember. From their account they can:

- **Link their policy** and see who is covered and for how much.
- **Ask for help**, for example "a loved one has passed away" or "make a claim", choose how they want to be contacted (phone call, WhatsApp or SMS) and follow the request from *received* to *complete*.
- **Manage memorials** they have created: story, photos, tributes and sharing.
- **Keep their profile** up to date.

## For the team behind it

A staff portal at `/provider-portal` for administrators and funeral service providers. What each person sees depends on who they are:

- **Administrators** see every family and every request. Urgent requests (a bereavement nobody has taken on) are at the top. They assign a request to a funeral service provider, follow orders, look up any customer, add or switch off providers, and read an activity log of every change.
- **Funeral providers** (a funeral director, for example) see only the requests handed to them, and accept, decline or complete each one. The family sees the progress, but never the internal note an administrator wrote.
- **Marketplace vendors** (a florist, a stonemason) see only the orders that include their products, and confirm, prepare and deliver them. An order shared with another vendor is coordinated by an administrator.

Switching a provider off stops new requests going to them and hides their products from the marketplace.

## Trying the demo

In `frontend/`, run `npm install` and then `npm run dev`, and open the address it prints.

- On the sign-in page, pick one of the **demo personas** to get in with one click: a policyholder, a new family, an administrator, a funeral provider and a marketplace vendor.
- The one-time code is always `123456`.
- To link a policy by hand, use policy number `FLA-318227` with ID `08-765432-B-15`.
- Everything you do is saved in your own browser only.

How the app is built, and how to connect it to a real backend, is in [frontend/docs/development.md](frontend/docs/development.md).

## Project layout

| Folder | What it is |
| --- | --- |
| `frontend/` | The web app (Vite + React). Run with `npm run dev` on port 5173. |
| `backend/` | The API (Express + Prisma). Copy `.env.example` to `.env`, then `npm run dev` on port 4000. |

![Old Landing page of Fidelity Funeral Services](frontend/docs/screenshots/landing-page.png)
