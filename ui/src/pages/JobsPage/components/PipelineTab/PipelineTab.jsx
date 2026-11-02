import React, { useState } from "react";
import { Group, Stack, ScrollArea, Box, Skeleton, Alert } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconInfoCircle } from "@tabler/icons-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { PipelineColumn } from "./PipelineColumn.jsx";
import { ApplicationCard } from "./ApplicationCard.jsx";
import { RejectionModal } from "./RejectionModal.jsx";
import { HireConfirmationModal } from "./HireConfirmationModal.jsx";

import {
  STAGES,
  dropAnimationConfig,
} from "../../../../constants/application.js";

export function PipelineTab({
  collapsedColumns,
  onToggleColumn,
  groupedApplications = {},
  isLoadingApplications,
  errorApplications,
  moveApplication,
  onRefreshApplications,
  isPipelineLocked = false,
}) {
  const [activeId, setActiveId] = useState(null);
  const [rejectionData, setRejectionData] = useState(null);
  const [hireData, setHireData] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (isLoadingApplications) {
    return (
      <Group
        align="flex-start"
        wrap="nowrap"
        gap="md"
        style={{ overflowX: "auto", paddingBottom: 16 }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Box key={i} w={280} mih={500}>
            <Skeleton height={40} mb="md" radius="md" />
            <Stack gap="sm">
              <Skeleton height={100} radius="md" />
              <Skeleton height={100} radius="md" />
            </Stack>
          </Box>
        ))}
      </Group>
    );
  }

  if (errorApplications) {
    return (
      <Alert color="red" title="Error" icon={<IconInfoCircle />}>
        {errorApplications}
      </Alert>
    );
  }

  const handleDragStart = (event) => {
    if (isPipelineLocked) return;
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (isPipelineLocked) {
      notifications.show({
        title: "Move Blocked",
        message: "Applications cannot be moved when the job is closed.",
        color: "orange",
      });
      return;
    }

    if (!over) return;

    const applicationId = active.id;
    const newStage = over.id;

    const allApps = Object.values(groupedApplications || {}).flat();
    const application = allApps.find((app) => app.id === applicationId);
    if (!application) return;

    if (application.stage === newStage) return;

    if (newStage === "rejected") {
      const candidateName = [
        application.candidate?.firstName,
        application.candidate?.lastName,
      ]
        .filter(Boolean)
        .join(" ");
      setRejectionData({
        applicationId,
        candidateName: candidateName || "the candidate",
        jobTitle: application.job?.title || "the position",
      });
    } else if (newStage === "hired") {
      if (application.stage !== "offer") {
        notifications.show({
          title: "Move Blocked",
          message:
            "Candidates can only be moved to Hired from the Offer stage.",
          color: "orange",
        });
        return;
      }

      // Intercept: open hire confirmation modal instead of calling API directly
      setHireData({ applicationId, application });
    } else {
      moveApplication(applicationId, newStage);
    }
  };

  const activeApplication = activeId
    ? Object.values(groupedApplications || {})
        .flat()
        .find((app) => app.id === activeId)
    : null;

  return (
    <Box>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea offsetScrollbars>
          <Group align="flex-start" wrap="nowrap" gap="md" pb="xl">
            {STAGES.map((stage) => (
              <PipelineColumn
                key={stage.id}
                id={stage.id}
                title={stage.label}
                count={groupedApplications[stage.id]?.length || 0}
                applications={groupedApplications[stage.id] || []}
                isCollapsed={collapsedColumns?.[stage.id]}
                onToggle={() => onToggleColumn(stage.id)}
                moveApplication={moveApplication}
                isPipelineLocked={isPipelineLocked}
                onHireRequest={(application) =>
                  setHireData({ applicationId: application.id, application })
                }
              />
            ))}
          </Group>
        </ScrollArea>

        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeApplication ? (
            <ApplicationCard
              application={activeApplication}
              isOverlay
              moveApplication={moveApplication}
              isPipelineLocked={isPipelineLocked}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <RejectionModal
        opened={!!rejectionData}
        onClose={() => setRejectionData(null)}
        applicationId={rejectionData?.applicationId}
        candidateName={rejectionData?.candidateName}
        jobTitle={rejectionData?.jobTitle}
        onConfirm={({
          reason,
          comment,
          emailMessage,
          sendEmail,
          emailSubject,
        }) => {
          moveApplication(
            rejectionData.applicationId,
            "rejected",
            reason,
            comment,
            emailMessage,
            sendEmail,
            emailSubject,
          );
          setRejectionData(null);
        }}
      />

      <HireConfirmationModal
        opened={!!hireData}
        onClose={() => setHireData(null)}
        application={hireData?.application}
        onSuccess={() => {
          setHireData(null);
          onRefreshApplications?.();
        }}
      />
    </Box>
  );
}
