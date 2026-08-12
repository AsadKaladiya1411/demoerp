import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, History, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useErpData, type Vendor, type VendorStatus, type VendorType } from '@/context/ErpContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type VendorForm = Omit<Vendor, 'id' | 'code' | 'createdDate' | 'updatedDate'>;

const vendorTypeOptions: VendorType[] = ['Raw Material', 'Packaging Material', 'Additional Material'];
const vendorStatusOptions: VendorStatus[] = ['Active', 'Inactive', 'Blocked'];

const emptyForm: VendorForm = {
  name: '',
  manufacturerName: '',
  vendorTypes: [],
  status: 'Active',
  contactPerson: '',
  mobile: '',
  alternateMobile: '',
  email: '',
  website: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  pinCode: '',
  gstNumber: '',
  panNumber: '',
  paymentTerms: '',
  leadTimeDays: 0,
  materialIds: [],
  documents: {
    gstCertificate: '',
    fssaiCertificate: '',
    coaSample: '',
    agreement: '',
    otherDocuments: '',
  },
};

const fileNames = (files: FileList | null) => Array.from(files || []).map(file => file.name).join(', ');

export function VendorManagement() {
  const { currentUser } = useAuth();
  const { vendors, vendorHistoryRecords, materials, addVendor, updateVendor, removeVendor } = useErpData();
  const canModify = currentUser.role === 'Boss' || currentUser.role === 'Employee B' || currentUser.role === 'Employee C';

  const [search, setSearch] = useState('');
  const [vendorTypeFilter, setVendorTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [detailsVendor, setDetailsVendor] = useState<Vendor | null>(null);
  const [historyVendor, setHistoryVendor] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState<VendorForm>(emptyForm);
  const [error, setError] = useState('');

  const filteredVendors = useMemo(() => (
    vendors.filter(vendor => {
      const query = search.toLowerCase();
      const matchesSearch = !query || `${vendor.name} ${vendor.manufacturerName}`.toLowerCase().includes(query);
      const matchesType = vendorTypeFilter === 'all' || vendor.vendorTypes.includes(vendorTypeFilter as VendorType);
      const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
      const matchesCity = !cityFilter || vendor.city.toLowerCase().includes(cityFilter.toLowerCase());
      return matchesSearch && matchesType && matchesStatus && matchesCity;
    })
  ), [cityFilter, search, statusFilter, vendorTypeFilter, vendors]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingVendor(null);
    setError('');
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setForm({
      name: vendor.name,
      manufacturerName: vendor.manufacturerName,
      vendorTypes: vendor.vendorTypes,
      status: vendor.status,
      contactPerson: vendor.contactPerson,
      mobile: vendor.mobile,
      alternateMobile: vendor.alternateMobile,
      email: vendor.email,
      website: vendor.website,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      country: vendor.country,
      pinCode: vendor.pinCode,
      gstNumber: vendor.gstNumber,
      panNumber: vendor.panNumber,
      paymentTerms: vendor.paymentTerms,
      leadTimeDays: vendor.leadTimeDays,
      materialIds: vendor.materialIds,
      documents: vendor.documents,
    });
    setError('');
    setOpen(true);
  };

  const toggleVendorType = (vendorType: VendorType) => {
    setForm(prev => ({
      ...prev,
      vendorTypes: prev.vendorTypes.includes(vendorType)
        ? prev.vendorTypes.filter(item => item !== vendorType)
        : [...prev.vendorTypes, vendorType],
    }));
  };

  const toggleMaterial = (materialId: string) => {
    setForm(prev => ({
      ...prev,
      materialIds: prev.materialIds.includes(materialId)
        ? prev.materialIds.filter(item => item !== materialId)
        : [...prev.materialIds, materialId],
    }));
  };

  const saveVendor = () => {
    const message = editingVendor
      ? updateVendor({ ...form, id: editingVendor.id, code: editingVendor.code, createdDate: editingVendor.createdDate, updatedDate: editingVendor.updatedDate })
      : addVendor(form);
    if (message) {
      setError(message);
      return;
    }
    resetForm();
    setOpen(false);
  };

  const deleteVendor = (vendor: Vendor) => {
    if (!canModify) return;
    if (!window.confirm('Delete this vendor?')) return;
    removeVendor(vendor.id);
  };

  const assignedMaterialNames = (vendor: Vendor) => vendor.materialIds
    .map(id => materials.find(material => material.id === id)?.name)
    .filter(Boolean)
    .join(', ') || '-';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Vendor Management</h2>
        {canModify && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Vendor
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="grid gap-3 md:grid-cols-5">
            <div className="flex items-center gap-2 md:col-span-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search vendor or manufacturer..." value={search} onChange={event => setSearch(event.target.value)} />
            </div>
            <Select value={vendorTypeFilter} onValueChange={setVendorTypeFilter}>
              <SelectTrigger><SelectValue placeholder="Vendor Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {vendorTypeOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {vendorStatusOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="City" value={cityFilter} onChange={event => setCityFilter(event.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Code</TableHead>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Vendor Type</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No vendors found.</TableCell>
                </TableRow>
              )}
              {filteredVendors.map(vendor => (
                <TableRow key={vendor.id}>
                  <TableCell>{vendor.code}</TableCell>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.manufacturerName}</TableCell>
                  <TableCell>{vendor.vendorTypes.join(', ')}</TableCell>
                  <TableCell>{vendor.contactPerson}</TableCell>
                  <TableCell>{vendor.mobile}</TableCell>
                  <TableCell>{vendor.status}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" onClick={() => setDetailsVendor(vendor)}><Eye className="h-4 w-4" /></Button>
                      {canModify && <Button size="icon" variant="outline" onClick={() => openEdit(vendor)}><Pencil className="h-4 w-4" /></Button>}
                      {canModify && <Button size="icon" variant="destructive" onClick={() => deleteVendor(vendor)}><Trash2 className="h-4 w-4" /></Button>}
                      <Button size="icon" variant="outline" onClick={() => setHistoryVendor(vendor)}><History className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Create Vendor'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Vendor Code</Label>
                  <Input readOnly className="bg-muted/60" value={editingVendor?.code || 'Auto Generated'} />
                </div>
                <div className="space-y-2">
                  <Label>Vendor Name</Label>
                  <Input value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Manufacturer Name</Label>
                  <Input value={form.manufacturerName} onChange={event => setForm(prev => ({ ...prev, manufacturerName: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(value: VendorStatus) => setForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {vendorStatusOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Vendor Type</Label>
                  <div className="flex flex-wrap gap-3 rounded-md border p-3">
                    {vendorTypeOptions.map(option => (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.vendorTypes.includes(option)} onChange={() => toggleVendorType(option)} />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Contact Information</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <InputField label="Contact Person" value={form.contactPerson} onChange={value => setForm(prev => ({ ...prev, contactPerson: value }))} />
                <InputField label="Mobile Number" value={form.mobile} onChange={value => setForm(prev => ({ ...prev, mobile: value }))} />
                <InputField label="Alternate Mobile" value={form.alternateMobile} onChange={value => setForm(prev => ({ ...prev, alternateMobile: value }))} />
                <InputField label="Email" value={form.email} onChange={value => setForm(prev => ({ ...prev, email: value }))} />
                <InputField label="Website" value={form.website} onChange={value => setForm(prev => ({ ...prev, website: value }))} />
              </div>
            </section>

            <section className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Address</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <InputField label="Address" value={form.address} onChange={value => setForm(prev => ({ ...prev, address: value }))} className="md:col-span-3" />
                <InputField label="City" value={form.city} onChange={value => setForm(prev => ({ ...prev, city: value }))} />
                <InputField label="State" value={form.state} onChange={value => setForm(prev => ({ ...prev, state: value }))} />
                <InputField label="Country" value={form.country} onChange={value => setForm(prev => ({ ...prev, country: value }))} />
                <InputField label="PIN Code" value={form.pinCode} onChange={value => setForm(prev => ({ ...prev, pinCode: value }))} />
              </div>
            </section>

            <section className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Business Information</h3>
              <div className="grid gap-4 md:grid-cols-4">
                <InputField label="GST Number" value={form.gstNumber} onChange={value => setForm(prev => ({ ...prev, gstNumber: value }))} />
                <InputField label="PAN Number" value={form.panNumber} onChange={value => setForm(prev => ({ ...prev, panNumber: value }))} />
                <InputField label="Payment Terms" value={form.paymentTerms} onChange={value => setForm(prev => ({ ...prev, paymentTerms: value }))} />
                <div className="space-y-2">
                  <Label>Lead Time (Days)</Label>
                  <Input type="number" value={form.leadTimeDays} onChange={event => setForm(prev => ({ ...prev, leadTimeDays: Number(event.target.value) || 0 }))} />
                </div>
              </div>
            </section>

            <section className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Materials</h3>
              <div className="grid gap-2 md:grid-cols-3">
                {materials.map(material => (
                  <label key={material.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <input type="checkbox" checked={form.materialIds.includes(material.id)} onChange={() => toggleMaterial(material.id)} />
                    <span>{material.name} ({material.type})</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Documents</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FileInput label="GST Certificate" value={form.documents.gstCertificate} onChange={value => setForm(prev => ({ ...prev, documents: { ...prev.documents, gstCertificate: value } }))} />
                <FileInput label="FSSAI Certificate" value={form.documents.fssaiCertificate} onChange={value => setForm(prev => ({ ...prev, documents: { ...prev.documents, fssaiCertificate: value } }))} />
                <FileInput label="COA Sample" value={form.documents.coaSample} onChange={value => setForm(prev => ({ ...prev, documents: { ...prev.documents, coaSample: value } }))} />
                <FileInput label="Agreement" value={form.documents.agreement} onChange={value => setForm(prev => ({ ...prev, documents: { ...prev.documents, agreement: value } }))} />
                <FileInput label="Other Documents" value={form.documents.otherDocuments} onChange={value => setForm(prev => ({ ...prev, documents: { ...prev.documents, otherDocuments: value } }))} />
              </div>
            </section>
          </div>

          {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setOpen(false); }}>Cancel</Button>
            <Button onClick={saveVendor}>{editingVendor ? 'Update' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detailsVendor)} onOpenChange={() => setDetailsVendor(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Vendor Details</DialogTitle></DialogHeader>
          {detailsVendor && (
            <div className="grid gap-3 md:grid-cols-2">
              <Detail label="Vendor Code" value={detailsVendor.code} />
              <Detail label="Vendor Name" value={detailsVendor.name} />
              <Detail label="Manufacturer" value={detailsVendor.manufacturerName} />
              <Detail label="Vendor Type" value={detailsVendor.vendorTypes.join(', ')} />
              <Detail label="Contact Person" value={detailsVendor.contactPerson} />
              <Detail label="Mobile" value={detailsVendor.mobile} />
              <Detail label="Email" value={detailsVendor.email} />
              <Detail label="City" value={detailsVendor.city} />
              <Detail label="GST Number" value={detailsVendor.gstNumber} />
              <Detail label="Payment Terms" value={detailsVendor.paymentTerms} />
              <Detail label="Lead Time" value={`${detailsVendor.leadTimeDays} days`} />
              <Detail label="Materials" value={assignedMaterialNames(detailsVendor)} />
              <Detail label="Documents" value={Object.values(detailsVendor.documents).filter(Boolean).join(', ') || '-'} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(historyVendor)} onOpenChange={() => setHistoryVendor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vendor History</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyVendor && vendorHistoryRecords.filter(record => record.vendorId === historyVendor.id).map(record => (
                <TableRow key={record.id}>
                  <TableCell>{record.actionDate}</TableCell>
                  <TableCell>{record.action}</TableCell>
                  <TableCell>{record.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function InputField({ label, value, onChange, className }: { label: string; value: string; onChange: (value: string) => void; className?: string }) {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      <Label>{label}</Label>
      <Input value={value} onChange={event => onChange(event.target.value)} />
    </div>
  );
}

function FileInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="file" multiple onChange={event => onChange(fileNames(event.target.files))} />
      <div className="text-sm text-muted-foreground">{value || 'No files selected'}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-medium">{value || '-'}</div>
    </div>
  );
}

export default VendorManagement;
