import { Request, Response, NextFunction } from 'express';
import { pool } from './db';

const USER_LIMIT = 5;
const IP_LIMIT = 20;
const WINDOW_SECONDS = 60;

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.header('userId');
        if (!userId) {
            return res.status(400).json({ message: 'userId header is required' });
        }

        const ip = (req.headers['x-forwarded-for'] as string)?.split(",")[0] || req.ip;

        const connection = await pool.getConnection();

        try {
            await connection.query(
                `DELETE FROM request_logs
                WHERE created_at < NOW() - INTERVAL ? SECOND`,
                [WINDOW_SECONDS]
            );

            const [userRows]: any = await connection.query(
                `SELECT COUNT(*) as count
                FROM request_logs
                WHERE identifier = ? AND type = 'USER'`,
                [userId]
            );
            if (userRows[0].count >= USER_LIMIT) {
                return res.status(429).json({ message: "USer rate limit exceeded" });

            }
            const [ipRows]: any = await connection.query(
                `SELECT COUNT(*) as count
                FROM request_logs
                WHERE identifier= ? AND type ='IP'`,
                [ip]
            );

            if (ipRows[0].count >= IP_LIMIT) {
                return res.status(429).json({ message: "IP Rate Limit exceeded" });
            }

            await connection.query(
                `INSERT INTO request_logs
            (identifier, type) VALUES (?, 'IP')`,
                [ip]
            );
            await connection.query(
                `INSERT INTO request_logs
            (identifier, type) VALUES (?, 'USER')`,
                [userId]
            );
            next();
        } finally {
            connection.release();
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal Server Error!!' });
    }
};