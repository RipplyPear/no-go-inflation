function requiredEnv(name: string) {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required env: ${name}`);
    }

    return value;
}

export const env = {
    host: process.env.HOST ?? "0.0.0.0",
    port: Number(process.env.PORT ?? 3000),
    db: {
        host: requiredEnv('DB_HOST'),
        port: Number(requiredEnv('DB_PORT')),
        name: requiredEnv('DB_NAME'),
        user: requiredEnv('DB_USER'),
        password: requiredEnv('DB_PASSWORD'),
    },
    jwtSecret: requiredEnv('JWT_SECRET'),
}
