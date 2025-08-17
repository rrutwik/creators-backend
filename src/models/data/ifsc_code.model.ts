import { Schema, Document } from 'mongoose';
import { getSecondDatabase } from '@/database';
import { IFSCCode } from '@/interfaces/ifsc_code.interface';

// reuse existing schema if it already exists; otherwise define here:
const IfscSchema = new Schema<IFSCCode & Document>({
    _id: { type: String, required: true },
    ifsc: { type: String, required: true },
    bank_code: { type: String, required: true },
    bank: { type: String, required: true },
    branch: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    address: { type: String, required: true },
    contact: { type: String, required: true },
    micr: { type: String, required: true },
    swift: { type: String, required: true },
    iso3166: { type: String, required: true },
    imps: { type: Boolean, required: true },
    neft: { type: Boolean, required: true },
    rtgs: { type: Boolean, required: true },
    upi: { type: Boolean, required: true },
    type: { type: String, required: true }
}, { timestamps: true, collection: 'ifsc_codes' });

// Indexes
// Unique lookup by IFSC
IfscSchema.index({ ifsc: 1 }, { unique: true });
// Common filter/sort pattern used in search
IfscSchema.index({ bank: 1, city: 1, branch: 1 });
// Equality filters
IfscSchema.index({ bank_code: 1 });
IfscSchema.index({ city: 1 });
IfscSchema.index({ district: 1 });
IfscSchema.index({ state: 1 });
// Text search for q
IfscSchema.index({ bank: 'text', branch: 'text', city: 'text', district: 'text', state: 'text' });

export const IFSCCodeModel = getSecondDatabase('ifsc_codes', IfscSchema);
// Avoid syncIndexes() at import-time to prevent startup delays/crashes
