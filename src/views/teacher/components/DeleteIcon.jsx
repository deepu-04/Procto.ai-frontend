import { Trash } from 'lucide-react';
import * as React from 'react';
import {
  Button,
  Dialog,
  IconButton,
  Box,
  Typography,
  Zoom,
} from '@mui/material';
import { useDeleteExamMutation } from 'src/slices/examApiSlice';
import { toast } from 'react-toastify';

// iOS alerts pop/zoom in rather than slide up
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Zoom ref={ref} {...props} timeout={250} />;
});

/**
 * @param {string} examId - MUST be MongoDB _id
 */
const DeleteIcon = ({ examId }) => {
  const [open, setOpen] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);
  const [deleteExam, { isLoading }] = useDeleteExamMutation();

  // Sync Dark Mode state for iOS authentic colors
  React.useEffect(() => {
    const checkDark = () => document.documentElement.classList.contains('dark');
    setIsDark(checkDark());

    const observer = new MutationObserver(() => setIsDark(checkDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleClickOpen = (e) => {
    e.stopPropagation();
    setOpen(true);
  };

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    setOpen(false);
  };

  // --- iOS Style Toast Helper ---
  const showIosToast = (message, type = 'success') => {
    toast(message, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      icon: type === 'success' ? '✅' : '⚠️',
      style: {
        background: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '100px',
        color: isDark ? '#FFFFFF' : '#000000',
        fontWeight: '600',
        fontSize: '0.95rem',
        boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.1)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
        padding: '12px 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        textAlign: 'center',
        margin: '16px auto 0',
      }
    });
  };

  const handleDelete = async (e) => {
    e.stopPropagation();

    if (!examId) {
      showIosToast('Invalid exam ID', 'error');
      return;
    }

    try {
      await deleteExam(examId).unwrap(); // 🔥 IMPORTANT
      showIosToast('Exam deleted successfully', 'success');
      setOpen(false);
      // RTK Query will auto-refetch if configured
    } catch (err) {
      console.error(err);
      showIosToast(err?.data?.message || 'Failed to delete exam', 'error');
    }
  };

  return (
    <>
      {/* iOS Style Action Button */}
      <IconButton
        size="small"
        onClick={handleClickOpen}
        onMouseDown={(e) => e.stopPropagation()}
        sx={{
          color: '#FF3B30',
          bgcolor: isDark ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 59, 48, 0.08)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 59, 48, 0.2)' : 'transparent',
          borderRadius: '10px',
          p: 0.8,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: '#FF3B30',
            color: '#FFFFFF',
            transform: 'scale(1.05)'
          }
        }}
      >
        <Trash size={16} strokeWidth={2.5} />
      </IconButton>

      {/* iOS Style Alert Dialog */}
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            width: '270px', // Authentic iOS Alert width
            borderRadius: '14px',
            bgcolor: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            backgroundImage: 'none',
            m: 0,
            overflow: 'hidden' // Keeps borders clean
          }
        }}
      >
        {/* iOS Alert Content */}
        <Box sx={{ p: 2.5, pb: 2, textAlign: 'center' }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: isDark ? '#FFFFFF' : '#000000', 
              fontWeight: 600, 
              fontSize: '17px', 
              mb: 0.5, 
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' 
            }}
          >
            Delete Exam?
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', 
              fontSize: '13px',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', 
              lineHeight: 1.3 
            }}
          >
            This action cannot be undone. All related data may be lost.
          </Typography>
        </Box>

        {/* iOS Alert Actions (Horizontal Split) */}
        <Box 
          sx={{
            display: 'flex',
            borderTop: `0.5px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(60, 60, 67, 0.29)'}`,
          }}
        >
          <Button
            onClick={handleClose}
            disabled={isLoading}
            fullWidth
            disableRipple
            sx={{
              py: 1.5,
              borderRadius: 0,
              color: '#007AFF', // iOS System Blue
              fontWeight: '400',
              textTransform: 'none',
              fontSize: '17px',
              borderRight: `0.5px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(60, 60, 67, 0.29)'}`,
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isLoading}
            fullWidth
            disableRipple
            sx={{
              py: 1.5,
              borderRadius: 0,
              color: '#FF3B30', // iOS System Red
              fontWeight: '600', // Destructive actions are bold in iOS
              textTransform: 'none',
              fontSize: '17px',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
            }}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default DeleteIcon;