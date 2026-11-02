import { Test, TestingModule } from "@nestjs/testing";
import { ApplicationsController } from "./applications.controller";
import { ApplicationsService } from "./applications.service";

describe("ApplicationsController", () => {
  let controller: ApplicationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        {
          provide: ApplicationsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            changeStage: jest.fn(),
            addComment: jest.fn(),
            uploadCv: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
