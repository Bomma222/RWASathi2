declare module "compression" {
  import { Request, Response, NextFunction } from "express";
  interface CompressionOptions {
    level?: number;
    threshold?: number | string;
  }
  function compression(options?: CompressionOptions): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void;
  export = compression;
}