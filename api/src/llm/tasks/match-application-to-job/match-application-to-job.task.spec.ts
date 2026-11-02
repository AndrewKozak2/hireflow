import { LlmSchemaValidationError } from "../../llm.errors";
import { MatchApplicationToJobInput } from "./interfaces/match-application-to-job.interface";
import { matchApplicationToJobTask } from "./match-application-to-job.task";
import { Job } from "../../../job/entities/job.entity";

describe("matchApplicationToJobTask", () => {
  describe("buildPrompt", () => {
    it("should construct a prompt with candidate and job details", () => {
      const input: MatchApplicationToJobInput = {
        candidate: {
          summary: "Experienced in TypeScript and NestJS.",
        },
        jobs: [
          {
            id: "job-1",
            title: "Backend Developer",
            description: "Work with NestJS.",
            requirements: "5 years of TypeScript.",
            niceToHave: "GraphQL experience.",
          },
          {
            id: "job-2",
            title: "Frontend Developer",
            description: "Work with React.",
            requirements: "5 years of JavaScript.",
            niceToHave: "CSS skills.",
          },
        ],
      };

      const prompt = matchApplicationToJobTask.buildPrompt(input);

      expect(prompt).toContain(
        "Candidate Description:\nExperienced in TypeScript and NestJS.",
      );
      expect(prompt).toContain("Job ID: job-1");
      expect(prompt).toContain("Title: Backend Developer");
      expect(prompt).toContain("Job ID: job-2");
      expect(prompt).toContain("Title: Frontend Developer");
    });

    it("should handle missing summary", () => {
      const input: MatchApplicationToJobInput = {
        candidate: {
          summary: null,
        },
        jobs: [
          {
            id: "job-1",
            title: "Backend Developer",
            description: "Work with NestJS.",
            requirements: "5 years of TypeScript.",
            niceToHave: "GraphQL experience.",
          },
        ],
      };

      const prompt = matchApplicationToJobTask.buildPrompt(input);
      expect(prompt).toContain("Candidate Description:\nNot provided");
    });
  });

  describe("buildPrompt with various candidate scenarios (20+ cases)", () => {
    const jobs: Pick<
      Job,
      "id" | "title" | "description" | "requirements" | "niceToHave"
    >[] = [
      {
        id: "job-1",
        title: "Backend Developer",
        description: "Work with NestJS.",
        requirements: "5 years of TypeScript.",
        niceToHave: "GraphQL experience.",
      },
      {
        id: "job-2",
        title: "Frontend Developer",
        description: "Work with React.",
        requirements: "5 years of JavaScript.",
        niceToHave: "CSS skills.",
      },
      {
        id: "job-3",
        title: "Full-Stack Developer",
        description: "Build end-to-end features with React and NestJS.",
        requirements: "React, NestJS, TypeScript",
        niceToHave: "Experience with CI/CD.",
      },
      {
        id: "job-4",
        title: "SMM Specialist",
        description: "Manage social media for an IT company.",
        requirements: "Content creation, SMM strategy",
        niceToHave: "Experience in IT marketing.",
      },
      {
        id: "job-5",
        title: "Manual QC Engineer",
        description: "Manual testing of web applications.",
        requirements: "Test documentation, bug reporting, manual testing",
        niceToHave: "Experience with automated testing tools.",
      },
    ];

    const testCases = [
      {
        name: "1. Full-Stack Engineer",
        candidate: {
          summary:
            "Middle Full-Stack Engineer with strong expertise in React and NestJS.",
        },
      },
      {
        name: "2. Manual QC Engineer",
        candidate: {
          summary:
            "Middle Manual QC Engineer. Experienced in manual testing, test documentation, and bug reporting.",
        },
      },
      {
        name: "3. Non-technical SMM Specialist",
        candidate: {
          summary:
            "SMM Specialist for an IT company. Experienced in content creation, social media strategy, and community management.",
        },
      },
      {
        name: "4. Non-technical Lead Generator",
        candidate: {
          summary:
            "Junior Lead generator (Sales Associate, Data Researcher). Focus on market research, cold outreach, and lead generation.",
        },
      },
      {
        name: "5. DevOps Engineer",
        candidate: {
          summary:
            "DevOps Engineer skilled in AWS, Kubernetes, Terraform, and setting up CI/CD pipelines.",
        },
      },
      {
        name: "6. Data Scientist",
        candidate: {
          summary:
            "Data Scientist with 3 years of experience in Python, SQL, and Machine Learning models using TensorFlow.",
        },
      },
      {
        name: "7. UI/UX Designer",
        candidate: {
          summary:
            "Creative UI/UX Designer focusing on mobile and web applications. Expert in Figma and wireframing.",
        },
      },
      {
        name: "8. Product Manager",
        candidate: {
          summary:
            "Product Manager specialized in Agile/Scrum, roadmapping, and driving cross-functional team delivery.",
        },
      },
      {
        name: "9. HR Manager",
        candidate: {
          summary:
            "IT Recruiter / HR Generalist with a focus on talent acquisition, onboarding, and retention.",
        },
      },
      {
        name: "10. Cyber Security Analyst",
        candidate: {
          summary:
            "Information Security Specialist with experience in penetration testing and vulnerability assessments.",
        },
      },
      {
        name: "11. Solutions Architect",
        candidate: {
          summary:
            "Enterprise Architect with over 10 years of experience designing scalable microservices architectures.",
        },
      },
      {
        name: "12. Mobile Developer (iOS)",
        candidate: {
          summary:
            "Swift and SwiftUI developer with multiple apps published in the App Store.",
        },
      },
      {
        name: "13. Mobile Developer (Android)",
        candidate: {
          summary:
            "Android Developer specializing in Kotlin, Jetpack Compose, and clean architecture.",
        },
      },
      {
        name: "14. Business Analyst",
        candidate: {
          summary:
            "Business Analyst skilled in gathering requirements, creating user stories, and UML diagrams.",
        },
      },
      {
        name: "15. Embedded Systems Engineer",
        candidate: {
          summary:
            "C/C++ developer working with microcontrollers, RTOS, and hardware-software integration.",
        },
      },
      {
        name: "16. Support Engineer",
        candidate: {
          summary:
            "L2 Technical Support Engineer with background in Linux sysadmin and basic SQL querying.",
        },
      },
      {
        name: "17. Copywriter",
        candidate: {
          summary:
            "Tech Copywriter and Content Creator proficient in SEO, blogging, and technical documentation.",
        },
      },
      {
        name: "18. Minimal / Short Summary",
        candidate: { summary: "Developer." },
      },
      {
        name: "19. Multi-line Summary",
        candidate: {
          summary:
            "Line 1: Senior Node.js Developer.\nLine 2: AWS Expert.\nLine 3: Team Lead experience.",
        },
      },
      {
        name: "20. Summary with special characters",
        candidate: {
          summary:
            "React & Node.js Developer! Can handle $10k+ budget projects? 100% remote layout #typescript.",
        },
      },
      {
        name: "21. Empty string summary",
        candidate: { summary: "" },
      },
    ];

    it.each(testCases)(
      "should generate the correct prompt for a $name",
      ({ candidate }) => {
        const input: MatchApplicationToJobInput = { candidate, jobs };
        const prompt = matchApplicationToJobTask.buildPrompt(input);

        expect(prompt).toContain(
          `Candidate Description:\n${candidate.summary}`,
        );

        for (const job of jobs) {
          expect(prompt).toContain(`Job ID: ${job.id}`);
          expect(prompt).toContain(`Title: ${job.title}`);
        }
      },
    );
  });

  describe("outputSchema.parse", () => {
    it("should correctly parse a valid array of matched jobs", () => {
      const validOutput = [
        {
          jobId: "job-123",
          confidence: "high",
          reason: "Excellent match based on description.",
        },
        {
          jobId: "job-456",
          confidence: "low",
          reason: "Partial match on description.",
        },
      ];

      const parsed = matchApplicationToJobTask.outputSchema.parse(validOutput);
      expect(parsed).toEqual(validOutput);
    });

    it("should throw a validation error for non-array output", () => {
      const invalidOutput = { message: "This is not an array" };
      expect(() =>
        matchApplicationToJobTask.outputSchema.parse(invalidOutput),
      ).toThrow(LlmSchemaValidationError);
    });

    it("should throw a validation error for an item with a missing field", () => {
      const invalidOutput = [{ jobId: "job-123", confidence: "high" }];
      expect(() =>
        matchApplicationToJobTask.outputSchema.parse(invalidOutput),
      ).toThrow(LlmSchemaValidationError);
    });

    it("should throw a validation error for an item with an invalid confidence value", () => {
      const invalidOutput = [
        { jobId: "job-123", confidence: "very-high", reason: "..." },
      ];
      expect(() =>
        matchApplicationToJobTask.outputSchema.parse(invalidOutput),
      ).toThrow(LlmSchemaValidationError);
    });
  });
});
