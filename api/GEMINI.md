## Role & Boundaries:

You are responsible for the NestJS backend of HireFlow. Your scope is everything inside api/. You do not modify React components, Vite configs, or UI assets. You own the REST API, database schema, authentication, and business logic. Always think in terms of modules — each domain is encapsulated.

## Tech Stack:

- ToolPurposeNestJSFramework (controllers, modules, providers)TypeORMORM for PostgreSQLPostgreSQLPrimary databasePassport.jsAuth strategies (JWT, Local)class-validatorDTO validationclass-transformerDTO serialization, @nestjs/swagger (API Documentation)
- TypeScript is mandatory — strict mode is on. Never use any without a // eslint-disable comment explaining why.

## Folder Structure:

```bash
api/src/
├── auth/
│   ├── constants/       # e.g., JWT secret keys, token expiry
│   ├── decorators/      # e.g., @Public(), @CurrentUser()
│   ├── dto/             # LoginDto, RegisterDto, etc.
│   ├── entities/        # Auth-related entities if any
│   ├── guards/          # JwtAuthGuard, LocalAuthGuard, RolesGuard
│   ├── interfaces/      # JwtPayload, etc.
│   ├── strategies/      # JwtStrategy, LocalStrategy
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── user/
│   ├── entities/        # User entity
│   ├── user.controller.ts
│   ├── user.module.ts
│   └── user.service.ts
├── database/
│   └── migrations/      # TypeORM migration files (never delete)
└── app.module.ts
```

## Rules:

- One module per domain — auth, user, job, application, etc.
- Create entities where they will be use
- The module file declares what it imports, exports, and provides
- Cross-module dependencies are injected via the module imports array — never instantiated directly
- app.module.ts is the root — it imports feature modules, TypeORM, and config

## Module Pattern:

typescript// user.module.ts

```bash
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // only export if other modules need it
})
export class UserModule {}
```

## Controller Pattern:

typescript// user.controller.ts

```bash
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findById(id);
  }
}
```

## Controller rules:

- Controllers only handle HTTP concerns — routing, status codes, param parsing
- No business logic in controllers — delegate everything to the service
- Use ParseUUIDPipe, ParseIntPipe, etc. for param validation
- Use `@ApiTags('DomainName')` at the class level to group endpoints (e.g., Auth, Users)
- Use `@ApiBearerAuth('access-token')` on all controllers/methods requiring auth
- Return service results directly — NestJS serializes them

## Service Pattern:

typescript// user.service.ts

```bash
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }
}
```

## Service rules:

- All DB access happens in the service (never in the controller)
- Throw NestJS built-in exceptions (NotFoundException, BadRequestException, etc.)
- Never expose raw DB errors to the caller — wrap them in appropriate HTTP exceptions
- Keep services focused: if a service grows beyond ~200 lines, consider splitting

## Entity Conventions:

typescript// entities/user.entity.ts

```bash
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Entity rules:

- Table names are plural snake_case: users, job_listings, applications
- Column names are camelCase in TypeScript, TypeORM maps them to snake_case automatically (configure in TypeORM options)
- Always use uuid as primary key type
- Always include createdAt and updatedAt
- Never store plain-text passwords — store only hashed values (passwordHash)
- Sensitive fields (e.g., passwordHash) must be excluded from responses via @Exclude() from class-transformer

## DTO Structure:

typescript// dto/create-user.dto.ts

```bash
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

## DTO rules:

- Separate DTOs for create, update, and response shapes
- Use class-validator decorators on every field — no unvalidated input reaches the service
- Use `@ApiProperty()` or `@ApiPropertyOptional()` on every field for Swagger schema visibility
- UpdateDto fields should be optional (@IsOptional() + ?)
- Response DTOs use @Exclude() and @Expose() for controlled serialization
- Enable ValidationPipe globally with whitelist: true, forbidNonWhitelisted: true


## Gemini Auto-Doc Hooks:

When generating or refactoring backend code:

1. Controllers: Be sure to add `@ApiTags`. Methods without `@Public()` decorator must have `@ApiBearerAuth('access-token')`.
2. DTOs: Each property must have `@ApiProperty` decorator with examples (`example`) and descriptions.
3. Responses: Use `@ApiResponse` to document status codes (201, 400, 401, 404) and link response DTOs.
4. Auto-documentation: When generating new endpoints, always include Swagger decorators by default.
5. Enforcement: Never provide code for controllers or DTOs that lacks Swagger metadata.


## Migrations:

- Never delete migration files
- Never use synchronize: true in production — use migrations only
- For run migration use: npm run migration:run
- Migration files live in src/database/migrations/
- Each migration must be reversible — implement both up() and down()
- Migration filenames are timestamp-prefixed (auto-generated): 1776246963573-init.ts

## Authentication;

- All routes are protected by default via a global JwtAuthGuard
- Public routes are marked with the @Public() decorator
- JWT payload shape: { sub: string (userId), email: string, role: UserRole }
- Use @CurrentUser() decorator to access the authenticated user in controllers
- Refresh token logic is handled in AuthService — do not replicate it elsewhere

typescript// Marking a route as public

```bash
@Public()
@Post('login')
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

## Error Handling:

- SituationException to throwResource not foundNotFoundExceptionInvalid inputBadRequestExceptionUnauthorized accessUnauthorizedExceptionForbidden actionForbiddenExceptionConflict (duplicate)ConflictExceptionUnexpected server errorLet it bubble — NestJS returns 500
- Never expose stack traces or raw DB error messages to API consumers.

## PostgreSQL-Specific Considerations:

- Use UUIDs (uuid_generate_v4()) — configure the extension in the init migration
- Use timestamp with time zone for all date/time columns (TypeORM's CreateDateColumn handles this)
- Index columns used in WHERE clauses and foreign keys
- Use @Unique() at the entity level for unique constraints — don't rely only on application-level checks
- For complex queries, use TypeORM's QueryBuilder rather than raw SQL
- If raw SQL is unavoidable, add a comment explaining why and sanitize all inputs

## Do's and Don'ts:

- Do:
  Use NestJS lifecycle hooks (OnModuleInit) for startup tasks
  Log meaningful events at the service level using NestJS Logger
  Use environment variables for all configuration (@nestjs/config)
  Write unit tests for services (\*.spec.ts) and e2e tests for critical flows

- Don't:
  Don't put logic in app.module.ts beyond wiring modules together
  Don't use TypeOrmModule.forRoot with synchronize: true outside local dev
  Don't bypass guards by restructuring routes
  Don't create circular module dependencies
  Don't query the DB from a controller
  Don't return full entity objects if they contain sensitive fields — use response DTOs
