import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rule } from './rule.entity.js';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { FileService } from '../file/file.service.js';
import IsolatedVM from 'isolated-vm';
import { RuleHooks } from './rule.interface.js';
import TypeScript from 'typescript';

@Injectable()
export class RuleService {
  constructor(@InjectRepository(Rule) private ruleRepository: Repository<Rule>, private fileService: FileService) {}

  async buildRuleHook<T extends keyof RuleHooks>(hookName: T, exports: IsolatedVM.Reference) {
    const hook = await exports.get(hookName, { reference: true });
    if (hook.typeof === 'function') {
      return (...args: Parameters<RuleHooks[T]>) =>
        hook.applySync(null, args, {
          arguments: {
            copy: true,
          },
          result: {
            promise: true,
            copy: true,
          },
        }) as ReturnType<RuleHooks[T]>;
    } else {
      return undefined;
    }
  }

  async createRuleVm(code: string) {
    const vm = new IsolatedVM.Isolate();
    const context = await vm.createContext();
    const module = await vm.compileModule(
      TypeScript.transpileModule(code, {
        compilerOptions: {
          target: TypeScript.ScriptTarget.ES2017,
          esModuleInterop: true,
        },
      }).outputText,
    );
    await module.instantiate(context, () => undefined);
    await module.evaluate({ timeout: 1000, reference: true });
    const exports = await module.namespace.get('default', { reference: true });

    return {
      vm,
      context,
      module,
      hooks: {
        validate: await this.buildRuleHook('validate', exports),
        describe: await this.buildRuleHook('describe', exports),
      },
    };
  }

  async save(rule: DeepPartial<Rule>) {
    return await this.ruleRepository.save(rule);
  }

  async findOneBy(where: FindOptionsWhere<Rule>) {
    return await this.ruleRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<Rule>) {
    return await this.ruleRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<Rule>) {
    const rules = await this.ruleRepository.find({ where });
    const result = await this.ruleRepository.delete(where);

    for (const rule of rules) {
      if (rule.file) {
        await this.fileService.delete({ id: rule.file.id });
      }
    }

    return result.affected > 0;
  }
}
