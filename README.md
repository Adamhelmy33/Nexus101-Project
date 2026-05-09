# Nexus 101 — Complete Website

## ⚡ Run in 3 Steps (Copy-Paste These Commands)

### Step 1 — Install Node.js first
Download from: https://nodejs.org  (choose the "LTS" version, click Install)

### Step 2 — Open this folder in your Terminal
In VS Code: File → Open Folder → select this "nexus101-project" folder
Then: View → Terminal

### Step 3 — Run these 2 commands:
```
npm install
npm run dev
```

Then open your browser and go to: http://localhost:5173
Your website is live! 🎉

---

## 📄 Pages Included
| Page | What it does |
|---|---|
| Home | Hero + Stats + Courses + Founders |
| Courses | All 3 courses with prices + Enroll button |
| Booking | Session registration form |
| Checkout | Payment flow with Card + Mobile Wallet |
| Success | Post-payment confirmation |
| Course Viewer | Secure video player + sidebar + resources |
| Dashboard | Admin panel with student table + revenue |

## ✏️ How to Edit Content

### Change Founder Names / Bios
Open src/App.jsx and find: `const FOUNDERS = [`
Edit the name, title, bio, and initials fields.

### Add Founder Photos
Replace the initials <div> in FounderCard with:
```jsx
<img src="/assets/founders/yourname.jpg"
     style={{width:96,height:96,borderRadius:'50%',objectFit:'cover',margin:'0 auto 18px'}} />
```
Place photos in the public/assets/founders/ folder.

### Change Course Prices
Find: `const COURSES = [` and edit the `price:` field.

### Add Video to a Lesson
Find: `const LESSONS = [` and fill in the `iframeSrc:` field with your Vimeo/YouTube embed URL.
Example: `iframeSrc: "https://player.vimeo.com/video/YOUR_VIDEO_ID"`

### Change Contact Info / WhatsApp Number
Search for "wa.me" and replace the number.
Search for "contact@nexus101.com" and replace.

### Change Course Content (Modules)
Find: `const COURSES = [` and edit the `modules:` arrays.

---

## 🚀 Deploy to the Internet (Free)
1. Go to vercel.com — sign up free
2. Click "Add New Project"
3. Drag and drop this entire folder
4. Click Deploy
5. Your site is live in ~60 seconds!

---

## 💳 Adding Real Payments (Paymob)
1. Create account at paymob.com
2. Get your API Key + Integration IDs
3. Create the /api/create-payment.js file (Claude gave you this code)
4. Add your keys in Vercel → Settings → Environment Variables
