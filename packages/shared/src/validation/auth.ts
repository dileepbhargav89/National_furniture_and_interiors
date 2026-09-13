import { z } from 'zod';

export const authValidation = {
  loginSchema: z.object({
    email: z.string().email('Please enter a valid email address').max(320),
    password: z.string().min(1, 'Password is required').max(128),
  }),
  phoneSchema: z.string()
    .regex(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{7,15}$/, 'Please enter a valid phone number (e.g. 9109059791 or +919109059791)')
    .max(20),
  registerSchema: z.object({
    email: z.string().email('Please enter a valid email address').max(320),
    password: z.string()
      .min(10, 'Password must be at least 10 characters')
      .max(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s]).{10,}$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    confirmPassword: z.string(),
    fullName: z.string().min(1, 'Full name is required').max(200),
    phone: z.string()
      .regex(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{7,15}$/, 'Please enter a valid phone number (e.g. 9109059791 or +919109059791)')
      .max(20).optional().or(z.literal('')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
};

export type LoginFormData = z.infer<typeof authValidation.loginSchema>;
export type RegisterFormData = z.infer<typeof authValidation.registerSchema>;
