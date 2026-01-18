import type { Contact } from '@/types';
import { logger } from './LoggingService';

interface ExportData {
  version: string;
  exported_at: string;
  contacts: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>[];
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

class ImportExportService {
  private readonly VERSION = '1.0';

  /**
   * Export contacts to JSON format
   */
  exportToJSON(contacts: Contact[]): string {
    const exportData: ExportData = {
      version: this.VERSION,
      exported_at: new Date().toISOString(),
      contacts: contacts.map(({ name, email, phone, timezone, location, notes, working_hours_start, working_hours_end }) => ({
        name,
        email,
        phone,
        timezone,
        location,
        notes,
        working_hours_start,
        working_hours_end,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export contacts to CSV format
   */
  exportToCSV(contacts: Contact[]): string {
    const headers = ['name', 'email', 'phone', 'timezone', 'location', 'notes', 'working_hours_start', 'working_hours_end'];
    const rows = contacts.map((contact) =>
      headers.map((header) => {
        const value = contact[header as keyof Contact];
        if (value === undefined || value === null) return '';
        // Escape quotes and wrap in quotes if contains comma
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Download data as a file
   */
  downloadFile(data: string, filename: string, mimeType: string): void {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export contacts and trigger download
   */
  exportContacts(contacts: Contact[], format: 'json' | 'csv'): void {
    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      const data = this.exportToJSON(contacts);
      this.downloadFile(data, `worldtime-contacts-${timestamp}.json`, 'application/json');
    } else {
      const data = this.exportToCSV(contacts);
      this.downloadFile(data, `worldtime-contacts-${timestamp}.csv`, 'text/csv');
    }

    logger.info(`Exported ${contacts.length} contacts as ${format}`);
  }

  /**
   * Parse JSON import data
   */
  private parseJSON(content: string): Partial<Contact>[] {
    const data = JSON.parse(content);

    // Handle our export format
    if (data.version && data.contacts) {
      return data.contacts;
    }

    // Handle array of contacts
    if (Array.isArray(data)) {
      return data;
    }

    throw new Error('Invalid JSON format');
  }

  /**
   * Parse CSV import data
   */
  private parseCSV(content: string): Partial<Contact>[] {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have headers and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const contacts: Partial<Contact>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const contact: Partial<Contact> = {};

      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        if (value) {
          if (header === 'working_hours_start' || header === 'working_hours_end') {
            contact[header as keyof Contact] = parseInt(value, 10) as never;
          } else {
            contact[header as keyof Contact] = value as never;
          }
        }
      });

      if (contact.name && contact.email && contact.timezone) {
        contacts.push(contact);
      }
    }

    return contacts;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current);
    return values;
  }

  /**
   * Validate a contact object
   */
  private validateContact(contact: Partial<Contact>): string[] {
    const errors: string[] = [];

    if (!contact.name || contact.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!contact.email || !this.isValidEmail(contact.email)) {
      errors.push('Valid email is required');
    }

    if (!contact.timezone || !this.isValidTimezone(contact.timezone)) {
      errors.push('Valid timezone is required');
    }

    if (contact.working_hours_start !== undefined) {
      if (contact.working_hours_start < 0 || contact.working_hours_start > 23) {
        errors.push('Working hours start must be between 0 and 23');
      }
    }

    if (contact.working_hours_end !== undefined) {
      if (contact.working_hours_end < 0 || contact.working_hours_end > 23) {
        errors.push('Working hours end must be between 0 and 23');
      }
    }

    return errors;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Import contacts from file content
   */
  async importContacts(
    content: string,
    format: 'json' | 'csv',
    addContact: (contact: Partial<Contact>) => Promise<{ success: boolean }>
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: [],
    };

    try {
      const contacts = format === 'json' ? this.parseJSON(content) : this.parseCSV(content);

      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const validationErrors = this.validateContact(contact);

        if (validationErrors.length > 0) {
          result.errors.push(`Row ${i + 1}: ${validationErrors.join(', ')}`);
          continue;
        }

        try {
          const { success } = await addContact(contact);
          if (success) {
            result.imported++;
          } else {
            result.errors.push(`Row ${i + 1}: Failed to add contact`);
          }
        } catch (error) {
          result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      logger.info(`Imported ${result.imported} contacts with ${result.errors.length} errors`);
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Failed to parse file');
      logger.error('Import failed', { error });
    }

    return result;
  }

  /**
   * Read file content
   */
  readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export const importExportService = new ImportExportService();
export { ImportExportService };
export type { ExportData, ImportResult };
