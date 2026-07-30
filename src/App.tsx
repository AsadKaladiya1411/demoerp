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
import { RmRequirement } from './pages/employee-b/RmRequirement';
import { PmRequirement } from './pages/employee-b/PmRequirement';

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
          <Route path="employee-b/rm-requirement" element={<RequirePermission permission="employeeBRm"><RmRequirement /></RequirePermission>} />
          <Route path="employee-b/pm-requirement" element={<RequirePermission permission="employeeBPm"><PmRequirement /></RequirePermission>} />
          <Route path="reports" element={<RequirePermission permission="reports"><Reports /></RequirePermission>} />
          <Route path="master-report" element={<RequirePermission permission="masterReport"><MasterReport /></RequirePermission>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
