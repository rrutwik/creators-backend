import { NextFunction, Request, Response } from 'express';
import Container from 'typedi';
import { IFSCService } from '@/services/ifsc.service';

export class IFSCController {
  public ifscService = Container.get(IFSCService);

  public getByIFSC = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ifsc } = req.params;
      const data = await this.ifscService.getByIFSC(ifsc);
      if (!data) return res.status(404).json({ message: 'IFSC not found' });
      return res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  };

  public search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, bank, bank_code, branch, city, district, state } = req.query as Record<string, string>;
      const limit = Number(req.query.limit) || 20;
      const offset = Number(req.query.offset) || 0;

      const result = await this.ifscService.search({
        q,
        bank,
        bank_code,
        branch,
        city,
        district,
        state,
        limit,
        offset,
      });
      return res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  public banks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { city } = req.query as Record<string, string>;
      const data = await this.ifscService.distinctBanks(city);
      return res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  };

  public cities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bank } = req.query as Record<string, string>;
      const data = await this.ifscService.distinctCities(bank);
      return res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  };

  public branches = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bank, city } = req.query as Record<string, string>;
      const data = await this.ifscService.distinctBranches(bank, city);
      return res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  };
}
