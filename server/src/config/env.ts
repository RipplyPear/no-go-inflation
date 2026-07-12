/**
 * Verifica existenta variabilelor de mediu necesare
 * */
function checkEnvValue(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }

  return value;
}

export const env = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? 3000),
  db: {
    host: checkEnvValue('DB_HOST'),
    port: Number(checkEnvValue('DB_PORT')),
    name: checkEnvValue('DB_NAME'),
    user: checkEnvValue('DB_USER'),
    password: checkEnvValue('DB_PASSWORD'),
  },
  jwtSecret: checkEnvValue('JWT_SECRET'),
};
