import { Test, TestingModule } from "@nestjs/testing";
import { ApplicationsController } from "./applications.controller";
import { ApplicationsService } from "./applications.service";
import { ApplicationJobSuggestionsService } from "./application-job-suggestions.service";

describe("ApplicationsController", () => {
  let controller: ApplicationsController;
  const mockJobSuggestionsService = { getForApplications: jest.fn() };

  beforeEach(async () => {
    mockJobSuggestionsService.getForApplications.mockReset();
    mockJobSuggestionsService.getForApplications.mockResolvedValue({});

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
        {
          provide: ApplicationJobSuggestionsService,
          useValue: mockJobSuggestionsService,
        },
      ],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getJobSuggestions", () => {
    const a = "1098fda6-f230-430f-b5ca-6ef352a4b811";
    const b = "d8d12989-a3e4-4ec8-81cb-9ba5a62e7d60";

    it("passes the comma-separated application IDs", async () => {
      await controller.getJobSuggestions(`${a}, ${b}`);

      expect(mockJobSuggestionsService.getForApplications).toHaveBeenCalledWith(
        [a, b],
      );
    });

    it("drops anything that is not a UUID", async () => {
      await controller.getJobSuggestions(`${a},not-an-id,,'; drop table`);

      expect(mockJobSuggestionsService.getForApplications).toHaveBeenCalledWith(
        [a],
      );
    });

    it("asks for nothing when no IDs are given", async () => {
      await controller.getJobSuggestions(undefined);

      expect(mockJobSuggestionsService.getForApplications).toHaveBeenCalledWith(
        [],
      );
    });
  });
});
