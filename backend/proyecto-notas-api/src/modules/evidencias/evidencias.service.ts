import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto';
import { v4 as uuidv4 } from 'uuid';

// Multer Buffer → Uint8Array<ArrayBuffer> que requieren los tipos de Prisma Bytes
const toBytes = (buf: Buffer): Uint8Array<ArrayBuffer> =>
  new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) as Uint8Array<ArrayBuffer>;

@Injectable()
export class EvidenciasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    idUsuario: string,
    dto: CreateEvidenciaDto,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Se requiere un archivo PDF');
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se aceptan archivos PDF');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('El archivo supera el límite de 10 MB');
    }

    const actividad = await this.prisma.actividad.findUnique({
      where: { idActividad: dto.idActividad },
    });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');

    const usuario = await this.prisma.usuario.findUnique({ where: { idUsuario } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const codigoActividad = uuidv4();

    return this.prisma.evidencia.upsert({
      where: { idUsuario_idActividad: { idUsuario, idActividad: dto.idActividad } },
      update: {
        archivoBytes: toBytes(file.buffer),
        nombreArchivo: file.originalname,
        tamanio: BigInt(file.size),
        tipoContenido: file.mimetype,
        codigoActividad,
        estado: 'ACTIVO',
      },
      create: {
        idUsuario,
        idActividad: dto.idActividad,
        archivoBytes: toBytes(file.buffer),
        nombreArchivo: file.originalname,
        tamanio: BigInt(file.size),
        tipoContenido: file.mimetype,
        estado: 'ACTIVO',
        nombreActividad: dto.nombreActividad,
        codigoActividad,
        tipoActividad: dto.tipoActividad,
      },
    });
  }

  findAll(idActividad?: number) {
    return this.prisma.evidencia.findMany({
      where: idActividad ? { idActividad } : undefined,
      select: {
        idEvidencia: true,
        idUsuario: true,
        idActividad: true,
        nombreArchivo: true,
        fechaSubida: true,
        tamanio: true,
        tipoContenido: true,
        estado: true,
        nombreActividad: true,
        codigoActividad: true,
        tipoActividad: true,
        // archivoBytes excluido del listado para no transferir datos masivos
        usuario: {
          select: {
            idUsuario: true,
            nombreCompleto: true,
            estadoUsuario: true,
            email: true,
          },
        },
      },
    });
  }

  // Solo los campos mínimos que necesita el estudiante para saber si ya entregó
  findByUsuario(idUsuario: string, idActividad?: number) {
    return this.prisma.evidencia.findMany({
      where: {
        idUsuario,
        ...(idActividad ? { idActividad } : {}),
      },
      select: {
        idEvidencia: true,
        idActividad: true,
        nombreArchivo: true,
        fechaSubida: true,
        estado: true,
      },
    });
  }

  async getFileBuffer(id: number, idUsuarioCheck?: string): Promise<{ buffer: Buffer; nombreArchivo: string; tipoContenido: string }> {
    const ev = await this.prisma.evidencia.findUnique({
      where: { idEvidencia: id },
      select: { archivoBytes: true, nombreArchivo: true, tipoContenido: true, estado: true, idUsuario: true },
    });
    if (!ev) throw new NotFoundException('Evidencia no encontrada');
    if (idUsuarioCheck && ev.idUsuario !== idUsuarioCheck) {
      throw new ForbiddenException('No tienes permiso para acceder a esta evidencia');
    }
    if (!ev.archivoBytes) {
      throw new NotFoundException('El archivo de esta evidencia ya no está disponible');
    }
    return {
      buffer: Buffer.from(ev.archivoBytes),
      nombreArchivo: ev.nombreArchivo,
      tipoContenido: ev.tipoContenido,
    };
  }

  async softDelete(id: number) {
    const ev = await this.prisma.evidencia.findUnique({ where: { idEvidencia: id } });
    if (!ev) throw new NotFoundException('Evidencia no encontrada');

    return this.prisma.evidencia.update({
      where: { idEvidencia: id },
      data: { estado: 'ELIMINADO', archivoBytes: null },
    });
  }
}
