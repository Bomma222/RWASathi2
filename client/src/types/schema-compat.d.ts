import '@shared/schema';

declare module '@shared/schema' {
  interface Bill {
    /** @deprecated use totalAmount */
    amount?: string | number;
  }

  interface Complaint {
    /** @deprecated use subject */
    title?: string;
    /** optional field for UI notes */
    internalNotes?: string;
    assignedTo?: number | string;
    category?: string;
  }
}