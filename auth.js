// auth.js (en la raíz del proyecto)
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

// Función para obtener usuario de la base de datos
async function getUser(email) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;

    console.log('Resultado de la consulta a Neon:', result);

    // Neon devuelve directamente un ARRAY de filas
    if (!Array.isArray(result) || result.length === 0) {
      console.log(`No se encontró usuario con email: ${email}`);
      return null;
    }

    const user = result[0]; // tomamos la primera fila
    console.log(`Usuario encontrado:`, {
      id: user.id,
      email: user.email,
      password_starts: user.password?.substring(0, 20) + '...' || 'NO PASSWORD',
    });

    return user;
  } catch (error) {
    console.error('Error al obtener usuario:', error.message);
    return null;
  }
}

// Configuración principal de NextAuth
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      async authorize(credentials) {
        console.log('authorize llamado con credenciales:', credentials);

        // Validación con Zod
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        console.log('¿Validación Zod exitosa?', parsedCredentials.success);

        if (!parsedCredentials.success) {
          console.log('Error de validación Zod:', parsedCredentials.error);
          return null;
        }

        const { email, password } = parsedCredentials.data;
        console.log('Credenciales válidas. Buscando usuario:', email);

        // Buscar usuario en la base de datos
        const user = await getUser(email);
        console.log('Usuario encontrado:', user ? 'SÍ' : 'NO', user);

        if (!user) {
          console.log('No se encontró usuario');
          return null;
        }

        // Comparar contraseña
        console.log('Hash en BD (primeros 20 caracteres):', user.password?.substring(0, 20) + '...');
        const passwordsMatch = await bcrypt.compare(password, user.password);
        console.log('¿Contraseñas coinciden?', passwordsMatch);

        if (passwordsMatch) {
          console.log('¡Login exitoso! Devolviendo:', {
            id: user.id,
            email: user.email,
            name: user.name || null,
          });
          return {
            id: user.id,
            email: user.email,
            name: user.name || null,
          };
        }

        console.log('Contraseña incorrecta');
        return null;
      },
    }),
  ],

  // Puedes añadir aquí más opciones si las necesitas (pages, callbacks, etc.)
  // ...authConfig ya las trae, así que normalmente no es necesario repetirlas
});
