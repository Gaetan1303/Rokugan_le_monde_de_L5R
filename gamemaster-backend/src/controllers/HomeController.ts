import type { Request, Response } from 'express';

export const home = (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Bienvenue dans le monde du Rokugan !',
    status: 'success',
    timestamp: new Date().toISOString()
  });
};
