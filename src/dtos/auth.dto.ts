export class CreateUserDto {
  public email: string;
  public password: string
  public name: string
}

export class LoginUserDto {
  public email: string;
  public password: string;
}