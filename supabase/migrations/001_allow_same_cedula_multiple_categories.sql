-- Permite registrar la misma cédula en distintas categorías (p. ej. Extras y Smart Living)
-- y/o más de una fila con la misma cédula, quitando restricciones UNIQUE que lo impidan.
--
-- Cómo aplicar: Supabase Dashboard → SQL Editor → pegar y ejecutar.
-- Si algún comando falla con "does not exist", ignóralo y prueba el siguiente.
--
-- Constraint compuesto típico (misma cédula + mismo proyecto/casa): bloquea duplicar
-- Extras vs Smart Living si comparten proyecto y número de casa.
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS cliente_propiedad_unica;

-- UNIQUE solo sobre cédula:
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_cedula_pasaporte_key;
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_cedula_pasaporte_unique;

-- A veces el UNIQUE existe solo como índice:
DROP INDEX IF EXISTS clientes_cedula_pasaporte_key;
DROP INDEX IF EXISTS idx_clientes_cedula_pasaporte;

-- Si aún falla el alta, en SQL Editor ejecuta para ver el nombre exacto:
-- SELECT conname FROM pg_constraint
--   WHERE conrelid = 'public.clientes'::regclass AND contype = 'u';
