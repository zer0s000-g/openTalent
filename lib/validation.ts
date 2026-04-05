import { z } from 'zod'

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date format YYYY-MM-DD')

export const CsvEmployeeRowSchema = z.object({
  employee_id: z.string().trim().min(1, 'employee_id is required'),
  name: z.string().trim().min(1, 'name is required'),
  email: optionalString.refine(
    (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'Invalid email format',
  ),
  title: optionalString,
  department: optionalString,
  location: optionalString,
  hired_date: optionalString.refine((value) => !value || isoDate.safeParse(value).success, {
    message: 'hired_date must be YYYY-MM-DD',
  }),
  manager_id: optionalString,
  skills: optionalString,
  certifications: optionalString,
  education_institution: optionalString,
  education_degree: optionalString,
  education_field: optionalString,
  aspiration_type: optionalString,
  aspiration_target_role: optionalString,
  aspiration_target_department: optionalString,
  aspiration_timeline: optionalString,
})

export type CsvEmployeeRow = z.infer<typeof CsvEmployeeRowSchema>
