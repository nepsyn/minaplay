export class ApiPaginationResultDto<T> {
  constructor(public items: T[], public total: number, public page: number, public size: number) {}
}
