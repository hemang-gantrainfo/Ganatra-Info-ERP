import React, { useEffect, useState } from "react";
import axios from "axios";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, IconButton, Button, Box, Divider } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { toast } from "react-toastify";
import API_URL from "../../../config";
import LibraryAddOutlinedIcon from '@mui/icons-material/LibraryAddOutlined';
import AddBrands from "./Add-Brands";
import ConfirmDialog from "../../../General/General-Delete-Dialoge";
import Swal from "sweetalert2";
import { closeLoading, showLoading } from "../../../General/Loader";

interface Brand {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

const columns = [
    { key: "id", label: "Brand ID" },
    { key: "name", label: "Brand Name" },
];
const Brands: React.FC = () => {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        showLoading(3000);
        try {
            const res: any = await axios.get(`${API_URL}/brands`);
            setBrands(res.data.data.reverse() || []);
        } catch (err) {
        } finally {
            closeLoading()

        }
    };

    const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpenDialog = (brand: Brand | null = null) => {
        setEditingBrand(brand);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setEditingBrand(null);
        setOpenDialog(false);
    };

    const handleSave = async (brandNameToSave: string) => {
        if (!brandNameToSave.trim()) {
            toast.error("Brand name is required", { autoClose: 3000 });
            return;
        }

        try {
            if (editingBrand) {
                await axios.put(`${API_URL}/brands/${editingBrand.id}`, { name: brandNameToSave });
                Swal.fire({
                    icon: "success", title: "🎉 Brand updated successfully!", text: "Welcome back!", showConfirmButton: false,
                    timer: 3000, timerProgressBar: true, background: "#fff", color: "#333", backdrop: `rgba(0,0,0,0.4)`,
                    showClass: { popup: "animate__animated animate__fadeInDown", },
                    hideClass: { popup: "animate__animated animate__fadeOutUp", },
                });

            } else {
                await axios.post(`${API_URL}/brands`, { name: brandNameToSave });
                Swal.fire({
                    icon: "success", title: "🎉 Brand added successfully!", text: "Welcome back!", showConfirmButton: false, timer: 3000,
                    timerProgressBar: true, background: "#fff", color: "#333", backdrop: `rgba(0,0,0,0.4)`,
                    showClass: { popup: "animate__animated animate__fadeInDown", },
                    hideClass: { popup: "animate__animated animate__fadeOutUp", },
                });
            }
            handleCloseDialog();
            fetchBrands();
        } catch (err) {
            toast.error("Something went wrong", { autoClose: 3000 });
        }
    };

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const handleDeleteRequest = (id: number) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`${API_URL}/brands/${deleteId}`);
            Swal.fire({
                icon: "success", title: "🎉 Brand deleted successfully!", text: "Welcome back!", showConfirmButton: false, timer: 3000,
                timerProgressBar: true, background: "#fff", color: "#333", backdrop: `rgba(0,0,0,0.4)`,
                showClass: { popup: "animate__animated animate__fadeInDown", },
                hideClass: { popup: "animate__animated animate__fadeOutUp", },
            });
            fetchBrands();
        } catch (err) {
            toast.error("Failed to delete brand", { autoClose: 3000 });
        } finally {
            setDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <>
            <Box sx={{ width: { xs: "100%", sm: "auto" }, display: "flex", flexDirection: { xs: "column-reverse", sm: "row" }, justifyContent: "flex-end", alignItems: { xs: "stretch", sm: "center" }, gap: 1, mb: 2, }} >
                <Button variant="contained" color="primary" onClick={() => handleOpenDialog()} sx={{ width: { xs: "100%", sm: "auto" } }} >
                    <LibraryAddOutlinedIcon sx={{ mr: 1 }} /> Add New Brand
                </Button>
            </Box>

            <Paper sx={{ width: "100%", overflow: "hidden", boxShadow: 5 }} >
                <TableContainer sx={{ maxHeight: "calc(100vh - 250px)", height: "calc(100vh - 270px)" }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                {columns.map((c) => (
                                    <TableCell key={c.key} sx={{ fontWeight: "bold", background: "#f5f5f5", height: "60px" }}>
                                        {c.label || "-"}
                                    </TableCell>
                                ))}
                                <TableCell align="right" sx={{ fontWeight: "bold", background: "#f5f5f5", height: "60px" }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {brands.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((brand) => (
                                <TableRow key={brand.id}>
                                    <TableCell>{brand.id || "-"}</TableCell>
                                    <TableCell>{brand.name || "-"}</TableCell>
                                    <TableCell align="right">
                                        <IconButton color="primary" onClick={() => handleOpenDialog(brand)}>
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton color="error" onClick={() => handleDeleteRequest(brand.id)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {brands.length === 0 && (
                                <TableRow sx={{ maxHeight: "calc(100vh - 330px)", height: "calc(100vh - 330px)" }}>
                                    <TableCell colSpan={columns.length + 1} align="center">
                                        No brands found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Divider />
                <TablePagination component="div" count={brands.length} page={page} onPageChange={handleChangePage} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleChangeRowsPerPage} rowsPerPageOptions={[10, 20]} />
            </Paper>

            {openDialog && (
                <AddBrands open={openDialog} onClose={handleCloseDialog} onSave={handleSave} editingBrandName={editingBrand?.name} />
            )}

            {deleteDialogOpen && (
                <ConfirmDialog open={deleteDialogOpen} title="Confirm Delete" message="Are you sure you want to delete this brand?"
                    onConfirm={confirmDelete} onClose={() => setDeleteDialogOpen(false)} confirmText="Delete" cancelText="Cancel" />
            )}
        </>
    );
};

export default Brands;