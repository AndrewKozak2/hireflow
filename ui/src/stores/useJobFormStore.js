import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialState = {
  title: "",
  hiringManager: null,
  employmentType: null,
  jobLocation: "",
  description: "",
  requirements: "",
  niceToHave: "",
  department: null,
  headcount: 1,
  expertise_level: null,
  english_level: null,
  salary_min: null,
  salary_max: null,
  currency: null,
  saving: false,
  submitting: false,
};

export const useJobFormStore = create(
  persist(
    (set) => ({
      ...initialState,
      setTitle: (title) => set({ title }),
      setHiringManager: (hiringManager) => set({ hiringManager }),
      setEmploymentType: (employmentType) => set({ employmentType }),
      setJobLocation: (jobLocation) => set({ jobLocation }),
      setDescription: (description) => set({ description }),
      setRequirements: (requirements) => set({ requirements }),
      setNiceToHave: (niceToHave) => set({ niceToHave }),
      setDepartment: (department) => set({ department }),
      setHeadcount: (headcount) => set({ headcount }),
      setExpertiseLevel: (expertise_level) => set({ expertise_level }),
      setEnglishLevel: (english_level) => set({ english_level }),
      setSalaryMin: (salary_min) => set({ salary_min }),
      setSalaryMax: (salary_max) => set({ salary_max }),
      setCurrency: (currency) => set({ currency }),
      setSaving: (saving) => set({ saving }),
      setSubmitting: (submitting) => set({ submitting }),

      initializeForm: (data) => {
        set({
          title: data.title || "",
          hiringManager:
            data.hiringManagerId ||
            data.hiring_manager_id ||
            initialState.hiringManager,
          employmentType:
            data.employmentType ||
            data.employment_type ||
            initialState.employmentType,
          jobLocation: data.location || "",
          description: data.description || "",
          requirements: data.requirements || "",
          niceToHave: data.niceToHave || "",
          department: data.department || initialState.department,
          headcount: data.headcount || initialState.headcount,
          expertise_level: data.expertise_level || initialState.expertise_level,
          english_level: data.english_level || initialState.english_level,
          salary_min: data.salary_min || initialState.salary_min,
          salary_max: data.salary_max || initialState.salary_max,
          currency: data.currency || initialState.currency,
        });
      },

      resetForm: () => {
        set(initialState);
      },
    }),
    {
      name: "job-form-storage",
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !["saving", "submitting"].includes(key),
          ),
        ),
    },
  ),
);
