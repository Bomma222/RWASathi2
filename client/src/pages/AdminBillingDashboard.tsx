import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

export default function AdminBillingDashboard() {
  const billingModules = [
    {
      title: 'Billing Summary',
      description: 'View and manage monthly bills, record payments, and track dues',
      icon: 'fas fa-chart-bar',
      href: '/billing/summary',
      color: 'bg-blue-500'
    },
    {
      title: 'Water Meter Readings',
      description: 'Enter monthly water meter readings and auto-calculate bills',
      icon: 'fas fa-tint',
      href: '/billing/readings',
      color: 'bg-cyan-500'
    },
    {
      title: 'Billing Configuration',
      description: 'Configure billing fields, rates, and charge structures',
      icon: 'fas fa-cog',
      href: '/billing/fields',
      color: 'bg-purple-500'
    },
    {
      title: 'Payment Management',
      description: 'Record payments received and manage dues collection',
      icon: 'fas fa-receipt',
      href: '/billing/payments',
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Billing Management</h1>
        <p className="text-gray-600">Complete billing system for RWA management</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {billingModules.map((module, index) => (
          <Link key={index} href={module.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${module.color} text-white`}>
                    <i className={`${module.icon} text-xl`}></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{module.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{module.description}</p>
                    <Button variant="outline" size="sm">
                      Open Module
                      <i className="fas fa-arrow-right ml-2"></i>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common billing tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/billing/readings">
              <Button className="w-full" variant="default">
                <i className="fas fa-plus mr-2"></i>
                Generate Monthly Bills
              </Button>
            </Link>
            <Link href="/billing/summary">
              <Button className="w-full" variant="outline">
                <i className="fas fa-eye mr-2"></i>
                View Current Month
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}