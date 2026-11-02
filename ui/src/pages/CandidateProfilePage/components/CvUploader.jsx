import { Box, Button, Progress, Stack } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { theme } from "../../../theming/theme";

export function CvUploader({ onUpload, isUploading }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) {
      return;
    }

    setProgress(35);
    const success = await onUpload(file, setProgress);

    if (success) {
      setProgress(100);
      window.setTimeout(() => setProgress(0), 500);
    } else {
      setProgress(0);
    }
  };

  return (
    <Stack gap="xs">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          await handleFileUpload(file);
          event.currentTarget.value = "";
        }}
      />

      <Box
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={async (event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files?.[0];
          await handleFileUpload(file);
        }}
        style={{
          border: `1px solid ${
            isDragging ? theme.colors.indigo[5] : theme.colors.gray[3]
          }`,
          borderRadius: theme.radius.lg,
          padding: 0,
          backgroundColor: isDragging ? theme.colors.indigo[0] : theme.white,
        }}
      >
        <Button
          variant="subtle"
          color="gray.9"
          leftSection={<IconUpload size={18} color={theme.colors.gray[8]} />}
          fullWidth
          loading={isUploading}
          onClick={() => inputRef.current?.click()}
          styles={{
            root: {
              backgroundColor: "transparent",
            },
            inner: {
              justifyContent: "center",
            },
            label: {
              fontSize: "1rem",
              fontWeight: 500,
              color: theme.colors.gray[8],
            },
          }}
        >
          Upload new CV
        </Button>
      </Box>

      {progress > 0 ? <Progress value={progress} radius="xl" /> : null}
    </Stack>
  );
}
