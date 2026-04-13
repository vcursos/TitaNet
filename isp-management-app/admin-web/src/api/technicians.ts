import { getWithFallback, patchWithFallback, postWithFallback } from './http';

export interface Technician {
  id: string;
  name: string;
  email: string;
  region: string;
  available: boolean;
}

export interface CreateTechnicianInput {
  name: string;
  email: string;
  region: string;
}

let techniciansDb: Technician[] = [
  { id: '1', name: 'Técnico 1', email: 'tec1@provedor.com', region: 'Centro', available: true },
  { id: '2', name: 'Técnico 2', email: 'tec2@provedor.com', region: 'Zona Sul', available: false },
];

export const fetchTechnicians = async (): Promise<Technician[]> => {
  return getWithFallback('/technicians', () => [...techniciansDb], 220);
};

export const createTechnician = async (input: CreateTechnicianInput): Promise<Technician> => {
  return postWithFallback('/technicians', input, () => {
    const newItem: Technician = {
      id: String(Date.now()),
      name: input.name.trim(),
      email: input.email.trim(),
      region: input.region,
      available: true,
    };

    techniciansDb = [newItem, ...techniciansDb];
    return newItem;
  }, 200);
};

export const toggleTechnicianAvailability = async (id: string): Promise<Technician[]> => {
  return patchWithFallback(`/technicians/${id}/toggle-availability`, {}, () => {
    techniciansDb = techniciansDb.map((tech) =>
      tech.id === id ? { ...tech, available: !tech.available } : tech,
    );

    return [...techniciansDb];
  }, 160);
};
