export type Question = {
  id: string;
  texto: string;
  opciones: string[];
  correcta: number; // índice
  imagen?: string | null;
  explicacion?: string;
};

export type StudySection = { titulo: string; html: string };

export type ExamMode = 'full' | 'theory' | 'signs' | 'psycho';

export type ExamResult = {
  total: number;
  aciertos: number;
  detalle: { id: string; correcta: number; elegida: number }[];
};
