import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'isCedulaEcuatoriana', async: false })
export class IsCedulaEcuatorianaConstraint implements ValidatorConstraintInterface {
  validate(cedula: string, _args: ValidationArguments): boolean {
    if (!cedula || cedula.length !== 10 || !/^\d+$/.test(cedula)) return false;
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;

    const digits = cedula.split('').map(Number);
    const verifier = digits[9];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let val = digits[i] * (i % 2 === 0 ? 2 : 1);
      if (val > 9) val -= 9;
      sum += val;
    }
    const mod = sum % 10;
    const expected = mod === 0 ? 0 : 10 - mod;
    return expected === verifier;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'La cédula ecuatoriana no es válida';
  }
}

export function IsCedulaEcuatoriana(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCedulaEcuatorianaConstraint,
    });
  };
}
