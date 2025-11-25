import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, IconButton, Divider } from "@mui/material";
import { toast } from "react-toastify";
import LibraryAddOutlinedIcon from "@mui/icons-material/LibraryAddOutlined";
import { Edit, Delete } from "@mui/icons-material";
import API_URL from "../../../config";
import AddCategory from "./Add-Category";
import ConfirmDialog from "../../../General/General-Delete-Dialoge";
import { closeLoading, showLoading } from "../../../General/Loader";
import Swal from "sweetalert2";

const CategoriesPage: React.FC = () => {
  const title = "Category";
  const apiUrl = `${API_URL}/categories`;

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
  ];

  const fields = [{ key: "name", label: "Category Name" }];

  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<any>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage]);

  const fetchData = async () => {
    showLoading(3000);
    try {
      const res: any = await axios.get(
        `${apiUrl}?page=${page + 1}&per_page=${rowsPerPage}`
      );
      setData(res.data.data || res.data.items || []);
      setTotalRecords(res.data.pagination?.total || 0);
    } catch (err) {
    } finally {
      closeLoading()
    }
  };

  const handleOpenDialog = (item: any = null) => {
    if (item) {
      setEditingId(item.id);
      const init: any = {};
      fields.forEach((f) => (init[f.key] = item[f.key] || ""));
      setFormValues(init);
    } else {
      setEditingId(null);
      const init: any = {};
      fields.forEach((f) => (init[f.key] = ""));
      setFormValues(init);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId !== null) {
        await axios.put(`${apiUrl}/${editingId}`, formValues);
      } else {
        await axios.post(`${apiUrl}`, formValues);
        Swal.fire({
          icon: "success",
          title: "🎉 Category added successfully!",
          text: "Welcome back!",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: "#fff",
          color: "#333",
          backdrop: `rgba(0,0,0,0.4)`,
          showClass: {
            popup: "animate__animated animate__fadeInDown",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp",
          },
        });
      }
      setOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error saving data", { autoClose: 3000 });
    }
  };

  const handleDeleteRequest = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;

    try {
      await axios.delete(`${apiUrl}/${deleteId}`);
      Swal.fire({
        icon: "success",
        title: "🎉 Category deleted successfully!",
        text: "Welcome back!",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: "#fff",
        color: "#333",
        backdrop: `rgba(0,0,0,0.4)`,
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      });
      fetchData();
    } catch {
      toast.error("Failed to delete", { autoClose: 3000 });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Box>
      <Box sx={{
        display: "flex", flexDirection: { xs: "column", sm: "row-reverse" }, justifyContent: { xs: "flex-start", sm: "end" },
        alignItems: { xs: "stretch", sm: "center" }, gap: 1, mb: 2,
      }} >
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()} sx={{ width: { xs: "100%", sm: "auto" } }} >
          <LibraryAddOutlinedIcon sx={{ mr: 1 }} /> Add {title}
        </Button>
      </Box>

      <Paper sx={{ width: "100%", overflow: "hidden", boxShadow: 5 }} >
        <TableContainer sx={{ maxHeight: "calc(100vh - 250px)", height: "calc(100vh - 270px)" }}>
          <Table stickyHeader size="small" sx={{ "& .MuiTableCell-root": { borderBottom: "1px solid #e0e0e0" }, }} >
            <TableHead sx={{ backgroundColor: "#f5f5f5", "& .MuiTableCell-root": { fontWeight: "bold", fontSize: 14, height: "60px", textTransform: "uppercase" } }} >
              <TableRow>
                {columns.map((c) => (
                  <TableCell key={c.key} sx={{
                    backgroundColor: "#f5f5f5"
                  }}>{c.label}</TableCell>
                ))}
                <TableCell align="right" sx={{
                  backgroundColor: "#f5f5f5"
                }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id} hover sx={{
                  transition: "background-color 0.2s ease",
                  "&:hover": { backgroundColor: "#f5f5f5", cursor: "pointer", },
                }} >
                  {columns.map((c) => (
                    <TableCell key={c.key} sx={{ padding: "12px 16px" }}>
                      {row[c.key] || "-"}
                    </TableCell>
                  ))}

                  <TableCell align="right" sx={{ padding: "12px 16px" }}>
                    <IconButton color="primary" onClick={() => handleOpenDialog(row)} size="small" >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteRequest(row.id)} size="small" >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {data.length === 0 && (
                <TableRow sx={{ maxHeight: "calc(100vh - 330px)", height: "calc(100vh - 330px)" }}>
                  <TableCell colSpan={columns.length + 1} align="center">
                    No {title.toLowerCase()} found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        <TablePagination component="div" count={totalRecords} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[10, 20]} />
      </Paper>

      {open && (
        <AddCategory open={open} onClose={() => setOpen(false)} onSave={handleSave} formValues={formValues}
          setFormValues={setFormValues} fields={fields} editingId={editingId} title={title} />
      )}

      {deleteDialogOpen && (
        <ConfirmDialog open={deleteDialogOpen} title="Confirm Delete" message="Are you sure you want to delete this category?"
          onConfirm={confirmDelete} onClose={() => setDeleteDialogOpen(false)} confirmText="Delete" cancelText="Cancel" />
      )}
    </Box>
  );
};

export default CategoriesPage;