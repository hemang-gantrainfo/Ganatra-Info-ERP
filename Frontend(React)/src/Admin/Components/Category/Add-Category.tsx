import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface AddCategoryProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  formValues: any;
  setFormValues: (values: any) => void;
  fields: { key: string; label: string }[];
  editingId: number | null;
  title: string;
}

const AddCategory: React.FC<AddCategoryProps> = ({ open, onClose, onSave, formValues, setFormValues, fields, editingId, title }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: "600", display: "flex", justifyContent: "space-between", alignItems: "center", }} >
        {editingId ? `Edit ${title}` : `Add ${title}`}
        <IconButton onClick={onClose} sx={{ color: "gray" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {fields.map((f) => (
          <TextField key={f.key} label={f.label} variant="outlined" fullWidth sx={{ mt: 2 }} value={formValues[f.key] || ""} onChange={(e) => setFormValues({ ...formValues, [f.key]: e.target.value })} />
        ))}
      </DialogContent>
      <DialogActions>
        <Button sx={{ color: "#272324" }} onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} variant="contained" sx={{ color: "#fff", background: "#fc4e15" }}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCategory;
