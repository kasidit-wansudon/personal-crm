import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Contacts table - stores all CRM contacts
export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  company: text("company"),
  role: text("role"),
  phone: text("phone"),
  email: text("email"),
  tags: text("tags").notNull().default("[]"), // JSON array of tag strings
  notes: text("notes"),
  lastContactDate: text("last_contact_date"), // ISO date string
  nextFollowUp: text("next_follow_up"), // ISO date string
  createdAt: text("created_at").notNull(),
});

// Interactions table - logs of contact interactions
export const interactions = sqliteTable("interactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactId: integer("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "call" | "message" | "meeting" | "email"
  date: text("date").notNull(), // ISO date string
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

// Insert schemas
export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
}).extend({
  tags: z.array(z.string()).default([]),
  name: z.string().min(1, "ต้องระบุชื่อ"),
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["call", "message", "meeting", "email"]),
  date: z.string().min(1),
});

// Types
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;

// Tag options
export const TAG_OPTIONS = ["VIP", "เพื่อน", "ครอบครัว", "ธุรกิจ", "เพื่อนร่วมงาน"] as const;

// Interaction type labels (Thai)
export const INTERACTION_TYPES = {
  call: "โทรศัพท์",
  message: "ข้อความ",
  meeting: "พบปะ",
  email: "อีเมล",
} as const;
