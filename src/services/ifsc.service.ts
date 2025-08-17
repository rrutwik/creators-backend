import { Service } from 'typedi';
import { FilterQuery } from 'mongoose';
import { IFSCCode } from '@/interfaces/ifsc_code.interface';
import { IFSCCodeModel } from '@/models/data/ifsc_code.model';

export interface IFSCSearchParams {
  q?: string;
  ifsc?: string;
  bank?: string;
  bank_code?: string;
  branch?: string;
  city?: string;
  district?: string;
  state?: string;
  limit?: number;
  offset?: number;
}

@Service()
export class IFSCService {
  public async getByIFSC(ifsc: string) {
    if (!ifsc) return null;
    return IFSCCodeModel.findOne({ ifsc: ifsc.toUpperCase() });
  }

  public async search(params: IFSCSearchParams) {
    const {
      q,
      bank,
      bank_code,
      branch,
      city,
      district,
      state,
      limit = 20,
      offset = 0,
    } = params;

    const pipeline: any[] = [];

    // 1) Text search for q (uses text index)
    if (q && q.trim()) {
      const cleaned = this.sanitizeTextQuery(q.trim());
      if (cleaned) {
        pipeline.push({ $match: { $text: { $search: cleaned } } });
      } else {
        // If everything was noise, fallback to original trimmed
        pipeline.push({ $match: { $text: { $search: q.trim() } } });
      }
    }

    // 2) Equality filters to leverage indexes
    const match: FilterQuery<IFSCCode> = {};
    if (bank) match.bank = bank;
    if (bank_code) match.bank_code = bank_code;
    if (branch) match.branch = branch;
    if (city) match.city = city;
    if (district) match.district = district;
    if (state) match.state = state;
    if (Object.keys(match).length) {
      pipeline.push({ $match: match });
    }

    // 3) Projection
    pipeline.push({
      $project: {
        _id: 0,
        ifsc: 1,
        bank: 1,
        bank_code: 1,
        branch: 1,
        city: 1,
        district: 1,
        state: 1,
        address: 1,
        contact: 1,
        micr: 1,
        swift: 1,
        iso3166: 1,
        imps: 1,
        neft: 1,
        rtgs: 1,
        upi: 1,
        type: 1,
        ...(q ? { score: { $meta: 'textScore' } } : {}),
      },
    });

    // 4) Sort (if text search, sort by relevance)
    if (q) {
      pipeline.push({ $sort: { score: { $meta: 'textScore' } } });
    } else {
      pipeline.push({ $sort: { bank: 1, city: 1, branch: 1 } });
    }

    // 5) Facet for pagination and total
    pipeline.push({
      $facet: {
        records: [{ $skip: offset }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    });

    const agg = await IFSCCodeModel.aggregate(pipeline).allowDiskUse(true);
    const first = agg?.[0] || { records: [], total: [] };
    const total = first.total?.[0]?.count || 0;

    return { records: first.records, total, limit, offset };
  }

  // Remove generic noise terms so queries like "SBI Bank" behave like "SBI"
  private sanitizeTextQuery(input: string) {
    const noise = new Set([
      'bank', 'banks', 'ltd', 'limited', 'cooperative', 'co-operative', 'the',
      'of', 'and'
    ]);
    const parts = input
      .split(/\s+/)
      .map(s => s.trim())
      .filter(Boolean)
      .filter(tok => !noise.has(tok.toLowerCase()));
    return parts.join(' ');
  }

  public async distinctBanks(city?: string) {
    const filter: FilterQuery<IFSCCode> = {};
    if (city) filter.city = new RegExp(this.escapeRegex(city), 'i');
    return IFSCCodeModel.distinct('bank', filter);
  }

  public async distinctCities(bank?: string) {
    const filter: FilterQuery<IFSCCode> = {};
    if (bank) filter.bank = new RegExp(this.escapeRegex(bank), 'i');
    return IFSCCodeModel.distinct('city', filter);
  }

  public async distinctBranches(bank?: string, city?: string) {
    const filter: FilterQuery<IFSCCode> = {};
    if (bank) filter.bank = new RegExp(this.escapeRegex(bank), 'i');
    if (city) filter.city = new RegExp(this.escapeRegex(city), 'i');
    return IFSCCodeModel.distinct('branch', filter);
  }

  private escapeRegex(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
