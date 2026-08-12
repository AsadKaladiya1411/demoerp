import { useErpData } from '@/context/ErpContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Package, Box, Tag, FileText, Factory, Settings, CheckCircle, Clock } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function Dashboard() {
  const { categories, products, flavours, recipes, manufacturers, materials, productionPlans } = useErpData();

  const pendingApprovals = productionPlans.filter(p => p.status === 'Pending Approval').length;
  const trialProductions = productionPlans.filter(p => p.type === 'Trial').length;

  const statCards = [
    { title: 'Categories', value: categories.length, icon: Tag },
    { title: 'Products', value: products.length, icon: Package },
    { title: 'Flavours', value: flavours.length, icon: Box },
    { title: 'Recipes', value: recipes.length, icon: FileText },
    { title: 'Manufacturers', value: manufacturers.length, icon: Factory },
    { title: 'Materials', value: materials.length, icon: Settings },
    { title: 'Pending Approval', value: pendingApprovals, icon: Clock, alert: true },
    { title: 'Trial Production', value: trialProductions, icon: CheckCircle },
  ];

  const monthlyData = productionPlans.reduce<{ name: string; value: number }[]>((acc, plan) => {
    const month = new Date(plan.mfgDate).toLocaleString('default', { month: 'short' });
    const existing = acc.find(item => item.name === month);
    if (existing) existing.value += plan.quantity;
    else acc.push({ name: month, value: plan.quantity });
    return acc;
  }, []);

  const pieData = categories.map((cat, _index) => ({
    name: cat.name,
    value: products.filter(p => p.categoryId === cat.id).length
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h2>
        <div className="flex gap-2">
          <Button asChild><Link to="/masters/products">Add Product</Link></Button>
          <Button asChild variant="outline"><Link to="/recipes">Create Recipe</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={stat.alert && stat.value > 0 ? "border-destructive" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Monthly Production (kg)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Products per Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Production Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left font-medium">
                  <th className="p-4">Batch</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Mfg Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {productionPlans.map((plan) => {
                  const product = products.find(p => p.id === plan.productId)?.name;
                  return (
                    <tr key={plan.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 font-medium">{plan.batch}</td>
                      <td className="p-4">{product}</td>
                      <td className="p-4">{plan.mfgDate}</td>
                      <td className="p-4">{plan.type}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          plan.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          plan.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {plan.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
