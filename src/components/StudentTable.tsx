'use client';

import { useCallback, useEffect, useRef } from 'react';
import { StudentGrade } from '@/types';
import { calculateFinalGrade, formatGrade, getGradeColor, parseGradeInput } from '@/lib/gradeUtils';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StudentTableProps {
  grades: StudentGrade[];
  onGradeChange: (studentId: string, field: keyof Omit<StudentGrade, 'studentId' | 'studentName' | 'finalGrade'>, value: number | null) => void;
}

const GRADE_FIELDS: { key: keyof Omit<StudentGrade, 'studentId' | 'studentName' | 'finalGrade'>; label: string; weight: string }[] = [
  { key: 'tugas1', label: 'Tugas 1', weight: '5%' },
  { key: 'tugas2', label: 'Tugas 2', weight: '5%' },
  { key: 'ulangan1', label: 'Ulangan 1', weight: '10%' },
  { key: 'ulangan2', label: 'Ulangan 2', weight: '10%' },
  { key: 'midTest', label: 'Mid Test', weight: '30%' },
  { key: 'uas', label: 'UAS', weight: '40%' },
];

export default function StudentTable({ grades, onGradeChange }: StudentTableProps) {
  const handleInputChange = useCallback(
    (studentId: string, field: keyof Omit<StudentGrade, 'studentId' | 'studentName' | 'finalGrade'>, value: string) => {
      const parsedValue = parseGradeInput(value);
      onGradeChange(studentId, field, parsedValue);
    },
    [onGradeChange]
  );

  // Use ref for scroll area
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Calculate final grade for each student
  const getStudentFinalGrade = useCallback((student: StudentGrade): number | null => {
    return calculateFinalGrade(
      student.tugas1,
      student.tugas2,
      student.ulangan1,
      student.ulangan2,
      student.midTest,
      student.uas
    );
  }, []);

  return (
    <div className="rounded-lg border bg-card">
      <ScrollArea className="h-[500px]" ref={scrollAreaRef}>
        <Table>
          <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/60 z-10">
            <TableRow>
              <TableHead className="w-12 text-center font-semibold">No</TableHead>
              <TableHead className="min-w-[180px] font-semibold">Nama Siswa</TableHead>
              {GRADE_FIELDS.map((field) => (
                <TableHead key={field.key} className="w-24 text-center font-semibold">
                  <div className="flex flex-col items-center gap-1">
                    <span>{field.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {field.weight}
                    </Badge>
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-24 text-center font-semibold bg-primary/10">
                <div className="flex flex-col items-center gap-1">
                  <span>Nilai Final</span>
                  <Badge variant="default" className="text-xs">
                    100%
                  </Badge>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.map((student, index) => {
              const finalGrade = getStudentFinalGrade(student);
              const gradeColor = getGradeColor(finalGrade);

              return (
                <TableRow key={student.studentId} className="hover:bg-muted/50">
                  <TableCell className="text-center font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{student.studentName}</TableCell>
                  {GRADE_FIELDS.map((field) => (
                    <TableCell key={field.key} className="p-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="-"
                        value={student[field.key] ?? ''}
                        onChange={(e) => handleInputChange(student.studentId, field.key, e.target.value)}
                        className="w-full text-center h-9"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-center">
                    <span className={`text-lg font-bold ${gradeColor}`}>
                      {formatGrade(finalGrade)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
