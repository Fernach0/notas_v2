# Seed — Usuarios de Prueba
**Fecha:** 2026-04-19  
**Insertados por:** Claude (sesión de desarrollo)  
**Base de datos:** `notas_escuela` · `localhost:5432`  
**Contraseña de todos los usuarios:** `Notas2026!`  
**Hash bcrypt (rounds=10):** `$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK`

---

## Profesores — Rol 2 (10 usuarios)

| Cédula      | Nombre completo               | Email                    |
|-------------|-------------------------------|--------------------------|
| 1700000100  | María Elena Salazar Vega      | msalazar@escuela.ec      |
| 1700000101  | Roberto Oswaldo Jiménez Cruz  | rjimenez@escuela.ec      |
| 1700000102  | Sandra Lorena Morocho Pinto   | smorochop@escuela.ec     |
| 1700000103  | Diego Andrés Paredes Luna     | dparedes@escuela.ec      |
| 1700000104  | Patricia Susana Ramos Flores  | pramos@escuela.ec        |
| 1700000105  | Luis Fernando Castro Mora     | lcastro@escuela.ec       |
| 1700000106  | Verónica Isabel Almeida Soto  | valmeida@escuela.ec      |
| 1700000107  | Marco Antonio Herrera Brito   | mherrera@escuela.ec      |
| 1700000108  | Carmen Estela Gutiérrez Navas | cgutierrez@escuela.ec    |
| 1700000109  | Esteban David Villalba Chávez | evillalba@escuela.ec     |

---

## Estudiantes — Rol 3 (20 usuarios)

| Cédula      | Nombre completo                  | Email                   |
|-------------|----------------------------------|-------------------------|
| 1700000200  | Sebastián Mateo Ortega Ruiz      | sortega@escuela.ec      |
| 1700000201  | Valeria Camila Montoya Sánchez   | vmontoya@escuela.ec     |
| 1700000202  | Andrés Felipe Zambrano Torres    | azambrano@escuela.ec    |
| 1700000203  | Gabriela Alejandra Suárez León   | gsuarez@escuela.ec      |
| 1700000204  | Nicolás Eduardo Alarcón Paz      | nalarcon@escuela.ec     |
| 1700000205  | Isabella Sofía Delgado Reyes     | idelgado@escuela.ec     |
| 1700000206  | Emilio Javier Pérez Mejía        | eperez@escuela.ec       |
| 1700000207  | Daniela Fernanda Cuesta Mora     | dcuesta@escuela.ec      |
| 1700000208  | Matías Renato Acosta Vargas      | macosta@escuela.ec      |
| 1700000209  | Lucía Beatriz Molina Aguirre     | lmolina@escuela.ec      |
| 1700000210  | Joaquín Alejandro Vera Espinoza  | jvera@escuela.ec        |
| 1700000211  | Martina Patricia Ordóñez Ríos    | mordonez@escuela.ec     |
| 1700000212  | Santiago Israel Palacios Cruz    | spalacios@escuela.ec    |
| 1700000213  | Ariana Michelle Carrillo Bernal  | acarrillo@escuela.ec    |
| 1700000214  | Tomás Agustín Noboa Castro       | tnoboa@escuela.ec       |
| 1700000215  | Camila Estefanía Tamayo Silva    | ctamayo@escuela.ec      |
| 1700000216  | Benjamín Rodrigo Andrade Lema    | bandrade@escuela.ec     |
| 1700000217  | Paula Renata Bravo Intriago      | pbravo@escuela.ec       |
| 1700000218  | Maximiliano José Quispe Chica    | mquispe@escuela.ec      |
| 1700000219  | Natalia Priscila Urgiles Morán   | nurgiles@escuela.ec     |

---

## SQL ejecutado

```sql
-- Hash bcrypt de "Notas2026!" con 10 rondas
-- $2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK

-- 10 PROFESORES
INSERT INTO usuario (id_usuario, nombre_completo, contrasena_usuario, estado_usuario, email) VALUES
  ('1700000100', 'María Elena Salazar Vega',      '<hash>', 'ACTIVO', 'msalazar@escuela.ec'),
  ('1700000101', 'Roberto Oswaldo Jiménez Cruz',  '<hash>', 'ACTIVO', 'rjimenez@escuela.ec'),
  ('1700000102', 'Sandra Lorena Morocho Pinto',   '<hash>', 'ACTIVO', 'smorochop@escuela.ec'),
  ('1700000103', 'Diego Andrés Paredes Luna',     '<hash>', 'ACTIVO', 'dparedes@escuela.ec'),
  ('1700000104', 'Patricia Susana Ramos Flores',  '<hash>', 'ACTIVO', 'pramos@escuela.ec'),
  ('1700000105', 'Luis Fernando Castro Mora',     '<hash>', 'ACTIVO', 'lcastro@escuela.ec'),
  ('1700000106', 'Verónica Isabel Almeida Soto',  '<hash>', 'ACTIVO', 'valmeida@escuela.ec'),
  ('1700000107', 'Marco Antonio Herrera Brito',   '<hash>', 'ACTIVO', 'mherrera@escuela.ec'),
  ('1700000108', 'Carmen Estela Gutiérrez Navas', '<hash>', 'ACTIVO', 'cgutierrez@escuela.ec'),
  ('1700000109', 'Esteban David Villalba Chávez', '<hash>', 'ACTIVO', 'evillalba@escuela.ec');

-- 20 ESTUDIANTES
INSERT INTO usuario (id_usuario, nombre_completo, contrasena_usuario, estado_usuario, email) VALUES
  ('1700000200', 'Sebastián Mateo Ortega Ruiz',      '<hash>', 'ACTIVO', 'sortega@escuela.ec'),
  ('1700000201', 'Valeria Camila Montoya Sánchez',   '<hash>', 'ACTIVO', 'vmontoya@escuela.ec'),
  ('1700000202', 'Andrés Felipe Zambrano Torres',    '<hash>', 'ACTIVO', 'azambrano@escuela.ec'),
  ('1700000203', 'Gabriela Alejandra Suárez León',   '<hash>', 'ACTIVO', 'gsuarez@escuela.ec'),
  ('1700000204', 'Nicolás Eduardo Alarcón Paz',      '<hash>', 'ACTIVO', 'nalarcon@escuela.ec'),
  ('1700000205', 'Isabella Sofía Delgado Reyes',     '<hash>', 'ACTIVO', 'idelgado@escuela.ec'),
  ('1700000206', 'Emilio Javier Pérez Mejía',        '<hash>', 'ACTIVO', 'eperez@escuela.ec'),
  ('1700000207', 'Daniela Fernanda Cuesta Mora',     '<hash>', 'ACTIVO', 'dcuesta@escuela.ec'),
  ('1700000208', 'Matías Renato Acosta Vargas',      '<hash>', 'ACTIVO', 'macosta@escuela.ec'),
  ('1700000209', 'Lucía Beatriz Molina Aguirre',     '<hash>', 'ACTIVO', 'lmolina@escuela.ec'),
  ('1700000210', 'Joaquín Alejandro Vera Espinoza',  '<hash>', 'ACTIVO', 'jvera@escuela.ec'),
  ('1700000211', 'Martina Patricia Ordóñez Ríos',    '<hash>', 'ACTIVO', 'mordonez@escuela.ec'),
  ('1700000212', 'Santiago Israel Palacios Cruz',    '<hash>', 'ACTIVO', 'spalacios@escuela.ec'),
  ('1700000213', 'Ariana Michelle Carrillo Bernal',  '<hash>', 'ACTIVO', 'acarrillo@escuela.ec'),
  ('1700000214', 'Tomás Agustín Noboa Castro',       '<hash>', 'ACTIVO', 'tnoboa@escuela.ec'),
  ('1700000215', 'Camila Estefanía Tamayo Silva',    '<hash>', 'ACTIVO', 'ctamayo@escuela.ec'),
  ('1700000216', 'Benjamín Rodrigo Andrade Lema',    '<hash>', 'ACTIVO', 'bandrade@escuela.ec'),
  ('1700000217', 'Paula Renata Bravo Intriago',      '<hash>', 'ACTIVO', 'pbravo@escuela.ec'),
  ('1700000218', 'Maximiliano José Quispe Chica',    '<hash>', 'ACTIVO', 'mquispe@escuela.ec'),
  ('1700000219', 'Natalia Priscila Urgiles Morán',   '<hash>', 'ACTIVO', 'nurgiles@escuela.ec');

-- ROLES
INSERT INTO usuario_rol (id_usuario, id_rol) VALUES
  ('1700000100',2),('1700000101',2),('1700000102',2),('1700000103',2),('1700000104',2),
  ('1700000105',2),('1700000106',2),('1700000107',2),('1700000108',2),('1700000109',2);

INSERT INTO usuario_rol (id_usuario, id_rol) VALUES
  ('1700000200',3),('1700000201',3),('1700000202',3),('1700000203',3),('1700000204',3),
  ('1700000205',3),('1700000206',3),('1700000207',3),('1700000208',3),('1700000209',3),
  ('1700000210',3),('1700000211',3),('1700000212',3),('1700000213',3),('1700000214',3),
  ('1700000215',3),('1700000216',3),('1700000217',3),('1700000218',3),('1700000219',3);
```

---

## Notas
- Todos los usuarios tienen estado `ACTIVO`.
- La contraseña `Notas2026!` debe cambiarse en un entorno real antes de producción.
- Los correos usan el dominio ficticio `@escuela.ec`.
- Las cédulas son ficticias para uso exclusivo de desarrollo/pruebas.
