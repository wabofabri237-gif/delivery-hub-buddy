import { z } from "zod";

export const contactSchema = z.object({
  full_name: z.string().trim().min(2, "Nom requis").max(120),
  email: z.string().trim().email("Adresse e-mail invalide").max(254),
  subject: z.string().trim().min(3, "Objet requis").max(160),
  message: z.string().trim().min(10, "Votre message doit contenir au moins 10 caractères").max(4000),
});