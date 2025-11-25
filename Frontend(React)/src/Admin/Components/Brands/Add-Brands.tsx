import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";

interface AddBrandsProps {
    open: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    editingBrandName?: string;
    title?: string;
}

const AddBrands: React.FC<AddBrandsProps> = ({ open, onClose, onSave, editingBrandName = "", title = "Brand" }) => {
    const [brandName, setBrandName] = useState(editingBrandName);

    useEffect(() => {
        setBrandName(editingBrandName);
    }, [editingBrandName]);

    const handleSave = () => {
        if (!brandName.trim()) return;
        onSave(brandName.trim());
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 600 }}>{editingBrandName ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
            <DialogContent>
                <TextField label={`${title} Name`} value={brandName} onChange={(e) => setBrandName(e.target.value)} fullWidth margin="dense" />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} sx={{ color: "#272324" }}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" sx={{ color: "#fff", background: "#fc4e15" }}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddBrands;
