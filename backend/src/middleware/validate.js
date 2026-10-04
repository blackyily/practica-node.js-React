// Middleware genérico para validación de esquemas Zod
// Aplica lista blanca estricta eliminando propiedades no declaradas en el esquema
export function validate(schema) {
  return async (req, res, next) => {
    try {
      const parsedBody = await schema.parseAsync(req.body);
      // Asignamos el cuerpo validado y limpio (strippeado de campos no permitidos)
      req.body = parsedBody;
      next();
    } catch (error) {
      next(error);
    }
  };
}
