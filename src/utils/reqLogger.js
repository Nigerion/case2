import { logger } from './logger.js';
import pinoHttp from 'pino-http';

export const reqLogger = pinoHttp({
    logger,
    propsReqId(req){
        return {
            requestID: req.requestID
        }
    }
}) 
