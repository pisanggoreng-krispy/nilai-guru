'use client';

import { GradeStatistics } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface StatisticsProps {
  statistics: GradeStatistics;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  iconBgColor?: string;
}

function StatCard({ title, value, icon, description, iconBgColor = 'bg-primary/10' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBgColor}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Statistics({ statistics }: StatisticsProps) {
  const { 
    highest, 
    lowest, 
    average, 
    totalStudents, 
    gradedStudents, 
    gradeDistribution 
  } = statistics;

  const completionPercentage = totalStudents > 0 
    ? Math.round((gradedStudents / totalStudents) * 100) 
    : 0;

  // Distribution labels
  const distributionItems = [
    { label: 'Sangat Baik (90-100)', count: gradeDistribution.excellent, color: 'bg-emerald-500' },
    { label: 'Baik (80-89)', count: gradeDistribution.veryGood, color: 'bg-green-500' },
    { label: 'Cukup Baik (70-79)', count: gradeDistribution.good, color: 'bg-blue-500' },
    { label: 'Cukup (60-69)', count: gradeDistribution.fair, color: 'bg-yellow-500' },
    { label: 'Kurang (<60)', count: gradeDistribution.poor, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Nilai Tertinggi"
          value={highest.toFixed(2)}
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          iconBgColor="bg-emerald-100"
        />
        <StatCard
          title="Nilai Terendah"
          value={lowest.toFixed(2)}
          icon={<TrendingDown className="h-5 w-5 text-red-600" />}
          iconBgColor="bg-red-100"
        />
        <StatCard
          title="Rata-rata"
          value={average.toFixed(2)}
          icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="Status"
          value={`${gradedStudents}/${totalStudents}`}
          icon={
            gradedStudents === totalStudents 
              ? <CheckCircle2 className="h-5 w-5 text-green-600" />
              : <AlertCircle className="h-5 w-5 text-orange-600" />
          }
          iconBgColor={gradedStudents === totalStudents ? "bg-green-100" : "bg-orange-100"}
          description={`${completionPercentage}% selesai`}
        />
      </div>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Progress Input Nilai</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={completionPercentage} className="flex-1" />
            <span className="text-sm font-medium w-12 text-right">{completionPercentage}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {gradedStudents} dari {totalStudents} siswa telah memiliki nilai lengkap
          </p>
        </CardContent>
      </Card>

      {/* Grade Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Distribusi Nilai</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {distributionItems.map((item) => {
              const percentage = gradedStudents > 0 
                ? Math.round((item.count / gradedStudents) * 100) 
                : 0;
              
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm flex-1">{item.label}</span>
                  <div className="flex items-center gap-2 w-32">
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                    <span className="text-xs text-muted-foreground w-8">
                      {item.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
