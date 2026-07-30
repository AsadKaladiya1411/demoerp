import { useState } from "react";
import { useErpData } from "@/context/ErpContext";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { motion } from "framer-motion";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";

export function Materials() {
  const {
    materials,
    addMaterial,
    updateMaterial,
    removeMaterial,
  } = useErpData();

  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);

  const [editing, setEditing] = useState(false);

  const [selectedId, setSelectedId] = useState("");

  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "Raw Material" as "Raw Material" | "Packaging Material",
    unit: "kg",
    supplier: "",
    shelfLife: 0,
    expiryRequired: false,
    stock: 0,
    minStock: 0,
    status: "Active" as "Active" | "Inactive",
  });

  const filtered = materials.filter((m) =>
    `${m.code} ${m.name} ${m.supplier}`.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({
      code: "",
      name: "",
      type: "Raw Material",
      unit: "kg",
      supplier: "",
      shelfLife: 0,
      expiryRequired: false,
      stock: 0,
      minStock: 0,
      status: "Active",
    });

    setEditing(false);
    setSelectedId("");
  };
    const handleSave = () => {
    if (!form.name.trim()) {
      alert("Material name is required");
      return;
    }
    if (!form.code.trim()) {
      alert("Material code is required");
      return;
    }

    if (editing) {
      updateMaterial({
        id: selectedId,
        code: form.code,
        name: form.name,
        type: form.type,
        unit: form.unit,
        supplier: form.supplier,
        shelfLife: form.shelfLife,
        expiryRequired: form.expiryRequired,
        stock: form.stock,
        minStock: form.minStock,
        status: form.status,
      });
    } else {
      addMaterial({
        id: Date.now().toString(),
        code: form.code,
        name: form.name,
        type: form.type,
        unit: form.unit,
        supplier: form.supplier,
        shelfLife: form.shelfLife,
        expiryRequired: form.expiryRequired,
        stock: form.stock,
        minStock: form.minStock,
        status: form.status,
      });
    }

    resetForm();
    setOpen(false);
  };

  const handleEdit = (material: typeof materials[number]) => {
    setEditing(true);
    setSelectedId(material.id);

    setForm({
      code: material.code,
      name: material.name,
      type: material.type,
      unit: material.unit,
      supplier: material.supplier,
      shelfLife: material.shelfLife,
      expiryRequired: material.expiryRequired,
      stock: material.stock ?? 0,
      minStock: material.minStock ?? 0,
      status: material.status,
    });

    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this material?")) removeMaterial(id);
  };

  return (
        <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Material Master
        </h2>

        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-muted-foreground" />

            <Input
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Minimum Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.code}</TableCell>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.type}</TableCell>
                  <TableCell>{m.unit}</TableCell>
                  <TableCell>{m.supplier}</TableCell>
                  <TableCell>{m.stock ?? 0}</TableCell>
                  <TableCell>{m.minStock ?? 0}</TableCell>
                  <TableCell>{m.status}</TableCell>

                  <TableCell className="text-right space-x-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(m)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Material" : "Add Material"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">

            <div>
              <Label>Material Code</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Material Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Material Type</Label>
              <select
                className="w-full border rounded-md p-2"
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as
                      | "Raw Material"
                      | "Packaging Material",
                  })
                }
              >
                <option>Raw Material</option>
                <option>Packaging Material</option>
              </select>
            </div>

            <div>
              <Label>Unit</Label>
              <Input
                value={form.unit}
                onChange={(e) =>
                  setForm({ ...form, unit: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Supplier</Label>
              <Input
                value={form.supplier}
                onChange={(e) =>
                  setForm({
                    ...form,
                    supplier: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Current Stock</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stock: Number(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <Label>Minimum Stock</Label>
              <Input
                type="number"
                value={form.minStock}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minStock: Number(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <Label>Status</Label>
              <select
                className="w-full border rounded-md p-2"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as "Active" | "Inactive",
                  })
                }
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              Cancel
            </Button>

            <Button onClick={handleSave}>
              {editing ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
