import { apiClient } from "./AxiosService";
import { decodeUploadedFilename } from "../utils/filename";

function normalizeCv(cv) {
  return {
    id: cv.id,
    fileName: decodeUploadedFilename(cv.originalFilename),
    uploadedAt: cv.uploadedAt,
    isCurrent: cv.isCurrent,
    fileKey: cv.fileUrl,
  };
}

function normalizeCandidate(candidate) {
  return {
    ...candidate,
    applicationsCount: candidate.applicationsCount ?? 0,
    skills: candidate.skills ?? [],
    cvHistory: (candidate.cvs ?? []).map(normalizeCv),
    lastActivityAt: candidate.lastActivityAt ?? candidate.updatedAt ?? null,
  };
}

const searchCandidates = (search) =>
  apiClient.get("/candidates", { params: { search } }).then((res) => ({
    ...res,
    items: (res.items ?? []).map(normalizeCandidate),
  }));

const getCandidates = ({ search = "", page = 1, limit = 25 } = {}) =>
  apiClient
    .get(`/candidates`, { params: { search, page, limit } })
    .then((response) => ({
      ...response,
      items: (response.items ?? []).map(normalizeCandidate),
    }));

const getCandidate = (id) =>
  apiClient
    .get(`/candidates/${id}`)
    .then((candidate) => (candidate ? normalizeCandidate(candidate) : null))
    .catch((error) => {
      if (error.response?.status === 404) {
        return null;
      }

      throw error;
    });

const createCandidate = (data) =>
  apiClient
    .post(`/candidates`, data)
    .then((candidate) => normalizeCandidate(candidate));

const updateCandidate = (id, data) =>
  apiClient
    .patch(`/candidates/${id}`, data)
    .then((candidate) => normalizeCandidate(candidate));

const updateSkills = (id, skills) =>
  apiClient
    .patch(`/candidates/${id}/skills`, { skills })
    .then((candidate) => candidate.skills ?? []);

const uploadCv = (id, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient
    .post(`/candidates/${id}/cv`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((cvs) => (cvs ?? []).map(normalizeCv));
};

const getCandidateCvUrl = (candidateId, fileId) =>
  apiClient
    .get(`/candidates/${candidateId}/cv/${fileId}/url`)
    .then((response) => response.url);

export const CandidatesService = {
  searchCandidates,
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  updateSkills,
  uploadCv,
  getCandidateCvUrl,
};
