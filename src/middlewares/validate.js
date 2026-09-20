import { ValidationError } from "../errors/ValidationError.js";

export function validate(source, schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || source,
        message: issue.message,
        code: issue.code,
      }));

      return next(
        new ValidationError("Некорректные данные запроса", details),
      );
    }

    if (source === "query") {
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }

    next();
  };
}