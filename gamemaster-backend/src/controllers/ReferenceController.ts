
import type { Request, Response } from 'express';
/**
 * [DEV SENIOR] Contrôleur de référence - centralise la gestion des données de référence du jeu.
 * - Chargement dynamique des fichiers JSON, validation des schémas, gestion des endpoints REST.
 * - Respecter la séparation des responsabilités et documenter toute évolution majeure.
 */

// [IMPORTS] Import des modules nécessaires pour la gestion des fichiers et des types
import fs from 'fs/promises';
import path from 'path';
import type { ReferenceData, Skill, Trait, Advantage, Disadvantage, Clan, School } from '../types/referenceTypes.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');

// [UTILS] Fonction utilitaire pour charger dynamiquement un fichier JSON typé
export async function loadJsonFile<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data) as T;
}

class ReferenceController {
  static async getSkills(req: Request, res: Response) {
    try {
      const data = await loadJsonFile<ReferenceData>('competences.json');
      res.json(data.competences);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load skills data' });
    }
  }

  static async getDisadvantageById(req: Request, res: Response) {
    try {
      const data = await loadJsonFile<ReferenceData>('desavantages.json');
      const disadvantage = data.disadvantages?.find((d: Disadvantage) => d.id === req.params.id);
      if (!disadvantage) {
        return res.status(404).json({ error: 'Disadvantage not found' });
      }
      res.json(disadvantage);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load disadvantage data' });
    }
  }

  static async getClanById(req: Request, res: Response) {
    try {
      const data = await loadJsonFile<ReferenceData>('clans.json');
      const clan = data.clans?.find((c: Clan) => c.id === req.params.id);
      if (!clan) {
        return res.status(404).json({ error: 'Clan not found' });
      }
      res.json(clan);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load clan data' });
    }
  }

  static async getSchoolById(req: Request, res: Response) {
    try {
      const data = await loadJsonFile<ReferenceData>('ecoles.json');
      const school = data.ecoles?.find((s: School) => s.id === req.params.id);
      if (!school) {
        return res.status(404).json({ error: 'School not found' });
      }
      res.json(school);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load school data' });
    }
  }
}

// [EXPORT] Export du contrôleur principal pour intégration dans les routes
export default ReferenceController;


