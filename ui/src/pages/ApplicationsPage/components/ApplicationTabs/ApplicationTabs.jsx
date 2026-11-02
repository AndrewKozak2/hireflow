import { Badge, Tabs } from "@mantine/core";
import { CommentsTab } from "./tabs/CommentsTab";
import { OverviewTab } from "./tabs/OverviewTab";
import { ScoreCardTab } from "./tabs/ScoreCardTab";
import { TimelineTab } from "./tabs/TimelineTab";

export function ApplicationTabs({ application, onRefresh }) {
  const commentCount = application?.comments?.length ?? 0;

  return (
    <Tabs defaultValue="overview">
      <Tabs.List>
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab
          value="comments"
          rightSection={
            commentCount > 0 ? (
              <Badge size="xs" variant="filled" color="blue" circle>
                {commentCount}
              </Badge>
            ) : null
          }
        >
          Comments
        </Tabs.Tab>
        <Tabs.Tab value="timeline">Timeline</Tabs.Tab>
        <Tabs.Tab value="scorecard">Score Card</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="overview" pt="md">
        <OverviewTab application={application} onRefresh={onRefresh} />
      </Tabs.Panel>
      <Tabs.Panel value="comments" pt="md">
        <CommentsTab application={application} onRefresh={onRefresh} />
      </Tabs.Panel>
      <Tabs.Panel value="timeline" pt="md">
        <TimelineTab />
      </Tabs.Panel>
      <Tabs.Panel value="scorecard" pt="md">
        <ScoreCardTab />
      </Tabs.Panel>
    </Tabs>
  );
}
