# Personal CRM — ระบบจัดการ Contacts ส่วนตัว

ระบบ CRM สำหรับติดตาม contacts ในเครือข่ายของคุณ บันทึกวันที่ติดต่อล่าสุด และเตือนให้ follow up

## Features

- **แดชบอร์ด** — KPI cards: รายชื่อทั้งหมด, เกินกำหนด, ติดตามสัปดาห์นี้, สรุปแท็ก
- **รายชื่อติดต่อ** — ค้นหา, กรองตาม tag (VIP/เพื่อน/ครอบครัว/ธุรกิจ/เพื่อนร่วมงาน)
- **Interaction Log** — บันทึกประวัติ (โทร/ข้อความ/พบปะ/อีเมล) + auto-update วันติดต่อล่าสุด
- **Follow-up Reminders** — เตือน overdue contacts, แสดง upcoming follow-ups
- **Dark Mode** — toggle สลับ light/dark

## Tech Stack

- **Frontend**: React + Tailwind CSS + shadcn/ui
- **Backend**: Express.js
- **Database**: SQLite (Drizzle ORM)
- **Language**: TypeScript

## Getting Started

```bash
npm install
npm run dev
```

Server runs at `http://localhost:5000`

## Project Structure

```
client/src/
├── pages/          # Dashboard, Contacts, ContactDetail
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── lib/            # Query client, utilities
server/
├── routes.ts       # API endpoints
├── storage.ts      # Database operations
shared/
├── schema.ts       # Data model (Drizzle + Zod)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/contacts` | รายชื่อทั้งหมด |
| POST | `/api/contacts` | เพิ่มรายชื่อ |
| GET | `/api/contacts/:id` | รายละเอียด |
| PATCH | `/api/contacts/:id` | แก้ไข |
| DELETE | `/api/contacts/:id` | ลบ |
| GET | `/api/contacts/:id/interactions` | ประวัติ |
| POST | `/api/contacts/:id/interactions` | บันทึกประวัติ |
| GET | `/api/stats` | สถิติ dashboard |

## License

MIT
