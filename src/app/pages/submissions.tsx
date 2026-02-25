import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Search, Filter } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { getCampaign, getCampaignSubmissions } from '../lib/storage';
import { formatDate, exportToCSV } from '../lib/utils';

export function Submissions() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (id) {
      const c = getCampaign(id);
      const s = getCampaignSubmissions(id);
      setCampaign(c);
      setSubmissions(s);
    }
  }, [id]);
  
  const handleExport = () => {
    if (submissions.length > 0) {
      exportToCSV(submissions, `${campaign.name}-submissions.csv`);
    }
  };
  
  const filteredSubmissions = submissions.filter(sub => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return Object.values(sub.data).some(value =>
      String(value).toLowerCase().includes(searchLower)
    );
  });
  
  // Get all unique field names from submissions
  const fieldNames = new Set<string>();
  submissions.forEach(sub => {
    Object.keys(sub.data).forEach(key => fieldNames.add(key));
  });
  
  if (!campaign) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Campaign not found</p>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
            <p className="text-gray-600">Form Submissions</p>
          </div>
          
          <div className="flex gap-2">
            <Link href={`/analytics/${id}`}>
              <Button variant="outline">View Analytics</Button>
            </Link>
            <Button onClick={handleExport} disabled={submissions.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Submissions</p>
          <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">This Week</p>
          <p className="text-2xl font-bold text-gray-900">
            {submissions.filter(s => {
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return new Date(s.timestamp) > weekAgo;
            }).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Today</p>
          <p className="text-2xl font-bold text-gray-900">
            {submissions.filter(s => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return new Date(s.timestamp) > today;
            }).length}
          </p>
        </Card>
      </div>
      
      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search submissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Submissions Table */}
      <Card>
        {submissions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600">
                Once people start submitting your form, you'll see their responses here
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Variant</TableHead>
                  {Array.from(fieldNames).map(field => (
                    <TableHead key={field}>{field}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => {
                  const variant = campaign.variants.find((v: any) => v.id === submission.variantId);
                  
                  return (
                    <TableRow key={submission.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(submission.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{variant?.name || 'Unknown'}</Badge>
                      </TableCell>
                      {Array.from(fieldNames).map(field => {
                        const value = submission.data[field];
                        return (
                          <TableCell key={field}>
                            {Array.isArray(value) ? value.join(', ') : value || '-'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
