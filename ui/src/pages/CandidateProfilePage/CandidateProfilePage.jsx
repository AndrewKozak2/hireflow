import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Center,
  Group,
  Stack,
  Tabs,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBrandLinkedin,
  IconMail,
  IconPhone,
  IconPlus,
} from "@tabler/icons-react";
import { Link, useParams } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { ROUTES } from "../../routes/routes";
import { CandidatesService } from "../../services/CandidatesService";
import { useNotifications } from "../../hooks/useNotifications";
import { CandidateProfileSkeleton } from "./components/CandidateProfileSkeleton";
import { CandidateApplicationsList } from "./components/CandidateApplicationsList";
import { CandidateProfileTab } from "./components/CandidateProfileTab";
import { useDateTime } from "../../hooks/useDateTime";
import classes from "./CandidateProfilePage.module.css";
import { AddApplicationDrawer } from "../../components/AddApplicationDrawer/AddApplicationDrawer";

export default function CandidateProfilePage() {
  const theme = useMantineTheme();
  const { onError, onSuccess } = useNotifications();
  const { formatRelativeDate } = useDateTime();
  const { id } = useParams();
  const [candidate, setCandidate] = useState(undefined);
  const [errors, setErrors] = useState({});
  const [savingField, setSavingField] = useState(null);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isSavingSkills, setIsSavingSkills] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;

    CandidatesService.getCandidate(id)
      .then((result) => {
        if (active) {
          setCandidate(result);
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        if (error.response?.status === 404) {
          setCandidate(null);
          return;
        }

        onError({ message: "Failed to load candidate profile" });
        setCandidate(null);
      });

    return () => {
      active = false;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fullName = useMemo(() => {
    if (!candidate) {
      return "";
    }

    return `${candidate.firstName} ${candidate.lastName}`.trim();
  }, [candidate]);

  const normalizedLinkedinUrl = useMemo(() => {
    if (!candidate?.linkedinUrl) {
      return null;
    }

    return candidate.linkedinUrl.startsWith("http")
      ? candidate.linkedinUrl
      : `https://${candidate.linkedinUrl}`;
  }, [candidate?.linkedinUrl]);

  if (candidate === undefined) {
    return <CandidateProfileSkeleton />;
  }

  if (!candidate) {
    return (
      <Center py="xl" mih="70vh">
        <Stack align="center" gap="md">
          <Title order={2}>Candidate not found</Title>
          <Text c="dimmed" ta="center">
            We could not find the requested candidate profile.
          </Text>
          <Button
            component={Link}
            to={ROUTES.CANDIDATES}
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
          >
            Back to Candidates
          </Button>
        </Stack>
      </Center>
    );
  }

  const saveField = async (field, value) => {
    setSavingField(field);
    setErrors((current) => ({ ...current, [field]: null }));

    try {
      const normalizedValue =
        field === "phone" || field === "linkedinUrl" ? value.trim() : value;

      const updatedCandidate = await CandidatesService.updateCandidate(id, {
        [field]: normalizedValue,
      });
      setCandidate(updatedCandidate);
      return true;
    } catch (error) {
      setErrors((current) => ({ ...current, [field]: error.message }));
      onError({ message: error.message });
      return false;
    } finally {
      setSavingField(null);
    }
  };

  const handleUploadCv = async (file, setProgress) => {
    setIsUploadingCv(true);

    try {
      const updatedHistory = await CandidatesService.uploadCv(id, file);
      setCandidate((current) => ({
        ...current,
        cvHistory: updatedHistory,
      }));
      setProgress(100);
      onSuccess({ message: "CV uploaded successfully" });
      return true;
    } catch (error) {
      onError({ message: error.message });
      return false;
    } finally {
      setIsUploadingCv(false);
    }
  };

  const handleOpenCv = async (cv) => {
    const cvWindow = window.open("", "_blank");

    try {
      const url = await CandidatesService.getCandidateCvUrl(id, cv.id);

      if (cvWindow) {
        cvWindow.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (error) {
      cvWindow?.close();
      onError({ message: error.message });
    }
  };

  const handleSaveSkills = async (skills) => {
    setIsSavingSkills(true);

    try {
      const updatedSkills = await CandidatesService.updateSkills(id, skills);
      setCandidate((current) => ({
        ...current,
        skills: updatedSkills,
      }));
      const updatedCandidate = await CandidatesService.updateCandidate(id, {
        skills,
      });
      setCandidate(updatedCandidate);
      onSuccess({ message: "Skills updated" });
      return true;
    } catch (error) {
      onError({ message: error.message });
      return false;
    } finally {
      setIsSavingSkills(false);
    }
  };

  return (
    <>
      <Stack gap={theme.spacing.xs}>
        <Text
          component={Link}
          to={ROUTES.CANDIDATES}
          size="sm"
          td="none"
          c="dimmed"
          className={classes.backLink}
          onMouseEnter={(event) => {
            event.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.textDecoration = "none";
          }}
        >
          ← Candidates
        </Text>

        <Group justify="space-between" align="flex-start" gap="lg" wrap="wrap">
          <Group gap="md" align="center" wrap="nowrap">
            <Avatar
              size={56}
              radius="50%"
              color={theme.white}
              bg={theme.colors.indigo[6]}
              fontSize={18}
            >
              {`${candidate.firstName?.[0] || ""}${candidate.lastName?.[0] || ""}`}
            </Avatar>

            <Stack gap={theme.spacing.sm}>
              <Title order={2}>{fullName}</Title>
              <Group gap="md" wrap="wrap">
                <Group gap={6} wrap="nowrap" align="center">
                  <IconMail size={16} color={theme.colors.gray[5]} />
                  <Text size="sm" color={theme.colors.gray[6]}>
                    {candidate.email}
                  </Text>
                </Group>

                {candidate.phone ? (
                  <Group gap={6} wrap="nowrap">
                    <IconPhone size={16} color={theme.colors.gray[5]} />
                    <Text size="sm" color={theme.colors.gray[6]}>
                      {candidate.phone}
                    </Text>
                  </Group>
                ) : null}

                {normalizedLinkedinUrl ? (
                  <Group gap={6} wrap="nowrap">
                    <IconBrandLinkedin size={18} color={theme.colors.gray[5]} />
                    <Text
                      component="a"
                      href={normalizedLinkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                      td="none"
                      c="blue.7"
                      onMouseEnter={(event) => {
                        event.currentTarget.style.textDecoration = "underline";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.textDecoration = "none";
                      }}
                    >
                      {candidate.linkedinUrl}
                    </Text>
                  </Group>
                ) : null}
              </Group>
            </Stack>
          </Group>

          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            New Application
          </Button>
        </Group>

        <Tabs defaultValue="applications">
          <Tabs.List className={classes.tabsList}>
            <Tabs.Tab value="applications" className={classes.tab}>
              <Text span inherit className={classes.tabLabel}>
                Applications
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="profile" className={classes.tab}>
              <Text span inherit className={classes.tabLabel}>
                Profile
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="notes" className={classes.tab}>
              <Text span inherit className={classes.tabLabel}>
                Notes
              </Text>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="applications" pt="lg">
            <CandidateApplicationsList
              candidateId={id}
              refreshTrigger={refreshTrigger}
            />
          </Tabs.Panel>

          <Tabs.Panel value="profile" pt="lg">
            <CandidateProfileTab
              candidate={candidate}
              errors={errors}
              savingField={savingField}
              isUploadingCv={isUploadingCv}
              isSavingSkills={isSavingSkills}
              saveField={saveField}
              handleOpenCv={handleOpenCv}
              handleUploadCv={handleUploadCv}
              handleSaveSkills={handleSaveSkills}
              formatRelativeDate={formatRelativeDate}
            />
          </Tabs.Panel>

          <Tabs.Panel value="notes" pt="lg">
            <Card withBorder radius="xl" p="xl">
              <Text c="dimmed">
                Cross-application notes will be available here.
              </Text>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <AddApplicationDrawer
        opened={opened}
        onClose={() => {
          close();
          setRefreshTrigger((prev) => prev + 1);
        }}
        initialCandidateId={id}
        initialCandidate={candidate}
      />
    </>
  );
}
