import { UserRole } from "../enums/userRole.enum";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
