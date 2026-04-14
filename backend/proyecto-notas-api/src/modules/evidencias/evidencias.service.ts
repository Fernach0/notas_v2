import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EvidenciasService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

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
      include: { parcial: { include: { curso: { include: { anioLectivo: true } } } } },
    });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');

    const usuario = await this.prisma.usuario.findUnique({ where: { idUsuario } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const anio = actividad.parcial.curso.anioLectivo.fechaInicio.getFullYear();
    const codigoCurso = actividad.parcial.curso.idCurso;
    const codigoActividad = uuidv4();

    const storagePath = this.config.get<string>('STORAGE_PATH', './storage/pdfs');
    const dir = path.join(storagePath, String(anio), String(codigoCurso), idUsuario);
    fs.mkdirSync(dir, { recursive: true });

    const filename = `${codigoActividad}.pdf`;
    const fullPath = path.join(dir, filename);
    fs.writeFileSync(fullPath, file.buffer);

    const urlRelativa = path.join(
      String(anio),
      String(codigoCurso),
      idUsuario,
      filename,
    ).replace(/\\/g, '/');

    return this.prisma.evidencia.upsert({
      where: { idUsuario_idActividad: { idUsuario, idActividad: dto.idActividad } },
      update: {
        urlArchivo: urlRelativa,
        nombreArchivo: file.originalname,
        tamanio: BigInt(file.size),
        tipoContenido: file.mimetype,
        codigoActividad,
        estado: 'ACTIVO',
      },
      create: {
        idUsuario,
        idActividad: dto.idActividad,
        urlArchivo: urlRelativa,
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
      include: { usuario: { omit: { contrasenaUsuario: true, tokenRecuperacion: true } } },
    });
  }

  async getFilePath(id: number) {
    const ev = await this.prisma.evidencia.findUnique({ where: { idEvidencia: id } });
    if (!ev || !ev.urlArchivo) throw new NotFoundException('Evidencia no encontrada');
    const storagePath = this.config.get<string>('STORAGE_PATH', './storage/pdfs');
    return path.join(storagePath, ev.urlArchivo);
  }

  async softDelete(id: number) {
    const ev = await this.prisma.evidencia.findUnique({ where: { idEvidencia: id } });
    if (!ev) throw new NotFoundException('Evidencia no encontrada');

    if (ev.urlArchivo) {
      const storagePath = this.config.get<string>('STORAGE_PATH', './storage/pdfs');
      const fullPath = path.join(storagePath, ev.urlArchivo);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    return this.prisma.evidencia.update({
      where: { idEvidencia: id },
      data: { estado: 'ELIMINADO', urlArchivo: null },
    });
  }
}
