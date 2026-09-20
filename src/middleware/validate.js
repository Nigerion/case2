import { ValidationError } from "../errors/ValidationError.js";

export function validate(source, schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(
        new ValidationError(
          "Ошибка валидации",
          result.error.issues,
        ),
      );
    }

    res.locals[`validated${source[0].toUpperCase()}${source.slice(1)}`] =
      result.data;

    next();
  };
}