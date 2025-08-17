import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { IFSCController } from '@/controllers/ifsc.controller';

export class IFSCRoute implements Routes {
  public path = '/data/ifsc/';
  public router = Router();
  public controller = new IFSCController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Search with query params: q, bank, bank_code, branch, city, district, state, limit, offset
    this.router.get(`${this.path}`, this.controller.search);

    // Helper facets
    this.router.get(`${this.path}banks`, this.controller.banks);
    this.router.get(`${this.path}cities`, this.controller.cities);
    this.router.get(`${this.path}branches`, this.controller.branches);

    // Fetch by exact IFSC code
    this.router.get(`${this.path}:ifsc`, this.controller.getByIFSC);
  }
}
