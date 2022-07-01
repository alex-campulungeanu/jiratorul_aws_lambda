export class CreateReportDto {
  public month: string;
  public year: string;
  public description?: string;
  public sprints?: Array<{
    url: string
  }>;
}