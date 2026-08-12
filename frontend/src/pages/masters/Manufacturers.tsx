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

export function Manufacturers() {
  const {
    manufacturers,
    addManufacturer,
    updateManufacturer,
    removeManufacturer,
  } = useErpData();

  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);

  const [editing, setEditing] = useState(false);

  const [selectedId, setSelectedId] = useState("");

  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    gst: "",
    address: "",
    email: "",
    mobile: "",
    status: "Active" as "Active" | "Inactive",
  });

  const filtered = manufacturers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({
      name: "",
      contactPerson: "",
      gst: "",
      address: "",
      email: "",
      mobile: "",
      status: "Active",
    });

    setEditing(false);
    setSelectedId("");
  };
    const handleSave = () => {
    if (!form.name.trim()) {
      alert("Manufacturer name is required");
      return;
    }

    if (editing) {
      updateManufacturer({
        id: selectedId,
        name: form.name,
        contactPerson: form.contactPerson,
        gst: form.gst,
        address: form.address,
        email: form.email,
        mobile: form.mobile,
        status: form.status,
      });
    } else {
      addManufacturer({
        id: Date.now().toString(),
        name: form.name,
        contactPerson: form.contactPerson,
        gst: form.gst,
        address: form.address,
        email: form.email,
        mobile: form.mobile,
        status: form.status,
      });
    }

    resetForm();
    setOpen(false);
  };

  const handleEdit = (manufacturer: typeof manufacturers[number]) => {
    setEditing(true);
    setSelectedId(manufacturer.id);

    setForm({
      name: manufacturer.name,
      contactPerson: manufacturer.contactPerson,
      gst: manufacturer.gst,
      address: manufacturer.address,
      email: manufacturer.email,
      mobile: manufacturer.mobile,
      status: manufacturer.status,
    });

    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this manufacturer?")) return;

    removeManufacturer(id);
  };

  return (
        <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Manufacturers
        </h2>

        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Manufacturer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-muted-foreground" />

            <Input
              placeholder="Search manufacturers..."
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
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.contactPerson}</TableCell>
                  <TableCell>{m.gst}</TableCell>
                  <TableCell>{m.mobile}</TableCell>
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
              {editing ? "Edit Manufacturer" : "Add Manufacturer"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">

            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Contact Person</Label>
              <Input
                value={form.contactPerson}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contactPerson: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>GST</Label>
              <Input
                value={form.gst}
                onChange={(e) =>
                  setForm({
                    ...form,
                    gst: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Mobile</Label>
              <Input
                value={form.mobile}
                onChange={(e) =>
                  setForm({
                    ...form,
                    mobile: e.target.value,
                  })
                }
              />
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