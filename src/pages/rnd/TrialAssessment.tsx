import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, Microscope, Save } from 'lucide-react';
import { getTrialById, getTrialRecords, saveTrialAssessment, type SavedTrialRecord, type TrialAssessmentRecord, type TrialAssessmentVerdict } from './rndStore';

const verdictOptions: TrialAssessmentVerdict[] = ['Pass', 'Fail', 'Need Modification', 'Approved for Next Stage'];

const createEmptyAssessment = (): TrialAssessmentRecord => ({
  tasteScore: '',
  tasteRemarks: '',
  textureScore: '',
  textureRemarks: '',
  smellScore: '',
  smellRemarks: '',
  colourScore: '',
  colourRemarks: '',
  ph: '',
  phAfter30Minutes: '',
  foamingPercent: '',
  solubility: '',
  verdict: 'Pass',
  nextAction: '',
  generalRemarks: '',
});

const formatTrialLabel = (trial: SavedTrialRecord) => `${trial.trialId} - ${trial.baseFormulaName}`;

export function TrialAssessment() {
  const { currentUser } = useAuth();
  const [trials, setTrials] = useState<SavedTrialRecord[]>(() => getTrialRecords());
  const [selectedTrialId, setSelectedTrialId] = useState(() => getTrialRecords()[0]?.trialId || '');
  const [assessment, setAssessment] = useState<TrialAssessmentRecord>(createEmptyAssessment);
  const [message, setMessage] = useState('');

  const canMutate = currentUser.role === 'Employee A';
  const selectedTrial = useMemo(() => trials.find(trial => trial.trialId === selectedTrialId) || null, [selectedTrialId, trials]);

  const refreshTrials = () => {
    const latestTrials = getTrialRecords();
    setTrials(latestTrials);
    return latestTrials;
  };

  useEffect(() => {
    if (!selectedTrialId || !selectedTrial) {
      setAssessment(createEmptyAssessment());
      return;
    }

    setAssessment(selectedTrial.assessment ? { ...selectedTrial.assessment } : createEmptyAssessment());
  }, [selectedTrial, selectedTrialId]);

  const updateAssessment = <K extends keyof TrialAssessmentRecord>(field: K, value: TrialAssessmentRecord[K]) => {
    setAssessment(previous => ({ ...previous, [field]: value }));
  };

  const handleTrialChange = (trialId: string) => {
    setSelectedTrialId(trialId);
    const nextTrial = getTrialById(trialId);
    setAssessment(nextTrial?.assessment ? { ...nextTrial.assessment } : createEmptyAssessment());
    setMessage('');
  };

  const saveAssessment = () => {
    if (!selectedTrial) {
      setMessage('Select a trial first.');
      return;
    }

    saveTrialAssessment(selectedTrial.trialId, assessment);
    const latestTrials = refreshTrials();
    const latestTrial = latestTrials.find(trial => trial.trialId === selectedTrial.trialId) || selectedTrial;
    setSelectedTrialId(latestTrial.trialId);
    setMessage(`Assessment saved for ${latestTrial.trialId}.`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <Microscope className="h-3.5 w-3.5" />
          Research & Development
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Trial Assessment</h2>
          <p className="text-sm text-muted-foreground">One assessment stays linked to one trial inside the R&D workspace.</p>
        </div>
      </div>

      {!canMutate && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Boss access is view only. Trial assessment fields cannot be changed.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Trial Link</CardTitle>
            <CardDescription>Choose a saved trial. The assessment is always stored with that trial record.</CardDescription>
          </div>
          {canMutate && (
            <Button onClick={saveAssessment} disabled={!selectedTrialId} className="w-fit">
              <Save className="mr-2 h-4 w-4" />
              Save Assessment
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{message}</div>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2 xl:col-span-2">
              <label className="text-sm font-medium">Trial</label>
              <Select value={selectedTrialId} onValueChange={handleTrialChange} disabled={trials.length === 0 || !canMutate && !selectedTrialId ? false : false}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trial" />
                </SelectTrigger>
                <SelectContent>
                  {trials.map(trial => (
                    <SelectItem key={trial.trialId} value={trial.trialId}>
                      {formatTrialLabel(trial)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Trial Number</label>
              <Input value={selectedTrial?.trialNumber || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Base Formula</label>
              <Input value={selectedTrial?.baseFormulaName || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input value={selectedTrial?.date || ''} disabled />
            </div>
            <div className="space-y-2 xl:col-span-3">
              <label className="text-sm font-medium">Objective</label>
              <Input value={selectedTrial?.objective || ''} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Fields</CardTitle>
          <CardDescription>All scoring, remarks, and observations stay attached to the selected trial.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Taste Score</label>
              <Input type="number" min="0" max="10" value={assessment.tasteScore} onChange={event => updateAssessment('tasteScore', event.target.value)} disabled={!canMutate || !selectedTrial} />
            </div>
            <div className="space-y-2 xl:col-span-3">
              <label className="text-sm font-medium">Taste Remarks</label>
              <Input value={assessment.tasteRemarks} onChange={event => updateAssessment('tasteRemarks', event.target.value)} disabled={!canMutate || !selectedTrial} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Texture Score</label>
              <Input type="number" min="0" max="10" value={assessment.textureScore} onChange={event => updateAssessment('textureScore', event.target.value)} disabled={!canMutate || !selectedTrial} />
            </div>
            <div className="space-y-2 xl:col-span-3">
              <label className="text-sm font-medium">Texture Remarks</label>
              <Input value={assessment.textureRemarks} onChange={event => updateAssessment('textureRemarks', event.target.value)} disabled={!canMutate || !selectedTrial} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Smell Score</label>
              <Input type="number" min="0" max="10" value={assessment.smellScore} onChange={event => updateAssessment('smellScore', event.target.value)} disabled={!canMutate || !selectedTrial} />
            </div>
            <div className="space-y-2 xl:col-span-3">
              <label className="text-sm font-medium">Smell Remarks</label>
              <Input value={assessment.smellRemarks} onChange={event => updateAssessment('smellRemarks', event.target.value)} disabled={!canMutate || !selectedTrial} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Colour Score</label>
              <Input type="number" min="0" max="10" value={assessment.colourScore} onChange={event => updateAssessment('colourScore', event.target.value)} disabled={!canMutate || !selectedTrial} />
            </div>
            <div className="space-y-2 xl:col-span-3">
              <label className="text-sm font-medium">Colour Remarks</label>
              <Input value={assessment.colourRemarks} onChange={event => updateAssessment('colourRemarks', event.target.value)} disabled={!canMutate || !selectedTrial} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">pH</label>
              <Input value={assessment.ph} onChange={event => updateAssessment('ph', event.target.value)} disabled={!canMutate || !selectedTrial} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">pH After 30 Minutes</label>
              <Input value={assessment.phAfter30Minutes} onChange={event => updateAssessment('phAfter30Minutes', event.target.value)} disabled={!canMutate || !selectedTrial} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Foaming %</label>
              <Input value={assessment.foamingPercent} onChange={event => updateAssessment('foamingPercent', event.target.value)} disabled={!canMutate || !selectedTrial} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Solubility</label>
              <Input value={assessment.solubility} onChange={event => updateAssessment('solubility', event.target.value)} disabled={!canMutate || !selectedTrial} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Verdict</label>
              <Select value={assessment.verdict} onValueChange={value => updateAssessment('verdict', value as TrialAssessmentVerdict)} disabled={!canMutate || !selectedTrial}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {verdictOptions.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 xl:col-span-2">
              <label className="text-sm font-medium">Next Action</label>
              <Input value={assessment.nextAction} onChange={event => updateAssessment('nextAction', event.target.value)} disabled={!canMutate || !selectedTrial} />
            </div>
            <div className="space-y-2 xl:col-span-4">
              <label className="text-sm font-medium">General Remarks</label>
              <textarea
                className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={assessment.generalRemarks}
                onChange={event => updateAssessment('generalRemarks', event.target.value)}
                disabled={!canMutate || !selectedTrial}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Linked Trial Overview
          </CardTitle>
          <CardDescription>Each saved trial carries at most one assessment record.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trial ID</TableHead>
                  <TableHead>Base Formula</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assessment Status</TableHead>
                  <TableHead>Verdict</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No saved trials found.
                    </TableCell>
                  </TableRow>
                ) : (
                  trials.map(trial => (
                    <TableRow key={trial.trialId}>
                      <TableCell className="font-medium">{trial.trialId}</TableCell>
                      <TableCell>{trial.baseFormulaName}</TableCell>
                      <TableCell>{trial.status}</TableCell>
                      <TableCell>{trial.assessment ? 'Saved' : 'Pending'}</TableCell>
                      <TableCell>{trial.assessment?.verdict || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}