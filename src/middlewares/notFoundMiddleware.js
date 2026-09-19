import { NotFoundError } from '../errors/NotFoundError.js'

export function notFoundMiddleware(req, res, next) {
    next(
        new NotFoundError(
            `Route ${req.method}: is Not Found`
        )
    )
}