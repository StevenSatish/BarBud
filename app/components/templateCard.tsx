import React, { useMemo } from 'react';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/app/context/ThemeContext';
import type { Template } from '@/app/context/TemplateFoldersContext';

type TemplateCardProps = {
  template: Template;
};

export default function TemplateCard({ template }: TemplateCardProps) {
  const { theme } = useTheme();
  const lastPerformedLabel = useMemo(
    () => (template.lastPerformedAt ? formatRelativeTime(template.lastPerformedAt) : null),
    [template.lastPerformedAt]
  );
  const exercisesLine = useMemo(() => {
    const names = template.exercises?.map((ex) => ex.nameSnap).filter(Boolean) ?? [];
    return names.join(', ');
  }, [template.exercises]);

  return (
    <Box className={`rounded border border-outline-200 bg-${theme}-background px-3 py-3`}>
      <Text className='text-typography-900 text-lg font-semibold'>{template.templateName}</Text>

      <Box className='mt-2'>
        {exercisesLine ? (
          <Text className='text-typography-800'>{exercisesLine}</Text>
        ) : (
          <Text className='text-typography-700'>No exercises listed.</Text>
        )}
      </Box>

      {lastPerformedLabel ? <Text className='text-typography-700 mt-3'>{lastPerformedLabel}</Text> : null}
    </Box>
  );
}

function formatRelativeTime(ts?: Template['lastPerformedAt']) {
  if (!ts) return 'Never performed';
  let date: Date | null = null;
  try {
    // @ts-expect-error Timestamp from Firestore
    date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) date = null;
  } catch {
    date = null;
  }
  if (!date) return 'Never performed';

  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) return 'Just now';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Less than 1 hour ago';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

