import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { StorageService } from "./storage.service";
import { FilesController } from "./files.controller";

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [FilesController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
