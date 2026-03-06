import React from 'react';
import { Card, CardContent, Typography, Stack, Box, Chip, useTheme } from '@mui/material';
import {
  IconCircleCheckFilled,
  IconClockHour4,
  IconCalendarEvent,
  IconLockSquareRounded,
} from '@tabler/icons-react';

/* ===== IOS STATUS STYLE MAP ===== */
const statusConfig = {
  ACTIVE: {
    label: 'Live Now',
    color: '#10B981', // Emerald Green
    bg: '#D1FAE5',
    icon: <IconCircleCheckFilled size={16} />,
  },
  UPCOMING: {
    label: 'Upcoming',
    color: '#F59E0B', // Amber
    bg: '#FEF3C7',
    icon: <IconClockHour4 size={16} />,
  },
  COMPLETED: {
    label: 'Completed',
    color: '#64748B', // Slate Gray
    bg: '#F1F5F9',
    icon: <IconLockSquareRounded size={16} />,
  },
};

const DashboardCard = ({
  title,
  subtitle,
  children,
  action,
  footer,
  middlecontent,

  /* 🔥 EXAM PROPS */
  status, // "ACTIVE" | "UPCOMING" | "COMPLETED"
  liveDate,
  deadDate,
  disabled = false,

  /* Additional Styling Prop */
  sx,
}) => {
  const theme = useTheme();

  // Clean Date Formatter (e.g., "Oct 24, 10:00 AM")
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentStatus = statusConfig[status];

  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: '24px', // Deep iOS rounding
        border: '1px solid rgba(226, 232, 240, 0.8)', // Very subtle border
        boxShadow: '0 10px 30px rgba(0,0,0,0.04)', // Soft, diffused shadow
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        // Lift effect on hover (only if not disabled)
        '&:hover': disabled
          ? {}
          : {
              transform: 'translateY(-4px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            },
        ...sx,
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4 }, position: 'relative', zIndex: 1 }}>
        {/* ================= HEADER SECTION ================= */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={subtitle || status ? 3 : 2}
        >
          <Box>
            <Typography variant="h5" fontWeight="800" color="#1E293B" sx={{ mb: 0.5 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" fontWeight="500">
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* RIGHT SIDE ACTIONS / STATUS */}
          <Box display="flex" alignItems="center" gap={1}>
            {/* Status Chip (If Provided) */}
            {currentStatus && (
              <Chip
                icon={currentStatus.icon}
                label={currentStatus.label}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  backgroundColor: currentStatus.bg,
                  color: currentStatus.color,
                  px: 0.5,
                  '& .MuiChip-icon': { color: currentStatus.color },
                }}
              />
            )}

            {/* Top Right Action Button (e.g., Refresh Icon) */}
            {action && <Box ml={1}>{action}</Box>}
          </Box>
        </Stack>

        {/* ================= DATE & TIME (WIDGET STYLE) ================= */}
        {(liveDate || deadDate) && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
            {liveDate && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  bgcolor: '#F8FAFC',
                  p: 1.5,
                  borderRadius: '16px',
                  flex: 1,
                }}
              >
                <Box
                  sx={{
                    bgcolor: '#E0F2FE',
                    p: 1,
                    borderRadius: '12px',
                    display: 'flex',
                    color: '#0284C7',
                  }}
                >
                  <IconCalendarEvent size={20} stroke={2} />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight="600"
                    display="block"
                  >
                    Starts
                  </Typography>
                  <Typography variant="body2" fontWeight="700" color="#0F172A">
                    {formatDateTime(liveDate)}
                  </Typography>
                </Box>
              </Box>
            )}

            {deadDate && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  bgcolor: '#F8FAFC',
                  p: 1.5,
                  borderRadius: '16px',
                  flex: 1,
                }}
              >
                <Box
                  sx={{
                    bgcolor: '#FEE2E2',
                    p: 1,
                    borderRadius: '12px',
                    display: 'flex',
                    color: '#E11D48',
                  }}
                >
                  <IconClockHour4 size={20} stroke={2} />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight="600"
                    display="block"
                  >
                    Ends
                  </Typography>
                  <Typography variant="body2" fontWeight="700" color="#0F172A">
                    {formatDateTime(deadDate)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Stack>
        )}

        {/* ================= MAIN CONTENT ================= */}
        <Box>{children}</Box>
      </CardContent>

      {/* Optional Injections */}
      {middlecontent}
      {footer}

      {/* ================= COMPLETED / DISABLED OVERLAY (IOS FROSTED GLASS) ================= */}
      {disabled && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(6px)', // iOS Glass Effect
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 10,
            cursor: 'not-allowed',
          }}
        >
          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,0.8)',
              p: 2,
              borderRadius: '50%',
              mb: 1,
              boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
            }}
          >
            <IconCircleCheckFilled size={40} color="#94A3B8" />
          </Box>
          <Typography variant="h6" fontWeight="800" color="#475569">
            Exam Completed
          </Typography>
          <Typography variant="caption" color="#64748B" fontWeight="600">
            You have already taken this assessment.
          </Typography>
        </Box>
      )}
    </Card>
  );
};

export default DashboardCard;
