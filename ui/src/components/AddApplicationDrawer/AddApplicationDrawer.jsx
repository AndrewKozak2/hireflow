import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  Button,
  Select,
  Stack,
  Group,
  Collapse,
  Text,
  Box,
  Divider,
  Loader,
} from "@mantine/core";
import { Dropzone, PDF_MIME_TYPE } from "@mantine/dropzone";
import { useForm } from "@mantine/form";
import { IconSearch, IconUpload, IconFileTypePdf } from "@tabler/icons-react";
import { useJobsStore } from "../../stores/useJobsStore";
import { useNotifications } from "../../hooks/useNotifications";
import classes from "./AddApplicationDrawer.module.css";
import { CandidatesService } from "../../services/CandidatesService";
import { ApplicationsService } from "../../services/ApplicationsService";
import CandidateForm from "../../components/CandidateForm";
import { APPLICATION_SOURCE_OPTIONS } from "../../constants/application";
import { JOB_STATUSES } from "../../constants/job";
import { ROUTES } from "../../routes/routes";

export function AddApplicationDrawer({
  opened,
  onClose,
  initialJobId,
  initialCandidateId,
  initialCandidate,
  onUpdate,
}) {
  const [isCreatingNewCandidate, setIsCreatingNewCandidate] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchLoaderTimeoutRef = useRef(null);

  const [searchValue, setSearchValue] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const jobs = useJobsStore((state) => state.jobs);
  const fetchJobs = useJobsStore((state) => state.fetchJobs);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const { onSuccess, onWarning, onError } = useNotifications();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      candidateId: initialCandidateId ? String(initialCandidateId) : "",
      vacancyId: initialJobId ? String(initialJobId) : "",
      source: "manual",
      cv: null,
    },
    validate: {
      vacancyId: (v) => (!v ? "Required" : null),
      candidateId: (v) => (!v ? "Required" : null),
    },
  });

  useEffect(() => {
    if (
      opened &&
      initialJobId &&
      form.values.vacancyId !== String(initialJobId)
    ) {
      form.setFieldValue("vacancyId", String(initialJobId));
    }
    if (
      opened &&
      initialCandidateId &&
      form.values.candidateId !== String(initialCandidateId)
    ) {
      form.setFieldValue("candidateId", String(initialCandidateId));
    }
  }, [opened, initialJobId, initialCandidateId, form]);

  const resetAll = () => {
    form.reset();
    setSearchValue("");
    setCandidates([]);
    setIsCreatingNewCandidate(false);
    setSelectedCandidate(null);
    setFormError(null);
  };

  const selectData = useMemo(() => {
    const map = new Map();

    if (initialCandidate) {
      map.set(String(initialCandidate.id), {
        value: String(initialCandidate.id),
        label: `${initialCandidate.firstName} ${initialCandidate.lastName} (${initialCandidate.email})`,
      });
    }

    candidates.forEach((c) => map.set(c.value, c));

    if (selectedCandidate) {
      map.set(selectedCandidate.value, selectedCandidate);
    }

    return [
      { value: "new_candidate", label: "+ Create new candidate" },
      ...map.values(),
    ];
  }, [candidates, selectedCandidate, initialCandidate]);

  useEffect(() => {
    if (opened) fetchJobs();
  }, [opened, fetchJobs]);

  const handleSearchCandidates = async (query) => {
    if (!query || query.length < 2) {
      clearTimeout(searchLoaderTimeoutRef.current);
      setIsSearching(false);
      return;
    }

    clearTimeout(searchLoaderTimeoutRef.current);
    searchLoaderTimeoutRef.current = setTimeout(() => {
      setIsSearching(true);
    }, 250);

    try {
      const response = await CandidatesService.searchCandidates(query);

      const items = response?.items ?? [];

      const formatted = items.map((c) => ({
        value: String(c.id),
        label: `${c.firstName} ${c.lastName} (${c.email})`,
      }));

      const unique = Array.from(
        new Map(formatted.map((c) => [c.value, c])).values(),
      );

      setCandidates(unique);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      clearTimeout(searchLoaderTimeoutRef.current);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleSearchCandidates(searchValue);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  useEffect(
    () => () => {
      clearTimeout(searchLoaderTimeoutRef.current);
    },
    [],
  );

  const handleCandidateChange = (value) => {
    if (value === "new_candidate") {
      setIsCreatingNewCandidate(true);
      form.setFieldValue("candidateId", "");
      setSelectedCandidate(null);
      setSearchValue("");
      return;
    }

    setIsCreatingNewCandidate(false);

    form.setFieldValue("candidateId", value);

    const selected = candidates.find((c) => c.value === value);

    if (selected) {
      setSelectedCandidate(selected);
    }
  };

  const handleSubmit = async (values) => {
    setFormError(null);
    if (submitting) return;
    setSubmitting(true);

    try {
      const candidateId = values.candidateId;

      const response = await ApplicationsService.createApplication({
        candidateId,
        jobId: values.vacancyId,
        source: values.source,
      });

      const applicationId = response?.data?.id || response?.id;

      if (applicationId) {
        if (values.cv) {
          try {
            await ApplicationsService.uploadCv(applicationId, values.cv);
          } catch (err) {
            console.error("CV upload failed", err);
            onWarning({ message: "Application created, but CV upload failed" });
          }
        } else {
          try {
            await ApplicationsService.runScreeningFromExistingCv(applicationId);
          } catch (err) {
            console.error("Auto AI Screening failed", err);
            onWarning({
              message: "Application created, but AI Screening failed",
            });
          }
        }
      }

      onSuccess({ message: "Application added successfully" });
      if (onUpdate) {
        onUpdate();
      }

      if (applicationId) {
        navigate(ROUTES.APPLICATION_DETAIL.replace(":id", applicationId));
      }

      handleClose();
    } catch (error) {
      if (error.response?.status === 409) {
        setFormError(
          "This candidate already has an application for this vacancy.",
        );
      } else {
        onError({ message: "Something went wrong" });
        console.error(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const jobsData = Array.isArray(jobs)
    ? jobs
        .filter((job) => job.status === JOB_STATUSES.ACTIVE)
        .map((job) => ({
          value: String(job?.id),
          label: job?.title || "Untitled Job",
        }))
    : [];

  const handleClose = () => {
    resetAll();
    onClose();
  };

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      position="right"
      size={500}
      title={
        <Text fw={600} size="lg" className={classes.title}>
          Add application manually
        </Text>
      }
      classNames={{
        content: classes.drawerContent,
        header: classes.drawerHeader,
        body: classes.drawerBody,
      }}
    >
      <Box className={classes.container}>
        <div className={classes.scrollArea}>
          <Stack>
            <Stack gap="md">
              {formError && (
                <Text c="red" size="sm">
                  {formError}
                </Text>
              )}
              <Stack gap="xs">
                <Select
                  label="Find or create candidate"
                  placeholder="Search by name or email..."
                  leftSection={<IconSearch size={16} />}
                  clearable
                  onClear={() => {
                    setSelectedCandidate(null);
                    setSearchValue("");
                    setIsCreatingNewCandidate(false);
                  }}
                  searchable
                  searchValue={searchValue}
                  onSearchChange={setSearchValue}
                  data={selectData}
                  onChange={handleCandidateChange}
                  value={form.values.candidateId}
                  className={
                    form.values.candidateId ? classes.selectedInput : undefined
                  }
                  rightSection={isSearching ? <Loader size="xs" /> : null}
                />
                <Text size="xs" c="dimmed">
                  Type to search existing candidates, or enter a new email to
                  create.
                </Text>
              </Stack>
              <Collapse in={isCreatingNewCandidate}>
                <Stack gap="md">
                  <CandidateForm
                    mode="create"
                    onSuccess={(candidate) => {
                      const newCandidate = {
                        value: candidate.id,
                        label: `${candidate.firstName} ${candidate.lastName} (${candidate.email})`,
                      };

                      setCandidates((prev) => {
                        const map = new Map(prev.map((c) => [c.value, c]));
                        map.set(newCandidate.value, newCandidate);
                        return Array.from(map.values());
                      });

                      setSelectedCandidate(newCandidate);
                      form.setFieldValue("candidateId", newCandidate.value);

                      setIsCreatingNewCandidate(false);
                    }}
                  />
                </Stack>
              </Collapse>
            </Stack>

            <Divider />

            <Stack gap="md">
              <Select
                label="Select vacancy"
                placeholder="Choose a job listing"
                required
                allowDeselect={false}
                data={jobsData}
                {...form.getInputProps("vacancyId")}
              />

              <Select
                label="Source"
                allowDeselect={false}
                data={APPLICATION_SOURCE_OPTIONS}
                {...form.getInputProps("source")}
              />

              <Stack gap={5}>
                <Text size="sm" fw={500}>
                  Upload CV
                </Text>

                <Dropzone
                  onDrop={(files) => form.setFieldValue("cv", files[0])}
                  maxSize={10 * 1024 ** 2}
                  accept={PDF_MIME_TYPE}
                  multiple={false}
                  className={classes.dropzoneRoot}
                >
                  <div className={classes.dropzoneInner}>
                    <IconUpload size={24} />
                    <Stack gap={2} align="center">
                      <Text size="sm" c="dimmed">
                        Drop PDF file here or click to upload
                      </Text>
                      <Text size="xs" c="dimmed">
                        Max 10MB
                      </Text>
                    </Stack>
                  </div>
                </Dropzone>
                {form.values.cv && (
                  <Box mt="xs" p="xs" className={classes.cvPreview}>
                    <Group justify="space-between" align="center">
                      <Group gap="xs">
                        <IconFileTypePdf size={18} color="red" />

                        <div>
                          <Text size="sm">{form.values.cv.name}</Text>

                          <Text size="xs" c="dimmed">
                            {(form.values.cv.size / 1024 / 1024).toFixed(2)} MB
                          </Text>
                        </div>
                      </Group>

                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => form.setFieldValue("cv", null)}
                      >
                        Remove
                      </Button>
                    </Group>
                  </Box>
                )}
              </Stack>
            </Stack>
          </Stack>
        </div>

        <div className={classes.footer}>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>

            <Button
              onClick={() => form.onSubmit(handleSubmit)()}
              disabled={!form.isValid() || submitting}
              loading={submitting}
            >
              Add application
            </Button>
          </Group>
        </div>
      </Box>
    </Drawer>
  );
}
