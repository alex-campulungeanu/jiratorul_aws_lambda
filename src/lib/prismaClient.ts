/* eslint-disable @typescript-eslint/ban-ts-comment */
import { PrismaClient } from '@prisma/client';

const createPrismaClient = (): PrismaClient => {
    try {
        let prisma: PrismaClient;
        const client = new PrismaClient()
        if (process.env.NODE_ENV === 'production') {
            prisma = client;
            console.log('Production: Created DB connection.');
        } else {
            // @ts-ignore
            if (!global.db) {
                // @ts-ignore
                global.db = client;
                console.log('Development: Created DB connection.');
            }
        
            // @ts-ignore
            prisma = global.db;
        }
        return prisma
        
    } catch (error) {
        console.log('Error when connecting to DB')
        throw new Error('Unable to connect to db !')
    }
}

export default createPrismaClient;