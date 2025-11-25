import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography
} from "@mui/material";
import LibraryAddOutlinedIcon from "@mui/icons-material/LibraryAddOutlined";
import { toast } from "react-toastify";

interface OptionValueManagerProps {
  type: "option" | "value";
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  existingItems: string[];
  currentOptionIndex?: number | null;
  onSaveAndSelect?: (name: string) => void;
}

const OptionValueManager: React.FC<OptionValueManagerProps> = ({
  type,
  open,
  onClose,
  onSave,
  existingItems,
  onSaveAndSelect
}) => {
  const [newName, setNewName] = useState("");
  const [isDuplicate, setIsDuplicate] = useState(false);

  useEffect(() => {
    if (open) {
      setNewName("");
      setIsDuplicate(false);
    }
  }, [open]);

  const handleNameChange = (value: string) => {
    setNewName(value);
    const duplicate = existingItems.some(
      (item) => item.toLowerCase() === value.trim().toLowerCase()
    );
    setIsDuplicate(duplicate);
  };

  const handleSave = () => {
    if (!newName.trim() || isDuplicate) return;

    const trimmedName = newName.trim();
    onSave(trimmedName);

    if (onSaveAndSelect) {
      onSaveAndSelect(trimmedName);
    }

    toast.success(
      `${type === "option" ? "Option" : "Value"} "${trimmedName}" added successfully!`
    );
    onClose();
  };


  const getTitle = () => {
    return type === "option" ? "Add New Option" : "Add New Value";
  };

  const getHelperText = () => {
    return isDuplicate
      ? `This ${type} name already exists.`
      : " ";
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth onClose={onClose}>
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Enter {type} name:
        </Typography>
        <TextField
          fullWidth
          autoFocus
          value={newName}
          onChange={(e) => handleNameChange(e.target.value)}
          error={isDuplicate}
          helperText={getHelperText()}
          size="small"
          placeholder={`Enter ${type} name...`}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: "#272324" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!newName.trim() || isDuplicate}
          sx={{ background: "#fc4e15", color: "#fff" }}
        >
          <LibraryAddOutlinedIcon sx={{ mr: "5px", height: "18px" }} />
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OptionValueManager;