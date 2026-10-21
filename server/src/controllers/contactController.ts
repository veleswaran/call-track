import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Contact } from '../models/Contact.js';
import { normalizePhoneNumber, hashString } from '../utils/hashing.js';
import { paginatedResponse, errorResponse } from '../utils/response.js';

const contactSchema = z.object({
  name: z.string().min(1),
  phone_number: z.string().min(1),
  company: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_internal: z.boolean().default(false),
});

export async function listContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const perPage = parseInt(req.query.per_page as string, 10) || 20;
    const search = (req.query.search as string || '').trim();

    const query: Record<string, any> = {};
    if (search) {
      const normalized = normalizePhoneNumber(search);
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { phoneHash: hashString(normalized) },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Contact.countDocuments(query);
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    paginatedResponse(res, contacts, total, page, perPage, '/api/v1/admin/contacts');
  } catch (error) {
    next(error);
  }
}

export async function createContact(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = contactSchema.parse(req.body);
    const normalizedPhone = normalizePhoneNumber(data.phone_number);
    const phoneHash = hashString(normalizedPhone);

    const existing = await Contact.findOne({ phoneHash });
    if (existing) {
      errorResponse(res, 'Contact with this phone number already exists.', 422, {
        phone_number: ['A contact with this phone number already exists.'],
      });
      return;
    }

    const contact = await Contact.create({
      name: data.name,
      phoneNumber: data.phone_number,
      phoneHash,
      company: data.company || null,
      notes: data.notes || null,
      isInternal: data.is_internal,
    });

    res.status(201).json({ data: contact });
  } catch (error) {
    next(error);
  }
}

export async function updateContact(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const contactId = req.params.id;
    const data = contactSchema.partial().parse(req.body);

    const contact = await Contact.findById(contactId);
    if (!contact) {
      errorResponse(res, 'Contact not found', 404);
      return;
    }

    if (data.name !== undefined) contact.name = data.name;
    if (data.company !== undefined) contact.company = data.company;
    if (data.notes !== undefined) contact.notes = data.notes;
    if (data.is_internal !== undefined) contact.isInternal = data.is_internal;
    if (data.phone_number !== undefined) {
      contact.phoneNumber = data.phone_number;
      contact.phoneHash = hashString(normalizePhoneNumber(data.phone_number));
    }

    await contact.save();
    res.status(200).json({ data: contact });
  } catch (error) {
    next(error);
  }
}

export async function deleteContact(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const contactId = req.params.id;
    const contact = await Contact.findById(contactId);
    if (!contact) {
      errorResponse(res, 'Contact not found', 404);
      return;
    }

    await contact.deleteOne();
    res.status(200).json({ message: 'Contact deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function importContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { contacts } = z.object({
      contacts: z.array(contactSchema),
    }).parse(req.body);

    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      try {
        const normalized = normalizePhoneNumber(c.phone_number);
        const phoneHash = hashString(normalized);

        const existing = await Contact.findOne({ phoneHash });
        if (existing) {
          existing.name = c.name;
          if (c.company) existing.company = c.company;
          if (c.notes) existing.notes = c.notes;
          existing.isInternal = c.is_internal;
          await existing.save();
          updated++;
        } else {
          await Contact.create({
            name: c.name,
            phoneNumber: c.phone_number,
            phoneHash,
            company: c.company || null,
            notes: c.notes || null,
            isInternal: c.is_internal,
          });
          created++;
        }
      } catch (err: any) {
        failed++;
        errors.push({ row: i + 1, message: err.message || 'Failed to save contact' });
      }
    }

    res.status(200).json({
      data: {
        total_rows: contacts.length,
        created,
        updated,
        failed,
        errors,
      },
    });
  } catch (error) {
    next(error);
  }
}
