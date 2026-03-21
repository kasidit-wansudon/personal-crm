import {
  type Contact,
  type InsertContact,
  type Interaction,
  type InsertInteraction,
  contacts,
  interactions,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc, sql } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Storage interface for all CRUD operations
export interface IStorage {
  // Contacts
  getAllContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(data: InsertContact): Promise<Contact>;
  updateContact(id: number, data: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<void>;

  // Interactions
  getInteractionsByContact(contactId: number): Promise<Interaction[]>;
  createInteraction(data: InsertInteraction): Promise<Interaction>;

  // Stats
  getStats(): Promise<{
    total: number;
    overdue: number;
    upcoming: number;
    byTag: Record<string, number>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Get all contacts ordered by name
  async getAllContacts(): Promise<Contact[]> {
    return db.select().from(contacts).orderBy(contacts.name).all();
  }

  // Get a single contact by ID
  async getContact(id: number): Promise<Contact | undefined> {
    return db.select().from(contacts).where(eq(contacts.id, id)).get();
  }

  // Create a new contact with timestamp
  async createContact(data: InsertContact): Promise<Contact> {
    const tags = JSON.stringify(data.tags || []);
    return db
      .insert(contacts)
      .values({
        ...data,
        tags,
        createdAt: new Date().toISOString(),
      })
      .returning()
      .get();
  }

  // Update an existing contact
  async updateContact(
    id: number,
    data: Partial<InsertContact>
  ): Promise<Contact | undefined> {
    const updateData: Record<string, unknown> = { ...data };
    if (data.tags) {
      updateData.tags = JSON.stringify(data.tags);
    }
    return db
      .update(contacts)
      .set(updateData)
      .where(eq(contacts.id, id))
      .returning()
      .get();
  }

  // Delete a contact and its interactions (cascade)
  async deleteContact(id: number): Promise<void> {
    // Delete interactions first, then contact
    db.delete(interactions).where(eq(interactions.contactId, id)).run();
    db.delete(contacts).where(eq(contacts.id, id)).run();
  }

  // Get all interactions for a contact, ordered by date descending
  async getInteractionsByContact(contactId: number): Promise<Interaction[]> {
    return db
      .select()
      .from(interactions)
      .where(eq(interactions.contactId, contactId))
      .orderBy(desc(interactions.date))
      .all();
  }

  // Create a new interaction and update lastContactDate on the contact
  async createInteraction(data: InsertInteraction): Promise<Interaction> {
    const interaction = db
      .insert(interactions)
      .values({
        ...data,
        createdAt: new Date().toISOString(),
      })
      .returning()
      .get();

    // Auto-update lastContactDate if this interaction is the most recent
    const contact = await this.getContact(data.contactId);
    if (contact) {
      const currentLast = contact.lastContactDate
        ? new Date(contact.lastContactDate)
        : new Date(0);
      const interactionDate = new Date(data.date);
      if (interactionDate >= currentLast) {
        db.update(contacts)
          .set({ lastContactDate: data.date })
          .where(eq(contacts.id, data.contactId))
          .run();
      }
    }

    return interaction;
  }

  // Compute dashboard statistics
  async getStats(): Promise<{
    total: number;
    overdue: number;
    upcoming: number;
    byTag: Record<string, number>;
  }> {
    const allContacts = await this.getAllContacts();
    // Use string-based date comparison to avoid timezone issues
    const todayStr = new Date().toISOString().split("T")[0];
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    let overdue = 0;
    let upcoming = 0;
    const tagCounts: Record<string, number> = {};

    for (const c of allContacts) {
      // Count overdue and upcoming using string comparison
      if (c.nextFollowUp) {
        if (c.nextFollowUp < todayStr) {
          overdue++;
        } else if (c.nextFollowUp <= weekEndStr) {
          upcoming++;
        }
      }

      // Count tags
      try {
        const tags: string[] = JSON.parse(c.tags);
        for (const tag of tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      } catch {
        // ignore invalid JSON
      }
    }

    return {
      total: allContacts.length,
      overdue,
      upcoming,
      byTag: tagCounts,
    };
  }
}

export const storage = new DatabaseStorage();
