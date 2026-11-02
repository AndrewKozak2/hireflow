import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { StorageService, MulterFile } from "./storage.service";

@Controller("files")
export class FilesController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // Max 5MB
        ],
      }),
    )
    file: MulterFile,
  ) {
    if (!file) throw new BadRequestException("File is required");

    await this.storageService.upload(file, file.originalname);
    return { key: file.originalname, message: "File uploaded successfully" };
  }

  @Get(":key")
  async getFileUrl(@Param("key") key: string) {
    const url = await this.storageService.getPresignedUrl(key);
    return { url };
  }
}
