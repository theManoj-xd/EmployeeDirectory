import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../services/employee-service';
import { Employee } from '../models/employee.model';

@Component({
  selector: 'app-employee-list',
  imports: [CommonModule, DecimalPipe, DatePipe],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css',
})
export class EmployeeList implements OnInit
{
  private employeeService: EmployeeService = inject(EmployeeService);
  employees = signal<Employee[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void
  {
    this.isLoading.set(true);
    this.employeeService.getEmployees()
    .subscribe({
      next: (data: Employee[]) => {
        this.employees.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error fetching employees:', error);
        this.isLoading.set(false);
      }
    })
  }
}
