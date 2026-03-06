import { Trash } from 'lucide-react';
import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { useDeleteExamMutation } from 'src/slices/examApiSlice';
import { toast } from 'react-toastify';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * @param {string} examId - MUST be MongoDB _id
 */
const DeleteIcon = ({ examId }) => {
  const [open, setOpen] = React.useState(false);
  const [deleteExam, { isLoading }] = useDeleteExamMutation();

  const handleClickOpen = (e) => {
    e.stopPropagation();
    setOpen(true);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setOpen(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();

    if (!examId) {
      toast.error('Invalid exam ID');
      return;
    }

    try {
      await deleteExam(examId).unwrap(); // 🔥 IMPORTANT
      toast.success('Exam deleted successfully');
      setOpen(false);
      // RTK Query will auto-refetch if configured
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || 'Failed to delete exam');
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        size="small"
        onClick={handleClickOpen}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Trash size={16} />
      </Button>

      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="delete-exam-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>Delete Exam?</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-exam-dialog">
            This action cannot be undone. All related data may be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeleteIcon;
