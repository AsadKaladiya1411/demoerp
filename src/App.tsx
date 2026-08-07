import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

import { Dashboard } from './pages/Dashboard';
import { Categories } from './pages/masters/Categories';
import { Products } from './pages/masters/Products';
import { ProductDetails } from './pages/masters/ProductDetails';
import { FlavourDetails } from './pages/masters/FlavourDetails';
import { AssortedConfiguration } from './pages/masters/AssortedConfiguration';
import { ManageFlavours } from './pages/masters/ManageFlavours';
import { Flavours } from './pages/masters/Flavours';
import { Manufacturers } from './pages/masters/Manufacturers';
import { Materials } from './pages/masters/Materials';
import { Reports } from './pages/Reports';
import { MasterReport } from './pages/MasterReport';
import { RequirePermission } from './components/auth/RequirePermission';
import { RecipeManagement } from './pages/RecipeManagement';
import { PendingSampleReceipts } from './pages/employee-a/PendingSampleReceipts';
import { RmRequirement } from './pages/employee-b/RmRequirement';
import { PmRequirement } from './pages/employee-b/PmRequirement';
import { RndSampleRequirement } from './pages/employee-b/RndSampleRequirement';
import { EmployeeBMasterReport } from './pages/employee-b/EmployeeBMasterReport';
import { GoodsReceipt } from './pages/employee-c/GoodsReceipt';
import { ProductionIssue } from './pages/employee-c/ProductionIssue';
import { ProductionReturn } from './pages/employee-c/ProductionReturn';
import { PendingMaterialTests } from './pages/employee-d/PendingMaterialTests';
import { VendorManagement } from './pages/masters/VendorManagement';
import { RndDashboard } from './pages/rnd/RndDashboard';
import { SampleInventory } from './pages/rnd/SampleInventory';
import { BaseFormulation } from './pages/rnd/BaseFormulation';
import { TrialWorksheet } from './pages/rnd/TrialWorksheet';
import { TrialAssessment } from './pages/rnd/TrialAssessment';
import { TrialHistory } from './pages/rnd/TrialHistory';
import { FormulaLibrary } from './pages/rnd/FormulaLibrary';
import { RndReports } from './pages/rnd/RndReports';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<RequirePermission permission="dashboard"><Dashboard /></RequirePermission>} />
          <Route path="masters/categories" element={<RequirePermission permission="categories"><Categories /></RequirePermission>} />
          <Route path="masters/products" element={<RequirePermission permission="products"><Products /></RequirePermission>} />
          <Route path="masters/products/:id" element={<RequirePermission permission="products"><ProductDetails /></RequirePermission>} />
          <Route path="masters/products/:productId/assorted-configuration" element={<RequirePermission permission="assortedConfiguration"><AssortedConfiguration /></RequirePermission>} />
          <Route path="masters/products/:id/flavours" element={<RequirePermission permission="products"><ManageFlavours /></RequirePermission>} />
          <Route path="masters/products/:productId/flavours/:flavourId" element={<RequirePermission permission="recipes"><FlavourDetails /></RequirePermission>} />
          <Route path="masters/flavours" element={<RequirePermission permission="products"><Flavours /></RequirePermission>} />
          <Route path="masters/manufacturers" element={<RequirePermission permission="manufacturers"><Manufacturers /></RequirePermission>} />
          <Route path="masters/materials" element={<RequirePermission permission="materials"><Materials /></RequirePermission>} />
          <Route path="masters/vendors" element={<RequirePermission permission="vendors"><VendorManagement /></RequirePermission>} />
          <Route path="recipes" element={<RequirePermission permission="recipes"><RecipeManagement /></RequirePermission>} />
          <Route path="employee-a/sample-inventory" element={<RequirePermission permission="employeeASampleInventory"><PendingSampleReceipts /></RequirePermission>} />
          <Route path="employee-b/rm-requirement" element={<RequirePermission permission="employeeBRm"><RmRequirement /></RequirePermission>} />
          <Route path="employee-b/pm-requirement" element={<RequirePermission permission="employeeBPm"><PmRequirement /></RequirePermission>} />
          <Route path="employee-b/rnd-sample-requirement" element={<RequirePermission permission="employeeBSampleRequirement"><RndSampleRequirement /></RequirePermission>} />
          <Route path="employee-b/master-report" element={<RequirePermission permission="employeeBMasterReport"><EmployeeBMasterReport /></RequirePermission>} />
          <Route path="employee-c/goods-receipt" element={<RequirePermission permission="employeeCGrn"><GoodsReceipt /></RequirePermission>} />
          <Route path="employee-c/goods-receipt/:materialType/:sourceId" element={<RequirePermission permission="employeeCGrn"><GoodsReceipt /></RequirePermission>} />
          <Route path="employee-c/goods-receipt/:materialType/:sourceId/:lineType" element={<RequirePermission permission="employeeCGrn"><GoodsReceipt /></RequirePermission>} />
          <Route path="employee-c/production-issue" element={<RequirePermission permission="employeeCIssue"><ProductionIssue /></RequirePermission>} />
          <Route path="employee-c/production-issue/:materialId" element={<RequirePermission permission="employeeCIssue"><ProductionIssue /></RequirePermission>} />
          <Route path="employee-c/production-return" element={<RequirePermission permission="employeeCReturn"><ProductionReturn /></RequirePermission>} />
          <Route path="employee-c/production-return/:issueId" element={<RequirePermission permission="employeeCReturn"><ProductionReturn /></RequirePermission>} />
          <Route path="employee-d/pending-material-tests" element={<RequirePermission permission="employeeDPendingTests"><PendingMaterialTests /></RequirePermission>} />
          <Route path="inventory-movement" element={<RequirePermission permission="inventoryMovement"><Reports /></RequirePermission>} />
          <Route path="reports" element={<RequirePermission permission="reports"><Reports /></RequirePermission>} />
          <Route path="master-report" element={<RequirePermission permission="masterReport"><MasterReport /></RequirePermission>} />
          <Route path="rnd" element={<RequirePermission permission="rnd"><RndDashboard /></RequirePermission>} />
          <Route path="rnd/sample-inventory" element={<RequirePermission permission="rnd"><SampleInventory /></RequirePermission>} />
          <Route path="rnd/base-formulation" element={<RequirePermission permission="rnd"><BaseFormulation /></RequirePermission>} />
          <Route path="rnd/trial-worksheet" element={<RequirePermission permission="rnd"><TrialWorksheet /></RequirePermission>} />
          <Route path="rnd/trial-assessment" element={<RequirePermission permission="rnd"><TrialAssessment /></RequirePermission>} />
          <Route path="rnd/trial-history" element={<RequirePermission permission="rnd"><TrialHistory /></RequirePermission>} />
          <Route path="rnd/formula-library" element={<RequirePermission permission="rnd"><FormulaLibrary /></RequirePermission>} />
          <Route path="rnd/reports" element={<RequirePermission permission="rnd"><RndReports /></RequirePermission>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
