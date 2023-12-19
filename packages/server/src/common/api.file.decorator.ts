import { ApiBody } from '@nestjs/swagger';

export const ApiFile =
  (fieldName = 'file', description = '文件'): MethodDecorator =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          [fieldName]: {
            type: 'file',
            format: 'binary',
            description,
          },
        },
      },
    })(target, propertyKey, descriptor);
  };
