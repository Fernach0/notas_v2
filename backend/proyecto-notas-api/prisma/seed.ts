import { PrismaClient, EstadoUsuario, EstadoLectivo } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Roles fijos
  const roles = [
    { idRol: 1, nombreRol: 'ADMIN' },
    { idRol: 2, nombreRol: 'PROFESOR' },
    { idRol: 3, nombreRol: 'ESTUDIANTE' },
  ];

  for (const rol of roles) {
    await prisma.rol.upsert({
      where: { idRol: rol.idRol },
      update: {},
      create: rol,
    });
  }

  // 2. Usuario ADMIN inicial
  const hashedPassword = await bcrypt.hash('Admin#2026', 10);
  const admin = await prisma.usuario.upsert({
    where: { idUsuario: '0000000001' },
    update: {},
    create: {
      idUsuario: '0000000001',
      nombreCompleto: 'Administrador del Sistema',
      contrasenaUsuario: hashedPassword,
      estadoUsuario: EstadoUsuario.ACTIVO,
      email: 'admin@notas.edu.ec',
    },
  });

  await prisma.usuarioRol.upsert({
    where: { idUsuario_idRol: { idUsuario: admin.idUsuario, idRol: 1 } },
    update: {},
    create: { idUsuario: admin.idUsuario, idRol: 1 },
  });

  // 3. Año lectivo base ACTIVO
  await prisma.anioLectivo.upsert({
    where: { idAnioLectivo: 1 },
    update: {},
    create: {
      idAnioLectivo: 1,
      fechaInicio: new Date('2026-09-01'),
      fechaFinal: new Date('2027-06-30'),
      estadoLectivo: EstadoLectivo.ACTIVO,
    },
  });

  console.log('Seed ejecutado correctamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
