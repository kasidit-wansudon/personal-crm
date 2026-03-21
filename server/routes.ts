import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertInteractionSchema } from "@shared/schema";

// Register all API routes
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // GET /api/contacts — list all contacts
  app.get("/api/contacts", async (_req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      res.json(contacts);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  // GET /api/contacts/:id — get single contact
  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const contact = await storage.getContact(id);
      if (!contact) return res.status(404).json({ error: "Contact not found" });

      res.json(contact);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch contact" });
    }
  });

  // POST /api/contacts — create a new contact
  app.post("/api/contacts", async (req, res) => {
    try {
      const parsed = insertContactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const contact = await storage.createContact(parsed.data);
      res.status(201).json(contact);
    } catch (err) {
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  // PATCH /api/contacts/:id — update a contact
  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const existing = await storage.getContact(id);
      if (!existing) return res.status(404).json({ error: "Contact not found" });

      const updated = await storage.updateContact(id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  // DELETE /api/contacts/:id — delete a contact
  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const existing = await storage.getContact(id);
      if (!existing) return res.status(404).json({ error: "Contact not found" });

      await storage.deleteContact(id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // GET /api/contacts/:id/interactions — list interactions for a contact
  app.get("/api/contacts/:id/interactions", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) return res.status(400).json({ error: "Invalid ID" });

      const interactions = await storage.getInteractionsByContact(contactId);
      res.json(interactions);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch interactions" });
    }
  });

  // POST /api/contacts/:id/interactions — create an interaction
  app.post("/api/contacts/:id/interactions", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) return res.status(400).json({ error: "Invalid ID" });

      const parsed = insertInteractionSchema.safeParse({
        ...req.body,
        contactId,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const interaction = await storage.createInteraction(parsed.data);
      res.status(201).json(interaction);
    } catch (err) {
      res.status(500).json({ error: "Failed to create interaction" });
    }
  });

  // GET /api/stats — dashboard statistics
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
